const db = require('../config/db');
const crypto = require('crypto');
const emailService = require('../services/emailService');

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
 * Parse NOWPayments IPN payload according to official specifications
 * Distinguishes between invoice fiat (price_amount/price_currency) and cryptocurrency paid (pay_amount/pay_currency/actually_paid).
 * Never substitutes price_amount for actually_paid.
 */
function parseNowPaymentsPayload(body) {
    const paymentId = String(body.payment_id || body.id || '').trim();
    const eventId = String(body.payment_id || body.event_id || body.id || '').trim();
    const internalOrderId = String(body.order_id || body.order_description || body.custom_id || '').trim();
    const rawStatus = String(body.payment_status || body.status || '').toLowerCase().trim();
    const priceCurrency = String(body.price_currency || 'USD').toUpperCase().trim();
    const payCurrency = String(body.pay_currency || body.price_currency || 'USD').toUpperCase().trim();
    const currency = priceCurrency; // Accounting currency of the order

    const priceAmount = body.price_amount !== undefined && body.price_amount !== null ? Number(body.price_amount) : undefined;
    const payAmount = body.pay_amount !== undefined && body.pay_amount !== null ? Number(body.pay_amount) : undefined;
    const actuallyPaid = body.actually_paid !== undefined && body.actually_paid !== null ? Number(body.actually_paid) : undefined;
    const actuallyPaidAtFiat = body.actually_paid_at_fiat !== undefined && body.actually_paid_at_fiat !== null ? Number(body.actually_paid_at_fiat) : undefined;

    // Status classification according to NOWPayments documentation
    const isCompletedStatus = ['finished', 'confirmed'].includes(rawStatus);
    const isNonFinal = ['waiting', 'confirming', 'sending', 'partially_paid'].includes(rawStatus);
    const isFailed = ['failed', 'refunded', 'expired'].includes(rawStatus);

    let confirmedFiatAmount = 0;
    let hasValidPaymentAmount = false;
    let calculationPolicy = 'unverified';

    // Verify actually_paid strictly: must be a positive number
    if (actuallyPaid !== undefined && !isNaN(actuallyPaid) && actuallyPaid > 0) {
        if (payCurrency === priceCurrency) {
            // Direct fiat / pegged currency match
            confirmedFiatAmount = Number(actuallyPaid.toFixed(2));
            hasValidPaymentAmount = true;
            calculationPolicy = 'direct_currency_match';
        } else if (actuallyPaidAtFiat !== undefined && !isNaN(actuallyPaidAtFiat) && actuallyPaidAtFiat > 0) {
            // Official gateway fiat valuation
            confirmedFiatAmount = Number(actuallyPaidAtFiat.toFixed(2));
            hasValidPaymentAmount = true;
            calculationPolicy = 'gateway_fiat_valuation';
        } else if (payAmount !== undefined && !isNaN(payAmount) && payAmount > 0 && priceAmount !== undefined && !isNaN(priceAmount) && priceAmount > 0) {
            // Relative crypto fulfillment ratio: (actually_paid / pay_amount) * price_amount
            const fulfillmentRatio = actuallyPaid / payAmount;
            confirmedFiatAmount = Number((priceAmount * fulfillmentRatio).toFixed(2));
            hasValidPaymentAmount = true;
            calculationPolicy = 'crypto_fulfillment_ratio';
        } else {
            // Exchange rate cannot be proven from gateway data - DO NOT DEFAULT OR GUESS
            hasValidPaymentAmount = false;
            confirmedFiatAmount = 0;
            calculationPolicy = 'unverifiable_crypto_rate';
        }
    } else {
        // Missing, null, zero or negative actually_paid - NEVER fall back to price_amount
        hasValidPaymentAmount = false;
        confirmedFiatAmount = 0;
        calculationPolicy = 'missing_or_invalid_actually_paid';
    }

    const isCompleted = isCompletedStatus && hasValidPaymentAmount && confirmedFiatAmount > 0;
    const claimedUserId = body.user_id || body.customer_id || null;

    return {
        provider: 'nowpayments',
        eventId,
        paymentId,
        internalOrderId,
        rawStatus,
        currency,
        priceCurrency,
        payCurrency,
        priceAmount,
        payAmount,
        actuallyPaid,
        amount: confirmedFiatAmount,
        expectedAmount: priceAmount || confirmedFiatAmount,
        hasValidPaymentAmount,
        calculationPolicy,
        claimedUserId,
        isCompleted,
        isNonFinal,
        isFailed,
        isSupportedType: true
    };
}

/**
 * Parse Stripe Webhook Event payload according to official Stripe specifications
 * Validates event.type, object type parity, cents conversion, and explicit order linking.
 */
function parseStripePayload(body) {
    const eventId = String(body.id || '').trim();
    const eventType = String(body.type || '').trim();
    const object = body.data?.object || body;
    const objectType = String(object.object || '').trim();
    const paymentId = String(object.id || '').trim();

    // Internal order ID from metadata, client_reference_id, or payment intent
    const internalOrderId = String(
        object.client_reference_id ||
        object.metadata?.order_id ||
        object.metadata?.internal_id ||
        object.metadata?.payment_id ||
        ''
    ).trim();

    const claimedUserId = object.metadata?.user_id || object.metadata?.customer_id || null;
    const currency = String(object.currency || 'USD').toUpperCase().trim();

    // Supported Stripe event types and their required object type schema
    const supportedTypeMap = {
        'checkout.session.completed': 'checkout.session',
        'checkout.session.expired': 'checkout.session',
        'payment_intent.succeeded': 'payment_intent',
        'payment_intent.payment_failed': 'payment_intent',
        'payment_intent.canceled': 'payment_intent',
        'payment_intent.processing': 'payment_intent',
        'payment_intent.created': 'payment_intent',
        'charge.succeeded': 'charge',
        'charge.failed': 'charge'
    };

    const isSupportedType = Object.prototype.hasOwnProperty.call(supportedTypeMap, eventType);
    let isObjectTypeValid = true;
    let objectTypeError = null;

    if (isSupportedType && objectType) {
        const expectedObjectType = supportedTypeMap[eventType];
        if (objectType !== expectedObjectType) {
            isObjectTypeValid = false;
            objectTypeError = `Stripe object type mismatch: event '${eventType}' expects object '${expectedObjectType}', got '${objectType}'`;
        }
    }

    // In Stripe, amounts in the object are in cents (smallest currency unit, e.g. 5000 = $50.00)
    let rawAmount = 0;
    if (object.amount_total !== undefined) {
        rawAmount = Number(object.amount_total) / 100;
    } else if (object.amount_received !== undefined) {
        rawAmount = Number(object.amount_received) / 100;
    } else if (object.amount !== undefined) {
        rawAmount = Number(object.amount) / 100;
    }
    const amount = Number(rawAmount.toFixed(2));
    const expectedAmount = amount;

    let rawStatus = 'unknown';
    let isCompleted = false;
    let isNonFinal = false;
    let isFailed = false;

    if (eventType === 'checkout.session.completed') {
        const paymentStatus = (object.payment_status || '').toLowerCase().trim();
        rawStatus = paymentStatus;
        if (paymentStatus === 'paid') {
            isCompleted = true;
        } else {
            isNonFinal = true;
        }
    } else if (eventType === 'payment_intent.succeeded' || eventType === 'charge.succeeded') {
        rawStatus = (object.status || 'succeeded').toLowerCase().trim();
        if (rawStatus === 'succeeded') {
            isCompleted = true;
        } else {
            isNonFinal = true;
        }
    } else if (eventType === 'payment_intent.payment_failed' || eventType === 'charge.failed') {
        rawStatus = 'failed';
        isFailed = true;
    } else if (eventType === 'checkout.session.expired') {
        rawStatus = 'expired';
        isFailed = true;
    } else if (eventType === 'payment_intent.canceled') {
        rawStatus = 'canceled';
        isFailed = true;
    } else if (eventType === 'payment_intent.processing' || eventType === 'payment_intent.created') {
        rawStatus = (object.status || 'processing').toLowerCase().trim();
        isNonFinal = true;
    }

    const hasValidPaymentAmount = amount > 0;

    return {
        provider: 'stripe',
        eventId,
        paymentId,
        eventType,
        objectType,
        isObjectTypeValid,
        objectTypeError,
        internalOrderId,
        rawStatus,
        currency,
        amount,
        expectedAmount,
        hasValidPaymentAmount,
        claimedUserId,
        isCompleted: isCompleted && isObjectTypeValid && hasValidPaymentAmount,
        isNonFinal,
        isFailed,
        isSupportedType: isSupportedType && isObjectTypeValid
    };
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
    let methods;
    try {
        [methods] = await db.query(
            'SELECT * FROM payment_methods WHERE (LOWER(provider) = ? OR LOWER(type) = ?) AND status = "active" LIMIT 1',
            [rawProvider, rawProvider]
        );
    } catch (err) {
        console.error('[Webhook] Failed to load payment method:', err.message);
        return res.status(500).json({ error: 'Gateway configuration lookup failed' });
    }

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

    // 3. Parse provider-specific payload
    let parsed;
    if (rawProvider === 'nowpayments') {
        parsed = parseNowPaymentsPayload(req.body);
    } else if (rawProvider === 'stripe') {
        parsed = parseStripePayload(req.body);
    }

    // Verify Stripe event type support and object schema parity
    if (rawProvider === 'stripe' && !parsed.isSupportedType) {
        return res.status(400).json({
            error: parsed.objectTypeError || `Unsupported Stripe event type '${parsed.eventType}'`,
            eventType: parsed.eventType,
            objectType: parsed.objectType
        });
    }

    // Event ID and Internal Order ID are mandatory
    if (!parsed.eventId) {
        return res.status(400).json({ error: 'Missing payment event or transaction ID' });
    }

    if (!parsed.internalOrderId) {
        return res.status(400).json({ error: 'Missing internal order ID or reference in notification' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 4. Check if this specific gateway event was already processed to completed
        const [existingEventRows] = await connection.query(
            'SELECT id, status, amount FROM transactions WHERE reference_id = ? LIMIT 1',
            [parsed.eventId]
        );

        if (existingEventRows.length > 0 && existingEventRows[0].status === 'completed') {
            await connection.rollback();
            return res.status(409).json({
                error: 'Duplicate webhook notification: Event ID already processed',
                eventId: parsed.eventId,
                status: existingEventRows[0].status
            });
        }

        // 4.5 Look up attempt in payment_attempts table by provider and payment ID
        let matchedAttempt = null;
        if (parsed.paymentId) {
            const [attRows] = await connection.query(
                'SELECT * FROM payment_attempts WHERE provider = ? AND provider_payment_id = ? FOR UPDATE',
                [rawProvider, parsed.paymentId]
            );
            if (attRows.length > 0) {
                matchedAttempt = attRows[0];
                parsed.internalOrderId = matchedAttempt.transaction_id;
            }
        }

        // 5. Look up internal payment order in database (transactions table or payments table)
        let internalOrder = null;
        let orderSource = null;

        // Try transactions table by primary key first to acquire precise row lock without gap locks
        let [trxRows] = await connection.query(
            'SELECT * FROM transactions WHERE id = ? AND type = "deposit" FOR UPDATE',
            [parsed.internalOrderId]
        );
        if (trxRows.length === 0) {
            [trxRows] = await connection.query(
                `SELECT * FROM transactions 
                 WHERE (reference_id = ? OR JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.orderId')) = ? OR JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.order_id')) = ?) 
                   AND type = "deposit" FOR UPDATE`,
                [parsed.internalOrderId, parsed.internalOrderId, parsed.internalOrderId]
            );
        }

        if (trxRows.length > 0) {
            internalOrder = trxRows[0];
            orderSource = 'transactions';
        } else {
            // Try payments table
            let [pmtRows] = await connection.query(
                'SELECT * FROM payments WHERE id = ? FOR UPDATE',
                [parsed.internalOrderId]
            );
            if (pmtRows.length === 0) {
                [pmtRows] = await connection.query(
                    'SELECT * FROM payments WHERE reference_number = ? OR transaction_id = ? FOR UPDATE',
                    [parsed.internalOrderId, parsed.internalOrderId]
                );
            }

            if (pmtRows.length > 0) {
                const pmt = pmtRows[0];
                const [studentRows] = await connection.query('SELECT user_id FROM students WHERE id = ?', [pmt.student_id]);
                const actualUserId = studentRows.length > 0 ? studentRows[0].user_id : pmt.student_id;
                internalOrder = {
                    id: pmt.id,
                    user_id: actualUserId,
                    amount: Number(pmt.amount),
                    currency: pmt.currency,
                    status: pmt.status,
                    reference_id: pmt.reference_number || pmt.transaction_id,
                    raw_payment: pmt
                };
                orderSource = 'payments';
            }
        }

        // If internal order does not exist, verify if concurrent transaction already completed it
        if (!internalOrder) {
            const [concurrentDone] = await connection.query(
                'SELECT id, status FROM transactions WHERE reference_id = ? LIMIT 1',
                [parsed.eventId]
            );
            if (concurrentDone.length > 0 && concurrentDone[0].status === 'completed') {
                await connection.rollback();
                return res.status(409).json({
                    error: 'Duplicate webhook notification: Event ID already processed concurrently',
                    eventId: parsed.eventId,
                    status: concurrentDone[0].status
                });
            }

            await connection.rollback();
            return res.status(404).json({
                error: `Internal payment order '${parsed.internalOrderId}' not found in database`,
                internalOrderId: parsed.internalOrderId
            });
        }

        // 6. Security Check: Verify beneficiary user matches internal order
        if (parsed.claimedUserId && parsed.claimedUserId !== internalOrder.user_id) {
            await connection.rollback();
            return res.status(400).json({
                error: `Beneficiary user mismatch: internal order belongs to user '${internalOrder.user_id}', but notification specifies '${parsed.claimedUserId}'`,
                orderUserId: internalOrder.user_id,
                claimedUserId: parsed.claimedUserId
            });
        }

        // 7. Security Check: Verify currency matches internal order
        if (parsed.currency && internalOrder.currency && parsed.currency.toUpperCase() !== String(internalOrder.currency).toUpperCase()) {
            await connection.rollback();
            return res.status(400).json({
                error: `Payment currency mismatch: expected '${internalOrder.currency}', but notification specifies '${parsed.currency}'`,
                expectedCurrency: internalOrder.currency,
                receivedCurrency: parsed.currency
            });
        }

        // 8. Prevent duplicate credit if internal order or any associated attempt is already completed
        let isAlreadyCredited = false;
        if (matchedAttempt && matchedAttempt.is_wallet_credited === 1) {
            isAlreadyCredited = true;
        } else if (orderSource === 'transactions') {
            const [creditedAttempts] = await connection.query(
                'SELECT id FROM payment_attempts WHERE transaction_id = ? AND is_wallet_credited = 1 LIMIT 1',
                [internalOrder.id]
            );
            if (creditedAttempts.length > 0) {
                isAlreadyCredited = true;
            }
        }

        if (internalOrder.status === 'completed' || internalOrder.status === 'approved' || isAlreadyCredited) {
            if (matchedAttempt) {
                await connection.query(
                    'UPDATE payment_attempts SET status = ?, actually_paid = ?, actually_paid_fiat = ?, last_ipn_payload = ? WHERE id = ?',
                    [parsed.rawStatus, parsed.actuallyPaid || null, parsed.amount || null, JSON.stringify(req.body), matchedAttempt.id]
                );
            }
            await connection.commit();
            return res.status(409).json({
                error: `Duplicate payment processing: internal order '${internalOrder.id}' or an associated attempt has already been credited`,
                internalOrderId: internalOrder.id,
                status: internalOrder.status,
                alreadyCredited: true
            });
        }

        // 9. Handle Non-Final / Pending Events (e.g. waiting, confirming, processing)
        if (parsed.isNonFinal) {
            if (matchedAttempt) {
                await connection.query(
                    'UPDATE payment_attempts SET status = ?, actually_paid = ?, actually_paid_fiat = ?, last_ipn_payload = ? WHERE id = ?',
                    [parsed.rawStatus, parsed.actuallyPaid || null, parsed.amount || null, JSON.stringify(req.body), matchedAttempt.id]
                );
            }

            if (orderSource === 'transactions') {
                const meta = {
                    ...(typeof internalOrder.metadata === 'string' ? JSON.parse(internalOrder.metadata || '{}') : (internalOrder.metadata || {})),
                    last_gateway_status: parsed.rawStatus,
                    gateway_event_id: parsed.eventId,
                    updated_at: new Date().toISOString()
                };
                await connection.query(
                    'UPDATE transactions SET status = "pending", metadata = ? WHERE id = ?',
                    [JSON.stringify(meta), internalOrder.id]
                );
            } else if (orderSource === 'payments') {
                await connection.query(
                    'UPDATE payments SET status = "pending", transaction_id = COALESCE(transaction_id, ?), gateway_response = ? WHERE id = ?',
                    [parsed.paymentId || parsed.eventId, JSON.stringify(req.body), internalOrder.id]
                );
            }

            await connection.commit();
            return res.status(200).json({
                success: true,
                processed: false,
                credited: false,
                status: parsed.rawStatus,
                message: `Payment status '${parsed.rawStatus}' is non-final; recorded without crediting wallet`
            });
        }

        // 10. Handle Failed / Canceled Events
        if (parsed.isFailed) {
            if (matchedAttempt) {
                await connection.query(
                    'UPDATE payment_attempts SET status = ?, actually_paid = ?, actually_paid_fiat = ?, last_ipn_payload = ? WHERE id = ?',
                    [parsed.rawStatus, parsed.actuallyPaid || null, parsed.amount || null, JSON.stringify(req.body), matchedAttempt.id]
                );
            }

            if (orderSource === 'transactions') {
                const meta = {
                    ...(typeof internalOrder.metadata === 'string' ? JSON.parse(internalOrder.metadata || '{}') : (internalOrder.metadata || {})),
                    last_gateway_status: parsed.rawStatus,
                    gateway_event_id: parsed.eventId,
                    failed_at: new Date().toISOString()
                };
                await connection.query(
                    'UPDATE transactions SET status = "failed", metadata = ? WHERE id = ?',
                    [JSON.stringify(meta), internalOrder.id]
                );
            } else if (orderSource === 'payments') {
                await connection.query(
                    'UPDATE payments SET status = "failed", gateway_response = ? WHERE id = ?',
                    [JSON.stringify(req.body), internalOrder.id]
                );
            }

            await connection.commit();
            return res.status(200).json({
                success: true,
                processed: false,
                credited: false,
                status: parsed.rawStatus,
                message: `Payment status '${parsed.rawStatus}' is failed or expired; marked as failed without crediting wallet`
            });
        }

        // 10.5 Handle Terminal Status with Unverified / Missing Amount (Never add unearned credit)
        if (!parsed.hasValidPaymentAmount || parsed.amount <= 0) {
            if (matchedAttempt) {
                await connection.query(
                    'UPDATE payment_attempts SET status = ?, calculation_policy = ?, last_ipn_payload = ? WHERE id = ?',
                    [parsed.rawStatus, parsed.calculationPolicy, JSON.stringify(req.body), matchedAttempt.id]
                );
            }

            if (orderSource === 'transactions') {
                const meta = {
                    ...(typeof internalOrder.metadata === 'string' ? JSON.parse(internalOrder.metadata || '{}') : (internalOrder.metadata || {})),
                    last_gateway_status: parsed.rawStatus,
                    gateway_event_id: parsed.eventId,
                    unverified_reason: parsed.calculationPolicy || 'missing_or_invalid_actually_paid',
                    received_body: req.body,
                    updated_at: new Date().toISOString()
                };
                await connection.query('UPDATE transactions SET metadata = ? WHERE id = ?', [JSON.stringify(meta), internalOrder.id]);
            } else if (orderSource === 'payments') {
                await connection.query('UPDATE payments SET gateway_response = ? WHERE id = ?', [JSON.stringify(req.body), internalOrder.id]);
            }
            await connection.commit();
            return res.status(200).json({
                success: true,
                processed: false,
                credited: false,
                status: parsed.rawStatus,
                calculationPolicy: parsed.calculationPolicy,
                message: `Payment received amount could not be reliably verified (${parsed.calculationPolicy}); acknowledged with zero credit`
            });
        }

        // 11. Handle Terminal Completed Payment: Add verified balance & update order
        if (!parsed.isCompleted) {
            await connection.rollback();
            return res.status(400).json({
                error: `Unrecognized or non-terminal payment status '${parsed.rawStatus}'`,
                status: parsed.rawStatus
            });
        }

        const amountToCredit = Number(parsed.amount.toFixed(2));
        if (isNaN(amountToCredit) || amountToCredit <= 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Invalid received payment amount' });
        }

        const expected = Number(internalOrder.amount);
        const isUnderpaid = expected > 0 && amountToCredit < expected;
        const isOverpaid = expected > 0 && amountToCredit > expected;

        const isPackagePurchase = (orderSource === 'transactions' && internalOrder.type === 'package_purchase') 
            || (orderSource === 'transactions' && (typeof internalOrder.metadata === 'string' ? internalOrder.metadata.includes('"packageId"') : !!internalOrder.metadata?.packageId));

        if (isPackagePurchase) {
            const meta = typeof internalOrder.metadata === 'string' ? JSON.parse(internalOrder.metadata || '{}') : (internalOrder.metadata || {});
            const targetStatus = isUnderpaid ? 'partially_paid' : 'completed';

            const updatedMeta = {
                ...meta,
                provider: rawProvider,
                gateway_event_id: parsed.eventId,
                gateway_payment_id: parsed.paymentId,
                received_amount: amountToCredit,
                expected_amount: expected,
                isUnderpaid,
                isOverpaid,
                calculationPolicy: parsed.calculationPolicy,
                completed_at: new Date().toISOString()
            };

            const description = `NOWPayments USDT (BEP20) Package Activation: received $${amountToCredit} ${parsed.currency}` +
                (isUnderpaid ? ` [جزئي/Underpaid: expected $${expected}]` : '') +
                (isOverpaid ? ` [فائض/Overpaid: expected $${expected}]` : '');

            await connection.query(`
                UPDATE transactions 
                SET status = ?, amount = ?, reference_id = ?, description = ?, metadata = ?
                WHERE id = ?
            `, [targetStatus, amountToCredit, parsed.paymentId || parsed.eventId, description, JSON.stringify(updatedMeta), internalOrder.id]);

            if (matchedAttempt) {
                await connection.query(`
                    UPDATE payment_attempts 
                    SET status = ?, is_wallet_credited = 1, wallet_credited_at = NOW(),
                        actually_paid = ?, actually_paid_fiat = ?, calculation_policy = ?,
                        last_ipn_payload = ?
                    WHERE id = ?
                `, [
                    parsed.rawStatus,
                    parsed.actuallyPaid || null,
                    amountToCredit,
                    parsed.calculationPolicy,
                    JSON.stringify(req.body),
                    matchedAttempt.id
                ]);
            }

            if (!isUnderpaid) {
                // Execute automatic package activation
                const packageId = meta.packageId;
                const [pkgRows] = await connection.query('SELECT * FROM packages WHERE id = ?', [packageId]);
                const targetPackage = pkgRows[0];

                let userPackageId = meta.userPackageId;
                if (!userPackageId) {
                    const [pendingUp] = await connection.query(`
                        SELECT id FROM user_packages WHERE user_id = ? AND status = 'pending' ORDER BY purchased_at DESC LIMIT 1
                    `, [internalOrder.user_id]);
                    userPackageId = pendingUp[0]?.id;
                }

                if (targetPackage && userPackageId) {
                    const packageController = require('./packageController');
                    await packageController.processPackageActivation(connection, {
                        userPackageId,
                        userId: internalOrder.user_id,
                        targetPackage,
                        saleAmount: expected,
                        paymentMethod: 'nowpayments_crypto',
                        paymentReference: parsed.paymentId || parsed.eventId
                    });
                }
            }

            await connection.commit();
            return res.status(200).json({
                success: true,
                processed: true,
                packageActivated: !isUnderpaid,
                status: targetStatus,
                message: isUnderpaid ? 'Payment received is underpaid; package not activated' : 'Package activated successfully via NOWPayments webhook'
            });
        }

        // Fetch user wallet with lock
        let [wallets] = await connection.query('SELECT * FROM user_wallets WHERE user_id = ? FOR UPDATE', [internalOrder.user_id]);
        if (wallets.length === 0) {
            const wId = crypto.randomUUID();
            await connection.query(
                'INSERT INTO user_wallets (id, user_id, balance, pending_balance, total_earned, total_withdrawn) VALUES (?, ?, 0.00, 0.00, 0.00, 0.00)',
                [wId, internalOrder.user_id]
            );
            wallets = [{ id: wId, user_id: internalOrder.user_id, balance: 0 }];
        }

        const currentBal = Number(wallets[0].balance);
        const newBal = Number((currentBal + amountToCredit).toFixed(2));

        // Update wallet balance strictly by credited amount
        await connection.query('UPDATE user_wallets SET balance = balance + ? WHERE user_id = ?', [amountToCredit, internalOrder.user_id]);

        // Update internal order to completed or partially_paid and record ledger transaction
        if (orderSource === 'transactions') {
            const targetStatus = isUnderpaid ? 'partially_paid' : 'completed';
            const meta = {
                ...(typeof internalOrder.metadata === 'string' ? JSON.parse(internalOrder.metadata || '{}') : (internalOrder.metadata || {})),
                provider: rawProvider,
                gateway_event_id: parsed.eventId,
                gateway_payment_id: parsed.paymentId,
                received_amount: amountToCredit,
                expected_amount: expected,
                isUnderpaid,
                isOverpaid,
                calculationPolicy: parsed.calculationPolicy,
                completed_at: new Date().toISOString()
            };

            const description = `Webhook payment (${rawProvider}): received $${amountToCredit} ${parsed.currency}` +
                (isUnderpaid ? ` [جزئي/Underpaid: expected $${expected}]` : '') +
                (isOverpaid ? ` [فائض/Overpaid: expected $${expected}]` : '');

            await connection.query(`
                UPDATE transactions 
                SET status = ?, amount = ?, balance_before = ?, balance_after = ?, reference_id = ?, description = ?, metadata = ?
                WHERE id = ?
            `, [targetStatus, amountToCredit, currentBal, newBal, parsed.eventId, description, JSON.stringify(meta), internalOrder.id]);

            if (matchedAttempt) {
                await connection.query(`
                    UPDATE payment_attempts 
                    SET status = ?, is_wallet_credited = 1, wallet_credited_at = NOW(),
                        actually_paid = ?, actually_paid_fiat = ?, calculation_policy = ?,
                        last_ipn_payload = ?
                    WHERE id = ?
                `, [
                    parsed.rawStatus,
                    parsed.actuallyPaid || null,
                    amountToCredit,
                    parsed.calculationPolicy,
                    JSON.stringify(req.body),
                    matchedAttempt.id
                ]);
            }
        } else if (orderSource === 'payments') {
            // CRITICAL: NEVER mark service or course purchase as 'completed' if underpaid!
            const targetStatus = isUnderpaid ? 'partially_paid' : 'completed';

            await connection.query(`
                UPDATE payments 
                SET status = ?, transaction_id = ?, gateway_response = ?, admin_notes = ?
                WHERE id = ?
            `, [
                targetStatus, 
                parsed.paymentId || parsed.eventId, 
                JSON.stringify(req.body),
                isUnderpaid ? `Underpaid: received $${amountToCredit} of expected $${expected}` : 'Full payment confirmed via webhook',
                internalOrder.id
            ]);

            const trxId = crypto.randomUUID();
            const description = `Payment for order ${internalOrder.id} via ${rawProvider}: received $${amountToCredit} ${parsed.currency}` +
                (isUnderpaid ? ` [جزئي/Underpaid: expected $${expected}]` : '') +
                (isOverpaid ? ` [فائض/Overpaid: expected $${expected}]` : '');

            await connection.query(`
                INSERT INTO transactions (id, user_id, type, amount, currency, balance_before, balance_after, status, reference_id, description, metadata)
                VALUES (?, ?, 'deposit', ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                trxId,
                internalOrder.user_id,
                amountToCredit,
                parsed.currency,
                currentBal,
                newBal,
                targetStatus,
                parsed.eventId,
                description,
                JSON.stringify({
                    orderId: internalOrder.id,
                    provider: rawProvider,
                    eventId: parsed.eventId,
                    paymentId: parsed.paymentId,
                    receivedAmount: amountToCredit,
                    expectedAmount: expected,
                    isUnderpaid,
                    isOverpaid,
                    completed: !isUnderpaid
                })
            ]);
        }

        await connection.commit();

        // Safely dispatch deposit-approved email notification in background
        emailService.sendToUser(internalOrder.user_id, 'deposit-approved', {
            amount: amountToCredit.toFixed(2),
            currency: parsed.currency || 'USD',
            transaction_id: parsed.eventId || internalOrder.id,
            new_balance: newBal.toFixed(2),
            date: new Date().toISOString().replace('T', ' ').substring(0, 19)
        }).catch(e => console.error('[handleGatewayWebhook:deposit-approved] Email error:', e.message));

        res.status(200).json({
            success: true,
            processed: true,
            credited: true,
            completed: !isUnderpaid,
            status: isUnderpaid ? 'partially_paid' : 'completed',
            provider: rawProvider,
            eventId: parsed.eventId,
            internalOrderId: internalOrder.id,
            creditedAmount: amountToCredit,
            isUnderpaid,
            isOverpaid,
            newBalance: newBal
        });
    } catch (err) {
        await connection.rollback();
        // Specifically handle race-condition duplicate key errors and concurrency deadlocks
        if (err.code === 'ER_DUP_ENTRY' || err.code === 'ER_LOCK_DEADLOCK') {
            return res.status(409).json({
                error: 'Duplicate webhook notification: Event ID or order already processed or locked by concurrent request',
                eventId: parsed?.eventId
            });
        }
        console.error('[handleGatewayWebhook]', err.message);
        res.status(500).json({ error: 'Failed to process webhook' });
    } finally {
        connection.release();
    }
};
