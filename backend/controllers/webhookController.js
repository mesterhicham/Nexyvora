const db = require('../config/db');
const crypto = require('crypto');

/**
 * Handle incoming webhook notifications from payment providers
 * (e.g. NOWPayments, Stripe, Custom Crypto gateways)
 */
exports.handleGatewayWebhook = async (req, res) => {
    const provider = (req.params.provider || req.body?.provider || 'nowpayments').toLowerCase();
    const signature = req.headers['x-signature'] || 
                      req.headers['x-webhook-signature'] || 
                      req.headers['x-nowpayments-sig'] ||
                      req.headers['stripe-signature'];

    // 1. Check payment provider in payment_methods
    const [methods] = await db.query(
        'SELECT * FROM payment_methods WHERE (LOWER(provider) = ? OR LOWER(type) = ?) AND status = "active" LIMIT 1',
        [provider, provider]
    );

    if (methods.length === 0) {
        return res.status(404).json({ error: `Unknown or inactive payment provider: ${provider}` });
    }

    const method = methods[0];
    const webhookSecret = (method.webhook_secret && method.webhook_secret.trim()) 
        ? method.webhook_secret 
        : (process.env.WEBHOOK_SECRET || 'nexyvora_whsec_default');

    // 2. Signature verification
    if (!signature) {
        return res.status(401).json({ error: 'Missing webhook signature header' });
    }

    try {
        const payloadString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(payloadString)
            .digest('hex');

        const cleanSig = signature.replace(/^sha256=/, '').trim();
        const expectedBuf = Buffer.from(expectedSignature, 'hex');
        const incomingBuf = Buffer.from(cleanSig, 'hex');

        if (expectedBuf.length !== incomingBuf.length || !crypto.timingSafeEqual(expectedBuf, incomingBuf)) {
            return res.status(401).json({ error: 'Invalid webhook signature' });
        }
    } catch (err) {
        return res.status(401).json({ error: 'Failed to verify signature: ' + err.message });
    }

    // 3. Extract payload details
    const {
        payment_id,
        event_id,
        transaction_id,
        user_id,
        customer_id,
        amount,
        actually_paid,
        expected_amount,
        currency = 'USD'
    } = req.body || {};

    const eventId = String(payment_id || event_id || transaction_id || '').trim();
    if (!eventId) {
        return res.status(400).json({ error: 'Missing payment event or transaction ID' });
    }

    const targetUserId = user_id || customer_id;
    if (!targetUserId) {
        return res.status(400).json({ error: 'Missing target user ID' });
    }

    const receivedAmount = Number(actually_paid !== undefined ? actually_paid : amount);
    const expected = expected_amount !== undefined ? Number(expected_amount) : receivedAmount;

    if (isNaN(receivedAmount) || receivedAmount <= 0) {
        return res.status(400).json({ error: 'Invalid received amount' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 4. Replay / Duplicate Prevention
        const [existingTrx] = await connection.query(
            'SELECT id, status, amount FROM transactions WHERE reference_id = ? FOR UPDATE',
            [eventId]
        );

        if (existingTrx.length > 0) {
            await connection.rollback();
            return res.status(409).json({
                error: 'Duplicate webhook notification: Event ID already processed',
                eventId,
                status: existingTrx[0].status
            });
        }

        // 5. Verify user exists
        const [userRows] = await connection.query('SELECT id FROM users WHERE id = ?', [targetUserId]);
        if (userRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Target user does not exist' });
        }

        // 6. Underpayment / Overpayment Policy:
        // Credit ONLY the exact amount actually received in the wallet
        const amountToCredit = Number(receivedAmount.toFixed(2));
        const isUnderpaid = expected > 0 && receivedAmount < expected;
        const isOverpaid = expected > 0 && receivedAmount > expected;

        // Fetch or create user wallet with lock
        let [wallets] = await connection.query('SELECT * FROM user_wallets WHERE user_id = ? FOR UPDATE', [targetUserId]);
        if (wallets.length === 0) {
            const wId = crypto.randomUUID();
            await connection.query(
                'INSERT INTO user_wallets (id, user_id, balance, pending_balance, total_earned, total_withdrawn) VALUES (?, ?, 0.00, 0.00, 0.00, 0.00)',
                [wId, targetUserId]
            );
            wallets = [{ id: wId, user_id: targetUserId, balance: 0 }];
        }

        const currentBal = Number(wallets[0].balance);
        const newBal = Number((currentBal + amountToCredit).toFixed(2));

        // Update wallet balance strictly by received amount
        await connection.query('UPDATE user_wallets SET balance = balance + ? WHERE user_id = ?', [amountToCredit, targetUserId]);

        // Insert completed transaction in ledger
        const trxId = crypto.randomUUID();
        const description = `Webhook payment (${provider}): received $${amountToCredit} ${currency}` +
            (isUnderpaid ? ` [جزئي/Underpaid: expected $${expected}]` : '') +
            (isOverpaid ? ` [فائض/Overpaid: expected $${expected}]` : '');

        await connection.query(`
            INSERT INTO transactions (id, user_id, type, amount, currency, balance_before, balance_after, status, reference_id, description, metadata)
            VALUES (?, ?, 'deposit', ?, ?, ?, ?, 'completed', ?, ?, ?)
        `, [
            trxId,
            targetUserId,
            amountToCredit,
            currency,
            currentBal,
            newBal,
            eventId,
            description,
            JSON.stringify({
                provider,
                eventId,
                receivedAmount,
                expectedAmount: expected,
                isUnderpaid,
                isOverpaid
            })
        ]);

        await connection.commit();

        res.status(200).json({
            success: true,
            eventId,
            creditedAmount: amountToCredit,
            isUnderpaid,
            isOverpaid,
            newBalance: newBal
        });
    } catch (err) {
        await connection.rollback();
        console.error('[handleGatewayWebhook]', err);
        res.status(500).json({ error: 'Failed to process webhook: ' + err.message });
    } finally {
        connection.release();
    }
};
