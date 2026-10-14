const db = require('../config/db');
const crypto = require('crypto');
const currencyService = require('../services/currencyService');

/**
 * Get all payment methods for Admin
 */
exports.getAdminPaymentMethods = async (req, res) => {
    try {
        const [methods] = await db.query(`
            SELECT * FROM payment_methods 
            ORDER BY sort_order ASC, created_at DESC
        `);

        res.json({ paymentMethods: methods });
    } catch (err) {
        console.error('[getAdminPaymentMethods]', err);
        res.status(500).json({ error: 'Failed to fetch payment methods' });
    }
};

/**
 * Create a new payment/withdrawal method (Admin)
 */
exports.createPaymentMethod = async (req, res) => {
    try {
        const {
            name,
            name_ar,
            type = 'custom',
            provider = 'manual',
            currency = 'USD',
            crypto_currency = 'USDT_BEP20',
            crypto_network = 'BEP20',
            crypto_wallet_address = '',
            bank_name = '',
            account_holder = '',
            account_number = '',
            swift_code = '',
            instructions = '',
            instructions_ar = '',
            require_receipt = 1,
            api_key = '',
            secret_key = '',
            public_key = '',
            webhook_secret = '',
            is_sandbox = 0,
            min_deposit = 10,
            max_deposit = 10000,
            min_withdrawal = 20,
            max_withdrawal = 5000,
            fee_percent = 0,
            fee_fixed = 0,
            enabled_for_deposit = 1,
            enabled_for_withdrawal = 1,
            status = 'active',
            sort_order = 0
        } = req.body;

        if (!name || !type) {
            return res.status(400).json({ error: 'Method name and type are required' });
        }

        const id = crypto.randomUUID();

        await db.query(`
            INSERT INTO payment_methods (
                id, name, name_ar, type, provider, currency, crypto_currency,
                crypto_network, crypto_wallet_address, bank_name, account_holder,
                account_number, swift_code, instructions, instructions_ar,
                require_receipt, api_key, secret_key, public_key, webhook_secret,
                is_sandbox, min_deposit, max_deposit, min_withdrawal, max_withdrawal,
                fee_percent, fee_fixed, enabled_for_deposit, enabled_for_withdrawal,
                status, sort_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id, name, name_ar || name, type, provider, currency, crypto_currency,
            crypto_network, crypto_wallet_address, bank_name, account_holder,
            account_number, swift_code, instructions, instructions_ar || instructions,
            require_receipt ? 1 : 0, api_key, secret_key, public_key, webhook_secret,
            is_sandbox ? 1 : 0, Number(min_deposit) || 0, Number(max_deposit) || 0,
            Number(min_withdrawal) || 0, Number(max_withdrawal) || 0,
            Number(fee_percent) || 0, Number(fee_fixed) || 0,
            enabled_for_deposit ? 1 : 0, enabled_for_withdrawal ? 1 : 0,
            status || 'active', Number(sort_order) || 0
        ]);

        const [created] = await db.query('SELECT * FROM payment_methods WHERE id = ?', [id]);

        res.status(201).json({
            message: 'Payment method created successfully',
            paymentMethod: created[0]
        });
    } catch (err) {
        console.error('[createPaymentMethod]', err);
        res.status(500).json({ error: 'Failed to create payment method' });
    }
};

/**
 * Update payment method (Admin)
 */
exports.updatePaymentMethod = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const [existing] = await db.query('SELECT * FROM payment_methods WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Payment method not found' });
        }

        const fields = [
            'name', 'name_ar', 'type', 'provider', 'currency', 'crypto_currency',
            'crypto_network', 'crypto_wallet_address', 'bank_name', 'account_holder',
            'account_number', 'swift_code', 'instructions', 'instructions_ar',
            'require_receipt', 'api_key', 'secret_key', 'public_key', 'webhook_secret',
            'is_sandbox', 'min_deposit', 'max_deposit', 'min_withdrawal', 'max_withdrawal',
            'fee_percent', 'fee_fixed', 'enabled_for_deposit', 'enabled_for_withdrawal',
            'status', 'sort_order'
        ];

        const updates = [];
        const values = [];

        for (const field of fields) {
            if (data[field] !== undefined) {
                updates.push(`\`${field}\` = ?`);
                let val = data[field];
                if (typeof val === 'boolean') val = val ? 1 : 0;
                values.push(val);
            }
        }

        if (updates.length > 0) {
            values.push(id);
            await db.query(`UPDATE payment_methods SET ${updates.join(', ')} WHERE id = ?`, values);
        }

        const [updated] = await db.query('SELECT * FROM payment_methods WHERE id = ?', [id]);

        res.json({
            message: 'Payment method updated successfully',
            paymentMethod: updated[0]
        });
    } catch (err) {
        console.error('[updatePaymentMethod]', err);
        res.status(500).json({ error: 'Failed to update payment method' });
    }
};

/**
 * Delete payment method (Admin)
 */
exports.deletePaymentMethod = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM payment_methods WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Payment method not found' });
        }

        res.json({ message: 'Payment method deleted successfully' });
    } catch (err) {
        console.error('[deletePaymentMethod]', err);
        res.status(500).json({ error: 'Failed to delete payment method' });
    }
};

/**
 * Toggle method active status
 */
exports.toggleMethodStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT status FROM payment_methods WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Payment method not found' });
        }

        const newStatus = rows[0].status === 'active' ? 'inactive' : 'active';
        await db.query('UPDATE payment_methods SET status = ? WHERE id = ?', [newStatus, id]);

        res.json({ message: `Status updated to ${newStatus}`, status: newStatus });
    } catch (err) {
        console.error('[toggleMethodStatus]', err);
        res.status(500).json({ error: 'Failed to toggle method status' });
    }
};

/**
 * Toggle enabled for deposit
 */
exports.toggleDeposit = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT enabled_for_deposit FROM payment_methods WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Payment method not found' });
        }

        const newEnabled = rows[0].enabled_for_deposit ? 0 : 1;
        await db.query('UPDATE payment_methods SET enabled_for_deposit = ? WHERE id = ?', [newEnabled, id]);

        res.json({ message: 'Deposit setting updated', enabled_for_deposit: !!newEnabled });
    } catch (err) {
        console.error('[toggleDeposit]', err);
        res.status(500).json({ error: 'Failed to toggle deposit setting' });
    }
};

/**
 * Toggle enabled for withdrawal
 */
exports.toggleWithdrawal = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT enabled_for_withdrawal FROM payment_methods WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Payment method not found' });
        }

        const newEnabled = rows[0].enabled_for_withdrawal ? 0 : 1;
        await db.query('UPDATE payment_methods SET enabled_for_withdrawal = ? WHERE id = ?', [newEnabled, id]);

        res.json({ message: 'Withdrawal setting updated', enabled_for_withdrawal: !!newEnabled });
    } catch (err) {
        console.error('[toggleWithdrawal]', err);
        res.status(500).json({ error: 'Failed to toggle withdrawal setting' });
    }
};

/**
 * Get active payment methods for student (Deposit & Withdrawal)
 * Safe query masking private secrets
 */
exports.getActiveMethodsForStudents = async (req, res) => {
    const { mode } = req.query; // 'deposit' or 'withdrawal'

    try {
        let sql = "SELECT * FROM payment_methods WHERE status = 'active'";
        if (mode === 'deposit') {
            sql += " AND enabled_for_deposit = 1";
        } else if (mode === 'withdrawal') {
            sql += " AND enabled_for_withdrawal = 1";
        }
        sql += " ORDER BY sort_order ASC, name ASC";

        const [rows] = await db.query(sql);

        // Detect user country and apply strict country currency rules
        const countryCode = await currencyService.detectUserCountry(req);
        const rule = await currencyService.getRuleForCountry(countryCode);

        // Filter methods based on country rules
        const filteredRows = rows.filter(m => {
            const type = (m.type || '').toLowerCase();
            const provider = (m.provider || '').toLowerCase();
            const curr = (m.currency || '').toUpperCase();
            const cryptoCurr = (m.crypto_currency || '').toUpperCase();

            // Strict Algeria check or disabled USDT
            if (countryCode === 'DZ' || !rule.usdt_enabled) {
                if (type === 'crypto' || type === 'nowpayments_crypto' || provider === 'nowpayments') {
                    return false;
                }
                if (curr === 'USDT' || cryptoCurr.includes('USDT')) {
                    return false;
                }
            }

            // Gateway toggles
            if ((provider === 'stripe' || type === 'stripe') && !rule.stripe_enabled) {
                return false;
            }
            if ((provider === 'paypal' || type === 'paypal') && !rule.paypal_enabled) {
                return false;
            }
            if ((provider === 'payoneer' || type === 'payoneer') && !rule.payoneer_enabled) {
                return false;
            }
            if ((type === 'bank_transfer' || provider === 'manual') && !rule.bank_transfer_enabled) {
                return false;
            }

            return true;
        });

        // Mask sensitive server-side keys & inject Country-specific Manual Bank details if configured
        const safeMethods = filteredRows.map(m => {
            const isManualBank = (m.type === 'bank_transfer' || m.provider === 'manual');

            // If this is manual bank transfer and country rule has custom bank details, override them dynamically
            const bankName = (isManualBank && rule.bank_name) ? rule.bank_name : m.bank_name;
            const accountHolder = (isManualBank && rule.account_holder) ? rule.account_holder : m.account_holder;
            const accountNumber = (isManualBank && (rule.account_number || rule.iban)) ? (rule.account_number || rule.iban) : m.account_number;
            const swiftCode = (isManualBank && rule.swift_code) ? rule.swift_code : m.swift_code;
            const currency = (isManualBank && rule.currency_code) ? rule.currency_code : m.currency;
            const instructions = (isManualBank && rule.bank_instructions) ? rule.bank_instructions : m.instructions;
            const instructionsAr = (isManualBank && rule.bank_instructions_ar) ? rule.bank_instructions_ar : m.instructions_ar;

            const nameAr = (isManualBank && rule.country_name_ar) 
                ? `تحويل بنكي محلي (${rule.country_name_ar} - ${rule.currency_code})`
                : m.name_ar;

            const name = (isManualBank && rule.country_name)
                ? `Bank Transfer (${rule.country_name} - ${rule.currency_code})`
                : m.name;

            return {
                id: m.id,
                name,
                name_ar: nameAr,
                type: m.type,
                provider: m.provider,
                currency,
                crypto_currency: m.crypto_currency,
                crypto_network: m.crypto_network,
                crypto_wallet_address: m.crypto_wallet_address,
                bank_name: bankName,
                account_holder: accountHolder,
                account_number: accountNumber,
                iban: isManualBank ? (rule.iban || m.iban || accountNumber) : (m.iban || null),
                swift_code: swiftCode,
                instructions,
                instructions_ar: instructionsAr,
                require_receipt: !!m.require_receipt,
                public_key: m.public_key, // safe for client-side Stripe Elements / CMI
                is_sandbox: !!m.is_sandbox,
                min_deposit: Number(m.min_deposit || 0),
                max_deposit: Number(m.max_deposit || 0),
                min_withdrawal: Number(m.min_withdrawal || 0),
                max_withdrawal: Number(m.max_withdrawal || 0),
                fee_percent: Number(m.fee_percent || 0),
                fee_fixed: Number(m.fee_fixed || 0),
                enabled_for_deposit: !!m.enabled_for_deposit,
                enabled_for_withdrawal: !!m.enabled_for_withdrawal,
                country_code: countryCode,
                currency_symbol: rule.currency_symbol || '$'
            };
        });

        // Ensure that if local bank transfer is enabled for this country, it is ALWAYS present in payment methods
        const hasManualBank = safeMethods.some(m => m.type === 'bank_transfer' || m.provider === 'manual');
        if (!hasManualBank && rule.bank_transfer_enabled) {
            safeMethods.unshift({
                id: 'country-bank-' + (countryCode ? countryCode.toLowerCase() : 'manual'),
                name: rule.country_name ? `Bank Transfer (${rule.country_name} - ${rule.currency_code})` : 'Bank Transfer',
                name_ar: rule.country_name_ar ? `تحويل بنكي محلي (${rule.country_name_ar} - ${rule.currency_code})` : 'تحويل بنكي محلي',
                type: 'bank_transfer',
                provider: 'manual',
                currency: rule.currency_code || 'USD',
                crypto_currency: null,
                crypto_network: null,
                crypto_wallet_address: null,
                bank_name: rule.bank_name || (countryCode === 'DZ' ? 'BaridiMob' : 'Bank Transfer'),
                account_holder: rule.account_holder || '',
                account_number: rule.account_number || rule.iban || '',
                iban: rule.iban || rule.account_number || '',
                swift_code: rule.swift_code || '',
                instructions: rule.bank_instructions || '',
                instructions_ar: rule.bank_instructions_ar || '',
                require_receipt: true,
                public_key: null,
                is_sandbox: false,
                min_deposit: 0,
                max_deposit: 100000,
                min_withdrawal: 0,
                max_withdrawal: 50000,
                fee_percent: 0,
                fee_fixed: 0,
                enabled_for_deposit: true,
                enabled_for_withdrawal: true,
                country_code: countryCode,
                currency_symbol: rule.currency_symbol || '$'
            });
        }

        res.json({ 
            paymentMethods: safeMethods,
            detectedCountry: countryCode,
            rule: {
                country_code: rule.country_code,
                country_name: rule.country_name,
                country_name_ar: rule.country_name_ar,
                currency_code: rule.currency_code,
                currency_symbol: rule.currency_symbol,
                usd_rate: rule.usd_rate,
                usdt_enabled: rule.usdt_enabled,
                bank_name: rule.bank_name,
                account_holder: rule.account_holder,
                account_number: rule.account_number,
                iban: rule.iban,
                swift_code: rule.swift_code,
                bank_instructions_ar: rule.bank_instructions_ar
            }
        });
    } catch (err) {
        console.error('[getActiveMethodsForStudents]', err);
        res.status(500).json({ error: 'Failed to fetch active payment methods' });
    }
};
