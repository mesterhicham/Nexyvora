const db = require('../config/db');
const crypto = require('crypto');

async function initPaymentMethods() {
    try {
        console.log('Creating payment_methods table if not exists...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS payment_methods (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                name_ar VARCHAR(255) NULL,
                type VARCHAR(50) NOT NULL,
                provider VARCHAR(50) DEFAULT 'manual',
                currency VARCHAR(20) DEFAULT 'USD',
                crypto_currency VARCHAR(50) DEFAULT 'USDT_BEP20',
                crypto_network VARCHAR(50) DEFAULT 'BEP20',
                crypto_wallet_address VARCHAR(255) NULL,
                bank_name VARCHAR(255) NULL,
                account_holder VARCHAR(255) NULL,
                account_number VARCHAR(255) NULL,
                swift_code VARCHAR(100) NULL,
                instructions TEXT NULL,
                instructions_ar TEXT NULL,
                require_receipt TINYINT(1) DEFAULT 1,
                api_key VARCHAR(500) NULL,
                secret_key VARCHAR(500) NULL,
                public_key VARCHAR(500) NULL,
                webhook_secret VARCHAR(500) NULL,
                is_sandbox TINYINT(1) DEFAULT 0,
                min_deposit DECIMAL(12,2) DEFAULT 10.00,
                max_deposit DECIMAL(12,2) DEFAULT 10000.00,
                min_withdrawal DECIMAL(12,2) DEFAULT 20.00,
                max_withdrawal DECIMAL(12,2) DEFAULT 5000.00,
                fee_percent DECIMAL(5,2) DEFAULT 0.00,
                fee_fixed DECIMAL(12,2) DEFAULT 0.00,
                enabled_for_deposit TINYINT(1) DEFAULT 1,
                enabled_for_withdrawal TINYINT(1) DEFAULT 1,
                status VARCHAR(20) DEFAULT 'active',
                sort_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Check if records exist
        const [rows] = await db.query('SELECT COUNT(*) as count FROM payment_methods');
        if (rows[0].count === 0) {
            console.log('Seeding initial payment and withdrawal methods...');

            const initialMethods = [
                {
                    id: crypto.randomUUID(),
                    name: 'Credit / Debit Card (Online Gateway)',
                    name_ar: 'الدفع الإلكتروني بالبطاقة البنكية (Visa / MasterCard)',
                    type: 'card_gateway',
                    provider: 'stripe',
                    currency: 'USD',
                    crypto_currency: '',
                    crypto_network: '',
                    crypto_wallet_address: '',
                    bank_name: '',
                    account_holder: '',
                    account_number: '',
                    swift_code: '',
                    instructions: 'Pay securely using your Credit or Debit Card (Visa, MasterCard, Apple Pay). Instant balance credit upon successful checkout.',
                    instructions_ar: 'قم بالدفع الفوري والآمن باستخدام بطاقتك البنكية فيزا أو ماستركارد. يتم شحن الرصيد آلياً وفورياً بعد إتمام الدفع.',
                    require_receipt: 0,
                    api_key: '',
                    secret_key: '',
                    public_key: '',
                    webhook_secret: '',
                    is_sandbox: 1,
                    min_deposit: 10.00,
                    max_deposit: 5000.00,
                    min_withdrawal: 20.00,
                    max_withdrawal: 2500.00,
                    fee_percent: 2.90,
                    fee_fixed: 0.30,
                    enabled_for_deposit: 1,
                    enabled_for_withdrawal: 1,
                    status: 'active',
                    sort_order: 1
                },
                {
                    id: crypto.randomUUID(),
                    name: 'Bank Transfer / Manual Payment',
                    name_ar: 'التحويل البنكي اليدوي (Bank Transfer / Manuel)',
                    type: 'bank_transfer',
                    provider: 'manual',
                    currency: 'USD',
                    crypto_currency: '',
                    crypto_network: '',
                    crypto_wallet_address: '',
                    bank_name: 'Nexyvora International Bank',
                    account_holder: 'Nexyvora Academy LLC',
                    account_number: 'US98 0000 1234 5678 9012 3456',
                    swift_code: 'NXTVUS33XXX',
                    instructions: 'Please transfer the exact amount to our bank account above and upload the transfer receipt with reference number.',
                    instructions_ar: 'يرجى إرسال المبلغ المطلوب إلى الحساب البنكي أعلاه وإرفاق وصل التحويل مع رقم العملية لتأكيد وشحن رصيدك.',
                    require_receipt: 1,
                    api_key: '',
                    secret_key: '',
                    public_key: '',
                    webhook_secret: '',
                    is_sandbox: 0,
                    min_deposit: 20.00,
                    max_deposit: 25000.00,
                    min_withdrawal: 50.00,
                    max_withdrawal: 10000.00,
                    fee_percent: 0.00,
                    fee_fixed: 0.00,
                    enabled_for_deposit: 1,
                    enabled_for_withdrawal: 1,
                    status: 'active',
                    sort_order: 2
                },
                {
                    id: crypto.randomUUID(),
                    name: 'NOWPayments.io — USDT (BEP20)',
                    name_ar: 'NOWPayments.io — العملات الرقمية USDT (شبكة BEP20)',
                    type: 'nowpayments_crypto',
                    provider: 'nowpayments',
                    currency: 'USDT',
                    crypto_currency: 'USDT_BEP20',
                    crypto_network: 'BEP20',
                    crypto_wallet_address: '0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B',
                    bank_name: '',
                    account_holder: '',
                    account_number: '',
                    swift_code: '',
                    instructions: 'Send USDT strictly via BNB Smart Chain (BEP20). Auto-detected and credited within 2 block confirmations.',
                    instructions_ar: 'يرجى إرسال عملة USDT حصراً عبر شبكة BNB Smart Chain (BEP20). يتم تأكيد وشحن الرصيد تلقائياً عبر NOWPayments.',
                    require_receipt: 0,
                    api_key: '',
                    secret_key: '',
                    public_key: '',
                    webhook_secret: '',
                    is_sandbox: 0,
                    min_deposit: 10.00,
                    max_deposit: 50000.00,
                    min_withdrawal: 25.00,
                    max_withdrawal: 20000.00,
                    fee_percent: 1.00,
                    fee_fixed: 1.00,
                    enabled_for_deposit: 1,
                    enabled_for_withdrawal: 1,
                    status: 'active',
                    sort_order: 3
                }
            ];

            for (const m of initialMethods) {
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
                    m.id, m.name, m.name_ar, m.type, m.provider, m.currency, m.crypto_currency,
                    m.crypto_network, m.crypto_wallet_address, m.bank_name, m.account_holder,
                    m.account_number, m.swift_code, m.instructions, m.instructions_ar,
                    m.require_receipt, m.api_key, m.secret_key, m.public_key, m.webhook_secret,
                    m.is_sandbox, m.min_deposit, m.max_deposit, m.min_withdrawal, m.max_withdrawal,
                    m.fee_percent, m.fee_fixed, m.enabled_for_deposit, m.enabled_for_withdrawal,
                    m.status, m.sort_order
                ]);
            }
            console.log('Seeded initial payment methods successfully!');
        }

        console.log('payment_methods table is ready!');
        process.exit(0);
    } catch (err) {
        console.error('Failed to init payment_methods:', err);
        process.exit(1);
    }
}

initPaymentMethods();
