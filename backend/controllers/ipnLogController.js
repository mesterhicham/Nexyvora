const db = require('../config/db');
const renewalWorker = require('../workers/paymentRenewalWorker');
const nowpaymentsService = require('../services/nowpaymentsService');

/**
 * Sanitize metadata to never leak API keys, secrets, or server environment details
 */
function sanitizeAttempt(att) {
    let meta = {};
    try {
        meta = typeof att.metadata === 'string' ? JSON.parse(att.metadata || '{}') : (att.metadata || {});
    } catch (e) {}

    let lastPayload = null;
    try {
        lastPayload = typeof att.last_ipn_payload === 'string' ? JSON.parse(att.last_ipn_payload || 'null') : att.last_ipn_payload;
    } catch (e) {}

    // Clean any sensitive key names if present in payload or metadata
    const cleanObject = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        const copy = { ...obj };
        delete copy.api_key;
        delete copy.apiKey;
        delete copy.secret_key;
        delete copy.secretKey;
        delete copy.webhook_secret;
        delete copy.webhookSecret;
        delete copy.token;
        delete copy.authorization;
        return copy;
    };

    return {
        ...att,
        metadata: cleanObject(meta),
        last_ipn_payload: cleanObject(lastPayload),
        renewal_error: att.renewal_error ? att.renewal_error.replace(/api[-_]?key=[^&\s]+/gi, 'api_key=***') : null
    };
}

/**
 * Get paginated, filterable, searchable IPN log and payment attempts for Admin
 */
exports.getAdminIpnLogs = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search = '',
            provider = 'all',
            status = 'all',
            credited = 'all',
            startDate = '',
            endDate = ''
        } = req.query;

        const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
        const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10)));

        let whereClauses = [];
        let params = [];

        if (provider && provider !== 'all') {
            whereClauses.push('pa.provider = ?');
            params.push(provider);
        }

        if (status && status !== 'all') {
            whereClauses.push('pa.status = ?');
            params.push(status);
        }

        if (credited !== 'all') {
            whereClauses.push('pa.is_wallet_credited = ?');
            params.push(credited === '1' || credited === 'true' ? 1 : 0);
        }

        if (startDate) {
            whereClauses.push('pa.created_at >= ?');
            params.push(`${startDate} 00:00:00`);
        }

        if (endDate) {
            whereClauses.push('pa.created_at <= ?');
            params.push(`${endDate} 23:59:59`);
        }

        if (search && search.trim()) {
            const q = `%${search.trim()}%`;
            whereClauses.push(`(
                pa.transaction_id LIKE ? OR 
                pa.provider_payment_id LIKE ? OR 
                pa.pay_address LIKE ? OR 
                u.email LIKE ? OR 
                p.full_name LIKE ?
            )`);
            params.push(q, q, q, q, q);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Get total count
        const [countRows] = await db.query(`
            SELECT COUNT(*) AS total
            FROM payment_attempts pa
            JOIN users u ON pa.user_id = u.id
            LEFT JOIN profiles p ON u.id = p.id
            ${whereSql}
        `, params);
        const total = countRows[0].total;

        // Metrics summary
        const [metricRows] = await db.query(`
            SELECT 
                COUNT(*) AS total_attempts,
                SUM(CASE WHEN is_wallet_credited = 1 THEN 1 ELSE 0 END) AS credited_count,
                SUM(CASE WHEN status IN ('waiting', 'confirming', 'sending') THEN 1 ELSE 0 END) AS pending_count,
                SUM(CASE WHEN status IN ('failed', 'expired') THEN 1 ELSE 0 END) AS failed_count,
                SUM(CASE WHEN is_wallet_credited = 1 THEN COALESCE(actually_paid_fiat, price_amount) ELSE 0 END) AS total_credited_volume
            FROM payment_attempts
        `);

        // Fetch paginated rows
        const queryParams = [...params, pageSize, offset];
        const [rows] = await db.query(`
            SELECT 
                pa.id,
                pa.transaction_id,
                pa.user_id,
                pa.provider,
                pa.provider_payment_id,
                pa.provider_order_id,
                pa.attempt_number,
                pa.pay_address,
                pa.pay_amount,
                pa.pay_currency,
                pa.price_amount,
                pa.price_currency,
                pa.network,
                pa.status,
                pa.is_wallet_credited,
                pa.wallet_credited_at,
                pa.actually_paid,
                pa.actually_paid_fiat,
                pa.calculation_policy,
                pa.next_renewal_at,
                pa.expires_at,
                pa.renewal_error,
                pa.created_at,
                pa.updated_at,
                pa.metadata,
                pa.last_ipn_payload,
                u.email AS user_email,
                COALESCE(p.full_name, u.email) AS user_name,
                p.avatar_url,
                t.status AS transaction_status
            FROM payment_attempts pa
            JOIN users u ON pa.user_id = u.id
            LEFT JOIN profiles p ON u.id = p.id
            LEFT JOIN transactions t ON pa.transaction_id = t.id
            ${whereSql}
            ORDER BY pa.created_at DESC
            LIMIT ? OFFSET ?
        `, queryParams);

        const sanitized = rows.map(sanitizeAttempt);

        res.json({
            attempts: sanitized,
            pagination: {
                total,
                page: parseInt(page, 10),
                limit: pageSize,
                totalPages: Math.ceil(total / pageSize)
            },
            metrics: metricRows[0] || {
                total_attempts: 0,
                credited_count: 0,
                pending_count: 0,
                failed_count: 0,
                total_credited_volume: 0
            }
        });
    } catch (err) {
        console.error('[getAdminIpnLogs]', err);
        res.status(500).json({ error: 'Failed to fetch IPN log records' });
    }
};

/**
 * Get detailed view of a deposit session including all renewal attempts and history
 */
exports.getAdminIpnLogDetail = async (req, res) => {
    const { id } = req.params;

    try {
        // ID could be attempt id or transaction id
        let trxId = id;
        const [attemptCheck] = await db.query('SELECT transaction_id FROM payment_attempts WHERE id = ?', [id]);
        if (attemptCheck.length > 0) {
            trxId = attemptCheck[0].transaction_id;
        }

        // Fetch parent transaction
        const [trxRows] = await db.query(`
            SELECT 
                t.*,
                u.email AS user_email,
                COALESCE(p.full_name, u.email) AS user_name,
                p.avatar_url,
                w.balance AS current_wallet_balance
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN profiles p ON u.id = p.id
            LEFT JOIN user_wallets w ON t.user_id = w.user_id
            WHERE t.id = ?
        `, [trxId]);

        if (trxRows.length === 0) {
            return res.status(404).json({ error: 'Deposit session not found' });
        }

        const trx = trxRows[0];

        // Fetch all attempts for this transaction
        const [attempts] = await db.query(`
            SELECT * FROM payment_attempts
            WHERE transaction_id = ?
            ORDER BY attempt_number ASC
        `, [trxId]);

        const sanitizedAttempts = attempts.map(sanitizeAttempt);

        res.json({
            transaction: {
                ...trx,
                metadata: typeof trx.metadata === 'string' ? JSON.parse(trx.metadata || '{}') : (trx.metadata || {})
            },
            attempts: sanitizedAttempts
        });
    } catch (err) {
        console.error('[getAdminIpnLogDetail]', err);
        res.status(500).json({ error: 'Failed to fetch deposit details' });
    }
};

/**
 * Manually trigger renewal for an eligible pending deposit session from Admin UI
 */
exports.triggerManualRenewal = async (req, res) => {
    const { id } = req.params;

    try {
        const [trxRows] = await db.query('SELECT * FROM transactions WHERE id = ? AND type = "deposit"', [id]);
        if (trxRows.length === 0) {
            return res.status(404).json({ error: 'Deposit transaction not found' });
        }

        const trx = trxRows[0];
        if (trx.status !== 'pending') {
            return res.status(400).json({ error: `Cannot renew deposit in status '${trx.status}'` });
        }

        const session = {
            transaction_id: trx.id,
            user_id: trx.user_id
        };

        const result = await renewalWorker.renewSession(session);
        if (result.failed) {
            return res.status(502).json({ error: `Renewal failed: ${result.error}` });
        }

        res.json({
            message: 'Payment renewal triggered successfully',
            result
        });
    } catch (err) {
        console.error('[triggerManualRenewal]', err);
        res.status(500).json({ error: 'Failed to trigger payment renewal' });
    }
};

/**
 * Test NOWPayments API connectivity and API key validity
 */
exports.testNowPaymentsConnection = async (req, res) => {
    try {
        const config = await nowpaymentsService.getConfig();
        const statusRes = await fetch(`${config.baseUrl}/status`, { signal: AbortSignal.timeout(8000) });
        const statusData = await statusRes.json().catch(() => ({}));

        const currRes = await fetch(`${config.baseUrl}/currencies`, {
            headers: { 'x-api-key': config.apiKey },
            signal: AbortSignal.timeout(8000)
        });
        const currData = await currRes.json().catch(() => ({}));

        if (!currRes.ok) {
            return res.status(currRes.status).json({
                success: false,
                gatewayStatus: statusData.message || 'online',
                error: currData.message || 'Invalid API key or unauthorized',
                code: currData.code || 'INVALID_API_KEY',
                isSandbox: config.isSandbox,
                baseUrl: config.baseUrl
            });
        }

        res.json({
            success: true,
            gatewayStatus: statusData.message || 'OK',
            currenciesCount: currData.currencies?.length || 0,
            isSandbox: config.isSandbox,
            baseUrl: config.baseUrl,
            defaultPayCurrency: config.defaultPayCurrency,
            webhookSecretConfigured: Boolean(config.webhookSecret)
        });
    } catch (err) {
        console.error('[testNowPaymentsConnection]', err);
        res.status(500).json({ success: false, error: err.message });
    }
};
