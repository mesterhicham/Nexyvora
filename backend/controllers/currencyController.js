const db = require('../config/db');
const crypto = require('crypto');
const currencyService = require('../services/currencyService');

function genUuid() {
    return crypto.randomUUID();
}

/**
 * Get active currency rule for current student/visitor
 */
exports.getMyCurrencyRule = async (req, res) => {
    try {
        const countryCode = await currencyService.detectUserCountry(req);
        const rule = await currencyService.getRuleForCountry(countryCode);

        res.json({
            success: true,
            detected_country: countryCode,
            rule
        });
    } catch (err) {
        console.error('[getMyCurrencyRule]', err);
        res.status(500).json({ error: 'Failed to retrieve currency rule' });
    }
};

/**
 * Get all country rules (Admin)
 */
exports.getAdminRules = async (req, res) => {
    try {
        const rules = await currencyService.getAllCountryRules(true);
        res.json({ rules });
    } catch (err) {
        console.error('[getAdminRules]', err);
        res.status(500).json({ error: 'Failed to retrieve rules' });
    }
};

/**
 * Update a country currency rule (Admin) with Audit Logging
 */
exports.updateAdminRule = async (req, res) => {
    const { countryCode } = req.params;
    const {
        country_name,
        country_name_ar,
        currency_code,
        currency_symbol,
        usd_rate,
        usdt_rate,
        usdt_enabled,
        local_currency_enabled,
        stripe_enabled,
        paypal_enabled,
        payoneer_enabled,
        bank_transfer_enabled,
        is_active,
        sort_order
    } = req.body;

    const adminId = req.user?.id || 'admin';
    const adminEmail = req.user?.email || 'admin@nexyvora.com';
    const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Fetch current rule
        const [existingRows] = await connection.query(
            'SELECT * FROM country_currency_rules WHERE country_code = ?',
            [countryCode.toUpperCase()]
        );

        if (existingRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Country rule not found' });
        }

        const oldRule = existingRows[0];

        // Strict security enforcement: Algeria DZ cannot have USDT enabled
        let effectiveUsdtEnabled = usdt_enabled !== undefined ? (usdt_enabled ? 1 : 0) : oldRule.usdt_enabled;
        if (countryCode.toUpperCase() === 'DZ') {
            effectiveUsdtEnabled = 0; // Strictly enforce 0 for Algeria
        }

        const updates = {};
        if (country_name !== undefined) updates.country_name = country_name;
        if (country_name_ar !== undefined) updates.country_name_ar = country_name_ar;
        if (currency_code !== undefined) updates.currency_code = currency_code.toUpperCase();
        if (currency_symbol !== undefined) updates.currency_symbol = currency_symbol;
        if (usd_rate !== undefined) updates.usd_rate = parseFloat(usd_rate);
        if (usdt_rate !== undefined) updates.usdt_rate = parseFloat(usdt_rate);
        updates.usdt_enabled = effectiveUsdtEnabled;
        if (local_currency_enabled !== undefined) updates.local_currency_enabled = local_currency_enabled ? 1 : 0;
        if (stripe_enabled !== undefined) updates.stripe_enabled = stripe_enabled ? 1 : 0;
        if (paypal_enabled !== undefined) updates.paypal_enabled = paypal_enabled ? 1 : 0;
        if (payoneer_enabled !== undefined) updates.payoneer_enabled = payoneer_enabled ? 1 : 0;
        if (bank_transfer_enabled !== undefined) updates.bank_transfer_enabled = bank_transfer_enabled ? 1 : 0;
        if (is_active !== undefined) updates.is_active = is_active ? 1 : 0;
        if (sort_order !== undefined) updates.sort_order = parseInt(sort_order, 10);

        // Bank details fields
        const {
            bank_name,
            account_holder,
            account_number,
            iban,
            swift_code,
            bank_instructions,
            bank_instructions_ar
        } = req.body;

        if (bank_name !== undefined) updates.bank_name = bank_name ? bank_name.trim() : null;
        if (account_holder !== undefined) updates.account_holder = account_holder ? account_holder.trim() : null;
        if (account_number !== undefined) updates.account_number = account_number ? account_number.trim() : null;
        if (iban !== undefined) updates.iban = iban ? iban.trim() : null;
        if (swift_code !== undefined) updates.swift_code = swift_code ? swift_code.trim() : null;
        if (bank_instructions !== undefined) updates.bank_instructions = bank_instructions ? bank_instructions.trim() : null;
        if (bank_instructions_ar !== undefined) updates.bank_instructions_ar = bank_instructions_ar ? bank_instructions_ar.trim() : null;

        // 2. Perform DB update
        const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = [...Object.values(updates), countryCode.toUpperCase()];
        await connection.query(
            `UPDATE country_currency_rules SET ${setClauses} WHERE country_code = ?`,
            values
        );

        // 3. Log differences in currency_audit_logs
        for (const [key, newVal] of Object.entries(updates)) {
            const oldVal = oldRule[key];
            // Compare stringified/number equivalence
            if (String(oldVal) !== String(newVal)) {
                await connection.query(`
                    INSERT INTO currency_audit_logs (
                        id, admin_id, admin_email, action, country_code, field_name,
                        old_value, new_value, ip_address, user_agent
                    ) VALUES (?, ?, ?, 'UPDATE_RULE', ?, ?, ?, ?, ?, ?)
                `, [
                    genUuid(),
                    adminId,
                    adminEmail,
                    countryCode.toUpperCase(),
                    key,
                    String(oldVal ?? ''),
                    String(newVal ?? ''),
                    String(ipAddress).substring(0, 50),
                    String(userAgent).substring(0, 500)
                ]);
            }
        }

        await connection.commit();
        currencyService.invalidateCache();

        const [updatedRows] = await db.query(
            'SELECT * FROM country_currency_rules WHERE country_code = ?',
            [countryCode.toUpperCase()]
        );

        res.json({
            success: true,
            message: 'Country rule updated successfully and logged in audit trail.',
            rule: updatedRows[0]
        });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('[updateAdminRule]', err);
        res.status(500).json({ error: 'Failed to update country rule' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Add a new country rule (Admin)
 */
exports.createAdminRule = async (req, res) => {
    const {
        country_code,
        country_name,
        country_name_ar,
        currency_code,
        currency_symbol,
        usd_rate = 1.0,
        usdt_rate = 1.0,
        usdt_enabled = 1,
        local_currency_enabled = 1,
        stripe_enabled = 0,
        paypal_enabled = 0,
        payoneer_enabled = 0,
        bank_transfer_enabled = 1,
        is_active = 1,
        sort_order = 0,
        bank_name = null,
        account_holder = null,
        account_number = null,
        iban = null,
        swift_code = null,
        bank_instructions = null,
        bank_instructions_ar = null
    } = req.body;

    if (!country_code || !country_name || !currency_code) {
        return res.status(400).json({ error: 'Country code, name, and currency code are required' });
    }

    const code = country_code.toUpperCase().trim();
    const effectiveUsdt = code === 'DZ' ? 0 : (usdt_enabled ? 1 : 0);

    const adminId = req.user?.id || 'admin';
    const adminEmail = req.user?.email || 'admin@nexyvora.com';
    const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';

    try {
        await db.query(`
            INSERT INTO country_currency_rules (
                country_code, country_name, country_name_ar, currency_code, currency_symbol,
                usd_rate, usdt_rate, usdt_enabled, local_currency_enabled,
                stripe_enabled, paypal_enabled, payoneer_enabled, bank_transfer_enabled,
                is_active, sort_order, bank_name, account_holder, account_number, iban, swift_code,
                bank_instructions, bank_instructions_ar
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            code,
            country_name,
            country_name_ar || country_name,
            currency_code.toUpperCase().trim(),
            currency_symbol || '$',
            parseFloat(usd_rate),
            parseFloat(usdt_rate),
            effectiveUsdt,
            local_currency_enabled ? 1 : 0,
            stripe_enabled ? 1 : 0,
            paypal_enabled ? 1 : 0,
            payoneer_enabled ? 1 : 0,
            bank_transfer_enabled ? 1 : 0,
            is_active ? 1 : 0,
            parseInt(sort_order, 10) || 0,
            bank_name ? bank_name.trim() : null,
            account_holder ? account_holder.trim() : null,
            account_number ? account_number.trim() : null,
            iban ? iban.trim() : null,
            swift_code ? swift_code.trim() : null,
            bank_instructions ? bank_instructions.trim() : null,
            bank_instructions_ar ? bank_instructions_ar.trim() : null
        ]);

        await db.query(`
            INSERT INTO currency_audit_logs (
                id, admin_id, admin_email, action, country_code, field_name,
                old_value, new_value, ip_address
            ) VALUES (?, ?, ?, 'CREATE_RULE', ?, 'NEW_COUNTRY', NULL, ?, ?)
        `, [
            genUuid(),
            adminId,
            adminEmail,
            code,
            JSON.stringify(req.body),
            String(ipAddress).substring(0, 50)
        ]);

        currencyService.invalidateCache();
        res.status(201).json({ success: true, message: 'Country rule created successfully' });
    } catch (err) {
        console.error('[createAdminRule]', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Rule for this country code already exists' });
        }
        res.status(500).json({ error: 'Failed to create country rule' });
    }
};

/**
 * Get audit logs for Admin
 */
exports.getAdminAuditLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 50;
        const offset = (page - 1) * limit;

        const [rows] = await db.query(`
            SELECT * FROM currency_audit_logs 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        const [countRows] = await db.query('SELECT COUNT(*) as total FROM currency_audit_logs');
        const total = countRows[0]?.total || 0;

        res.json({
            auditLogs: rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('[getAdminAuditLogs]', err);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
};
