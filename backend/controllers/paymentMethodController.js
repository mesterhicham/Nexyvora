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

        // Mask sensitive server-side keys
        const safeMethods = filteredRows.map(m => ({
            id: m.id,
            name: m.name,
            name_ar: m.name_ar,
            type: m.type,
            provider: m.provider,
            currency: m.currency,
            crypto_currency: m.crypto_currency,
            crypto_network: m.crypto_network,
            crypto_wallet_address: m.crypto_wallet_address,
            bank_name: m.bank_name,
            account_holder: m.account_holder,
            account_number: m.account_number,
            swift_code: m.swift_code,
            instructions: m.instructions,
            instructions_ar: m.instructions_ar,
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
            enabled_for_withdrawal: !!m.enabled_for_withdrawal
        }));

        res.json({ paymentMethods: safeMethods });
    } catch (err) {
        console.error('[getActiveMethodsForStudents]', err);
        res.status(500).json({ error: 'Failed to fetch active payment methods' });
    }
};
