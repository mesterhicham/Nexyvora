const db = require('../config/db');
const crypto = require('crypto');
const nowpaymentsService = require('../services/nowpaymentsService');

class PaymentRenewalWorker {
    constructor() {
        this.isRunning = false;
        this.intervalHandle = null;
        this.renewalWindowMinutes = 20; // 20 minutes renewal interval
        this.maxAttempts = 6; // Maximum 6 attempts (2 hours total window)
        this.workerId = `worker-${process.pid}-${crypto.randomBytes(4).toString('hex')}`;
    }

    /**
     * Acquire distributed lock using MySQL named lock and cron_locks table
     */
    async acquireLock(lockName = 'payment_renewal_worker', ttlSeconds = 120) {
        try {
            // 1. MySQL Session Named Lock (non-blocking)
            const [namedLockRows] = await db.query('SELECT GET_LOCK(?, 0) AS acquired', [lockName]);
            if (!namedLockRows[0] || namedLockRows[0].acquired !== 1) {
                return false;
            }

            // 2. Persistent cron_locks table update
            await db.query(
                `INSERT INTO cron_locks (lock_name, locked_by, acquired_at, expires_at)
                 VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? SECOND))
                 ON DUPLICATE KEY UPDATE
                    locked_by = IF(expires_at < NOW(), VALUES(locked_by), locked_by),
                    acquired_at = IF(expires_at < NOW(), NOW(), acquired_at),
                    expires_at = IF(expires_at < NOW(), DATE_ADD(NOW(), INTERVAL ? SECOND), expires_at)`,
                [lockName, this.workerId, ttlSeconds, ttlSeconds]
            );

            return true;
        } catch (err) {
            console.error('[PaymentRenewalWorker] Error acquiring lock:', err.message);
            return false;
        }
    }

    /**
     * Release distributed lock
     */
    async releaseLock(lockName = 'payment_renewal_worker') {
        try {
            await db.query('DELETE FROM cron_locks WHERE lock_name = ? AND locked_by = ?', [lockName, this.workerId]);
            await db.query('SELECT RELEASE_LOCK(?)', [lockName]);
        } catch (err) {
            console.error('[PaymentRenewalWorker] Error releasing lock:', err.message);
        }
    }

    /**
     * Execute one complete cycle of checking and renewing eligible deposit sessions
     */
    async runRenewalCycle() {
        const hasLock = await this.acquireLock();
        if (!hasLock) {
            return { skipped: true, reason: 'Lock held by another worker instance' };
        }

        const results = {
            checked: 0,
            renewed: 0,
            expired: 0,
            failed: 0,
            errors: []
        };

        try {
            // Find pending deposit transactions that have active attempts eligible for renewal
            const [dueSessions] = await db.query(`
                SELECT 
                    t.id AS transaction_id,
                    t.user_id,
                    t.amount,
                    t.currency,
                    t.status AS transaction_status,
                    t.metadata,
                    t.created_at,
                    COALESCE(latest_att.attempt_count, 0) AS total_attempts,
                    latest_att.latest_attempt_number,
                    latest_att.latest_attempt_id,
                    latest_att.next_renewal_at,
                    latest_att.is_wallet_credited
                FROM transactions t
                INNER JOIN (
                    SELECT 
                        transaction_id,
                        COUNT(id) AS attempt_count,
                        MAX(attempt_number) AS latest_attempt_number,
                        SUBSTRING_INDEX(GROUP_CONCAT(id ORDER BY attempt_number DESC), ',', 1) AS latest_attempt_id,
                        SUBSTRING_INDEX(GROUP_CONCAT(next_renewal_at ORDER BY attempt_number DESC), ',', 1) AS next_renewal_at,
                        MAX(is_wallet_credited) AS is_wallet_credited
                    FROM payment_attempts
                    WHERE provider = 'nowpayments'
                    GROUP BY transaction_id
                ) latest_att ON t.id = latest_att.transaction_id
                WHERE t.type = 'deposit'
                  AND t.status = 'pending'
                  AND latest_att.is_wallet_credited = 0
                  AND latest_att.next_renewal_at <= NOW()
                ORDER BY latest_att.next_renewal_at ASC
                LIMIT 25
            `);

            results.checked = dueSessions.length;

            for (const session of dueSessions) {
                const sessionRes = await this.renewSession(session);
                if (sessionRes.renewed) results.renewed++;
                if (sessionRes.expired) results.expired++;
                if (sessionRes.failed) {
                    results.failed++;
                    if (sessionRes.error) results.errors.push(sessionRes.error);
                }
            }
        } catch (err) {
            console.error('[PaymentRenewalWorker] Cycle error:', err);
            results.errors.push(err.message);
        } finally {
            await this.releaseLock();
        }

        return results;
    }

    /**
     * Renew an individual deposit session atomically
     */
    async renewSession(session) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Lock transaction row to prevent race conditions with webhook or concurrent workers
            const [trxRows] = await connection.query(
                'SELECT id, status, amount, currency, metadata FROM transactions WHERE id = ? FOR UPDATE',
                [session.transaction_id]
            );

            if (trxRows.length === 0) {
                await connection.rollback();
                return { skipped: true, reason: 'Transaction not found' };
            }

            const trx = trxRows[0];

            // 1. Ineligibility guards:
            // Do NOT renew if already paid, completed, cancelled, or credited
            if (trx.status !== 'pending') {
                await connection.rollback();
                return { skipped: true, reason: `Transaction is no longer pending (${trx.status})` };
            }

            // Lock existing attempts for this transaction
            const [attempts] = await connection.query(
                'SELECT id, attempt_number, status, is_wallet_credited FROM payment_attempts WHERE transaction_id = ? FOR UPDATE',
                [session.transaction_id]
            );

            const hasCredited = attempts.some(a => a.is_wallet_credited === 1);
            if (hasCredited) {
                await connection.rollback();
                return { skipped: true, reason: 'Deposit session is already credited in wallet' };
            }

            const currentAttemptCount = attempts.length;
            const nextAttemptNumber = currentAttemptCount + 1;

            // 2. Maximum attempts threshold guard
            if (currentAttemptCount >= this.maxAttempts) {
                // Mark session as expired due to max renewals exceeded
                let meta = {};
                try {
                    meta = typeof trx.metadata === 'string' ? JSON.parse(trx.metadata || '{}') : (trx.metadata || {});
                } catch (e) {}

                meta.renewal_ended_reason = `Maximum renewal attempts (${this.maxAttempts}) reached without completed payment`;
                meta.expired_at = new Date().toISOString();

                await connection.query(
                    'UPDATE transactions SET status = "expired", metadata = ? WHERE id = ?',
                    [JSON.stringify(meta), trx.id]
                );

                await connection.query(
                    'UPDATE payment_attempts SET status = "expired" WHERE transaction_id = ? AND status = "waiting"',
                    [trx.id]
                );

                await connection.commit();
                return { expired: true, message: `Max attempts (${this.maxAttempts}) reached; marked as expired` };
            }

            // 3. Generate replacement payment order from NOWPayments API
            let newPaymentData;
            try {
                newPaymentData = await nowpaymentsService.createPayment({
                    priceAmount: Number(trx.amount),
                    priceCurrency: trx.currency || 'USD',
                    orderId: trx.id,
                    orderDescription: `Nexyvora Deposit #${trx.id} (Attempt ${nextAttemptNumber})`
                });
            } catch (apiErr) {
                // Handle API or temporary network errors: apply exponential backoff retry to this attempt
                console.error(`[PaymentRenewalWorker] NOWPayments API failure on attempt ${nextAttemptNumber}:`, apiErr.message);

                // Delay next renewal by 5 minutes to avoid flood
                await connection.query(
                    `UPDATE payment_attempts 
                     SET next_renewal_at = DATE_ADD(NOW(), INTERVAL 5 MINUTE),
                         renewal_error = ?
                     WHERE id = ?`,
                    [apiErr.message.substring(0, 500), session.latest_attempt_id]
                );

                await connection.commit();
                return { failed: true, error: apiErr.message };
            }

            // 4. Save new attempt as an independent persistent record linked to parent transaction
            const attemptId = crypto.randomUUID();
            const nextRenewalTime = new Date(Date.now() + this.renewalWindowMinutes * 60 * 1000);

            await connection.query(`
                INSERT INTO payment_attempts (
                    id, transaction_id, user_id, provider, provider_payment_id, provider_order_id,
                    attempt_number, pay_address, pay_amount, pay_currency, price_amount, price_currency,
                    network, status, is_wallet_credited, next_renewal_at, metadata
                ) VALUES (?, ?, ?, 'nowpayments', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'waiting', 0, ?, ?)
            `, [
                attemptId,
                trx.id,
                session.user_id,
                newPaymentData.paymentId,
                trx.id,
                nextAttemptNumber,
                newPaymentData.payAddress,
                newPaymentData.payAmount,
                newPaymentData.payCurrency,
                newPaymentData.priceAmount,
                newPaymentData.priceCurrency,
                newPaymentData.network || 'bsc',
                nextRenewalTime,
                JSON.stringify({
                    previousAttemptNumber: nextAttemptNumber - 1,
                    renewedAt: new Date().toISOString(),
                    rawResponse: newPaymentData.raw
                })
            ]);

            // Update parent transaction metadata with latest active instructions
            let trxMeta = {};
            try {
                trxMeta = typeof trx.metadata === 'string' ? JSON.parse(trx.metadata || '{}') : (trx.metadata || {});
            } catch (e) {}

            trxMeta.active_attempt_id = attemptId;
            trxMeta.active_attempt_number = nextAttemptNumber;
            trxMeta.active_payment_id = newPaymentData.paymentId;
            trxMeta.active_pay_address = newPaymentData.payAddress;
            trxMeta.active_pay_amount = newPaymentData.payAmount;
            trxMeta.active_pay_currency = newPaymentData.payCurrency;
            trxMeta.active_network = newPaymentData.network;
            trxMeta.last_renewed_at = new Date().toISOString();
            trxMeta.next_renewal_at = nextRenewalTime.toISOString();

            await connection.query(
                'UPDATE transactions SET metadata = ? WHERE id = ?',
                [JSON.stringify(trxMeta), trx.id]
            );

            await connection.commit();
            return { renewed: true, attemptNumber: nextAttemptNumber, attemptId };
        } catch (err) {
            await connection.rollback();
            console.error(`[PaymentRenewalWorker] Error renewing session ${session.transaction_id}:`, err);
            return { failed: true, error: err.message };
        } finally {
            connection.release();
        }
    }

    /**
     * Start background daemon interval (runs every 60 seconds to process due renewals)
     */
    start(intervalMs = 60000) {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log(`[PaymentRenewalWorker] Started background renewal scheduler (poll interval: ${intervalMs / 1000}s, renewal cycle: ${this.renewalWindowMinutes}m)`);

        this.intervalHandle = setInterval(async () => {
            try {
                await this.runRenewalCycle();
            } catch (err) {
                console.error('[PaymentRenewalWorker] Uncaught scheduler error:', err);
            }
        }, intervalMs);
    }

    /**
     * Stop background daemon
     */
    stop() {
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = null;
        }
        this.isRunning = false;
        console.log('[PaymentRenewalWorker] Background scheduler stopped.');
    }
}

module.exports = new PaymentRenewalWorker();
