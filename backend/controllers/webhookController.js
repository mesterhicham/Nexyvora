const db = require('../config/db');
const crypto = require('crypto');

/**
 * Recursively sort object keys alphabetically for official NOWPayments IPN verification
 */
function sortObjectKeys(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sortObjectKeys);
    return Object.keys(obj).sort().reduce((acc, key) => {
        acc[key] = sortObjectKeys(obj[key]);
        return acc;
    }, {});
}

/**
 * Verify NOWPayments IPN signature according to official specification:
 * HMAC-SHA512 of alphabetically key-sorted JSON payload
 */
function verifyNowPaymentsSignature(req, webhookSecret) {
    const signature = req.headers['x-nowpayments-sig'];
    if (!signature) {
        return { valid: false, error: 'Missing x-nowpayments-sig header' };
    }

    try {
        const sorted = sortObjectKeys(req.body);
        const serialized = JSON.stringify(sorted);
        const expectedSignature = crypto
            .createHmac('sha512', webhookSecret)
            .update(serialized)
            .digest('hex');

        const cleanSig = signature.trim().toLowerCase();
        const expectedBuf = Buffer.from(expectedSignature, 'hex');
        const incomingBuf = Buffer.from(cleanSig, 'hex');

        if (expectedBuf.length !== incomingBuf.length || !crypto.timingSafeEqual(expectedBuf, incomingBuf)) {
            return { valid: false, error: 'Invalid NOWPayments IPN signature' };
        }
        return { valid: true };
    } catch (err) {
        return { valid: false, error: 'Failed to verify NOWPayments signature: ' + err.message };
    }
}

/**
 * Verify Stripe webhook signature according to official specification:
 * stripe-signature header: t=timestamp,v1=signature
 * HMAC-SHA256 of timestamp.rawBody
 */
function verifyStripeSignature(req, webhookSecret) {
    const sigHeader = req.headers['stripe-signature'];
    if (!sigHeader) {
        return { valid: false, error: 'Missing stripe-signature header' };
    }

    try {
        const elements = sigHeader.split(',').reduce((acc, part) => {
            const [k, v] = part.split('=');
            if (k && v) acc[k.trim()] = v.trim();
            return acc;
        }, {});

        const timestamp = elements['t'];
        const incomingSig = elements['v1'];

        if (!timestamp || !incomingSig) {
            return { valid: false, error: 'Malformed stripe-signature header' };
        }

        // Tolerance check: 5 minutes (300 seconds)
        const age = Math.abs(Math.floor(Date.now() / 1000) - parseInt(timestamp, 10));
        if (age > 300) {
            return { valid: false, error: 'Stripe webhook signature timestamp expired' };
        }

        const rawPayload = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);
        const signedPayload = `${timestamp}.${rawPayload}`;
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(signedPayload)
            .digest('hex');

        const expectedBuf = Buffer.from(expectedSignature, 'hex');
        const incomingBuf = Buffer.from(incomingSig, 'hex');

        if (expectedBuf.length !== incomingBuf.length || !crypto.timingSafeEqual(expectedBuf, incomingBuf)) {
            return { valid: false, error: 'Invalid Stripe webhook signature' };
        }
        return { valid: true };
    } catch (err) {
        return { valid: false, error: 'Failed to verify Stripe signature: ' + err.message };
    }
}

/**
 * Handle incoming webhook notifications from payment providers
 */
exports.handleGatewayWebhook = async (req, res) => {
    const rawProvider = (req.params.provider || req.body?.provider || '').toLowerCase().trim();

    if (!rawProvider) {
        return res.status(400).json({ error: 'Payment provider parameter is required' });
    }

    // Supported official providers
    const supportedProviders = ['nowpayments', 'stripe'];
    if (!supportedProviders.includes(rawProvider)) {
        return res.status(501).json({
            error: `Payment provider '${rawProvider}' is not supported or currently disabled. Supported providers: ${supportedProviders.join(', ')}`
        });
    }

    // 1. Fetch active payment method and secret from database
    const [methods] = await db.query(
        'SELECT * FROM payment_methods WHERE (LOWER(provider) = ? OR LOWER(type) = ?) AND status = "active" LIMIT 1',
        [rawProvider, rawProvider]
    );

    if (methods.length === 0) {
        return res.status(404).json({ error: `Payment provider '${rawProvider}' is not configured or is inactive in payment methods` });
    }

    const method = methods[0];
    const webhookSecret = (method.webhook_secret && method.webhook_secret.trim()) || process.env[`WEBHOOK_SECRET_${rawProvider.toUpperCase()}`];

    // Strictly reject if secret is not configured - NO DEFAULT SECRETS ALLOWED
    if (!webhookSecret) {
        console.error(`[Webhook Security Error] Webhook secret not configured for provider '${rawProvider}'. Request rejected.`);
        return res.status(500).json({ error: 'Gateway configuration error: webhook secret not configured' });
    }

    // 2. Perform provider-specific cryptographic signature verification
    let verificationResult = { valid: false, error: 'Unsupported verification' };
    if (rawProvider === 'nowpayments') {
        verificationResult = verifyNowPaymentsSignature(req, webhookSecret);
    } else if (rawProvider === 'stripe') {
        verificationResult = verifyStripeSignature(req, webhookSecret);
    }

    if (!verificationResult.valid) {
        return res.status(401).json({ error: verificationResult.error });
    }

    // 3. Extract payload details
    const {
        payment_id,
        event_id,
        transaction_id,
        id,
        user_id,
        customer_id,
        amount,
        actually_paid,
        pay_amount,
        expected_amount,
        currency = 'USD'
    } = req.body || {};

    const eventId = String(payment_id || event_id || transaction_id || id || '').trim();
    if (!eventId) {
        return res.status(400).json({ error: 'Missing payment event or transaction ID' });
    }

    const targetUserId = user_id || customer_id;
    if (!targetUserId) {
        return res.status(400).json({ error: 'Missing target user ID' });
    }

    const rawReceived = actually_paid !== undefined ? actually_paid : (pay_amount !== undefined ? pay_amount : amount);
    const receivedAmount = Number(rawReceived);
    const expected = expected_amount !== undefined ? Number(expected_amount) : receivedAmount;

    if (isNaN(receivedAmount) || receivedAmount <= 0) {
        return res.status(400).json({ error: 'Invalid received amount' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 4. Replay / Duplicate Prevention Check
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

        // Insert completed transaction in ledger with unique reference_id
        const trxId = crypto.randomUUID();
        const description = `Webhook payment (${rawProvider}): received $${amountToCredit} ${currency}` +
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
                provider: rawProvider,
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
            provider: rawProvider,
            eventId,
            creditedAmount: amountToCredit,
            isUnderpaid,
            isOverpaid,
            newBalance: newBal
        });
    } catch (err) {
        await connection.rollback();
        // Specifically handle race-condition duplicate key errors
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                error: 'Duplicate webhook notification: Event ID already processed (database constraint caught concurrent duplicate)',
                eventId
            });
        }
        console.error('[handleGatewayWebhook]', err.message);
        res.status(500).json({ error: 'Failed to process webhook' });
    } finally {
        connection.release();
    }
};
