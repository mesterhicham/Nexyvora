const db = require('../config/db');

async function migrate() {
    try {
        console.log('--- Migrating country_currency_rules to support Bank Details ---');
        const [cols] = await db.query('DESCRIBE country_currency_rules');
        const existing = cols.map(c => c.Field);
        
        const newCols = [
            { name: 'bank_name', type: 'VARCHAR(255) DEFAULT NULL' },
            { name: 'account_holder', type: 'VARCHAR(255) DEFAULT NULL' },
            { name: 'account_number', type: 'VARCHAR(255) DEFAULT NULL' },
            { name: 'iban', type: 'VARCHAR(255) DEFAULT NULL' },
            { name: 'swift_code', type: 'VARCHAR(100) DEFAULT NULL' },
            { name: 'bank_instructions', type: 'TEXT DEFAULT NULL' },
            { name: 'bank_instructions_ar', type: 'TEXT DEFAULT NULL' }
        ];

        for (const col of newCols) {
            if (!existing.includes(col.name)) {
                await db.query(`ALTER TABLE country_currency_rules ADD COLUMN ${col.name} ${col.type}`);
                console.log(`✅ Added column: ${col.name}`);
            } else {
                console.log(`ℹ️ Column already exists: ${col.name}`);
            }
        }

        // Add UAE (AE) if missing
        const [aeRows] = await db.query("SELECT country_code FROM country_currency_rules WHERE country_code = 'AE'");
        if (aeRows.length === 0) {
            await db.query(`
                INSERT INTO country_currency_rules (
                    country_code, country_name, country_name_ar, currency_code, currency_symbol,
                    usd_rate, usdt_rate, usdt_enabled, local_currency_enabled,
                    stripe_enabled, paypal_enabled, payoneer_enabled, bank_transfer_enabled,
                    is_active, sort_order
                ) VALUES (
                    'AE', 'United Arab Emirates', 'الإمارات العربية المتحدة', 'AED', 'AED',
                    3.6725, 3.6725, 1, 1,
                    1, 1, 1, 1,
                    1, 6
                )
            `);
            console.log('✅ Added UAE (AE) to country_currency_rules');
        }

        // Populate realistic default bank details for MA, DZ, TN, AE if currently NULL
        const sampleBanks = [
            {
                code: 'MA',
                bank_name: 'Attijariwafa Bank (التجاري وفا بنك)',
                account_holder: 'Nextvora Academy Maroc SARL',
                account_number: '007 780 0001234567890123 45',
                iban: 'MA64 0077 8000 0123 4567 8901 2345',
                swift_code: 'BCMAMAMC',
                bank_instructions: 'Please transfer in Moroccan Dirham (MAD). Reference your username or invoice ID and upload the transfer receipt.',
                bank_instructions_ar: 'يرجى التحويل بالدرهم المغربي (MAD) إلى الحساب أعلاه مع كتابة اسم المستخدم في خانة الملاحظات وإرفاق وصل التحويل لتسريع التأكيد.'
            },
            {
                code: 'DZ',
                bank_name: 'Banque Nationale d\'Algérie (BNA) / BaridiMob (بريدي موب)',
                account_holder: 'Nextvora Academy Algérie',
                account_number: '001 00600 0001234567 89',
                iban: 'DZ52 0010 0600 0001 2345 6789',
                swift_code: 'BNALFZAL',
                bank_instructions: 'Please transfer via BaridiMob (RIP) or BNA bank transfer in Algerian Dinar (DZD). Upload transfer slip.',
                bank_instructions_ar: 'يرجى التحويل بالدينار الجزائري (DZD) عبر تطبيق بريدي موب (BaridiMob RIP) أو الحساب البنكي، مع كتابة اسم المستخدم وإرفاق وصل العملية.'
            },
            {
                code: 'TN',
                bank_name: 'Banque Internationale Arabe de Tunisie (BIAT)',
                account_holder: 'Nextvora Academy Tunisie',
                account_number: '08 000 0000123456789 01',
                iban: 'TN59 0800 0000 0123 4567 8901',
                swift_code: 'BIATTNTT',
                bank_instructions: 'Please transfer in Tunisian Dinar (TND) and upload the payment receipt with transaction ID.',
                bank_instructions_ar: 'يرجى التحويل بالدينار التونسي (TND) إلى الحساب البنكي المعتمد أعلاه وإرفاق وصل التحويل لتفعيل رصيدك.'
            },
            {
                code: 'AE',
                bank_name: 'Emirates NBD (بنك الإمارات دبي الوطني)',
                account_holder: 'Nextvora Education LLC',
                account_number: '101 23456789 01',
                iban: 'AE07 0260 0001 0123 4567 8901',
                swift_code: 'EBILAEAD',
                bank_instructions: 'Please transfer in UAE Dirham (AED) or USD and attach your wire confirmation slip.',
                bank_instructions_ar: 'يرجى التحويل بالدرهم الإماراتي (AED) أو الدولار إلى الحساب أعلاه وإرفاق إشعار التحويل البنكي لتأكيد العملية.'
            }
        ];

        for (const b of sampleBanks) {
            await db.query(`
                UPDATE country_currency_rules
                SET bank_name = COALESCE(bank_name, ?),
                    account_holder = COALESCE(account_holder, ?),
                    account_number = COALESCE(account_number, ?),
                    iban = COALESCE(iban, ?),
                    swift_code = COALESCE(swift_code, ?),
                    bank_instructions = COALESCE(bank_instructions, ?),
                    bank_instructions_ar = COALESCE(bank_instructions_ar, ?)
                WHERE country_code = ?
            `, [
                b.bank_name, b.account_holder, b.account_number, b.iban,
                b.swift_code, b.bank_instructions, b.bank_instructions_ar, b.code
            ]);
            console.log(`✅ Configured default bank details for: ${b.code}`);
        }

        console.log('🎉 Migration completed successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await db.end();
    }
}

migrate();
