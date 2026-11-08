const db = require('../config/db');

// In-memory cache for country rules
let rulesCache = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

/**
 * Fetch all active country rules from DB (cached)
 */
async function getAllCountryRules(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && rulesCache && (now - cacheTimestamp < CACHE_TTL_MS)) {
        return rulesCache;
    }

    try {
        const [rows] = await db.query(`
            SELECT * FROM country_currency_rules 
            ORDER BY sort_order ASC, country_name ASC
        `);
        rulesCache = rows;
        cacheTimestamp = now;
        return rows;
    } catch (err) {
        console.error('[currencyService.getAllCountryRules] Error:', err);
        return rulesCache || [];
    }
}

/**
 * Clear in-memory cache
 */
function invalidateCache() {
    rulesCache = null;
    cacheTimestamp = 0;
}

/**
 * Get currency rule for a specific country code (Strictly DZ or MA for local currency, otherwise GLOBAL/USD)
 */
/**
 * Get currency rule for a specific country code.
 * Searches database rules, applies strict security constraints (USDT ban on Algeria DZ),
 * and returns bank account details and exchange rates.
 */
async function getRuleForCountry(countryCode) {
    const rules = await getAllCountryRules();
    const code = (countryCode || '').toUpperCase().trim();

    // 1. Check exact match in configured rules
    let rule = rules.find(r => r.country_code === code && r.is_active);

    // Fallbacks if not found in database:
    if (!rule) {
        if (code === 'DZ') {
            rule = {
                country_code: 'DZ',
                country_name: 'Algeria',
                country_name_ar: 'الجزائر',
                currency_code: 'DZD',
                currency_symbol: 'DA',
                usd_rate: 250.0,
                usdt_rate: 250.0,
                usdt_enabled: 0,
                local_currency_enabled: 1,
                stripe_enabled: 0,
                paypal_enabled: 1, // Algeria: local bank transfer + PayPal card checkout, never crypto
                payoneer_enabled: 0,
                bank_transfer_enabled: 1,
                is_active: 1,
                bank_name: "Banque Nationale d'Algérie (BNA) / BaridiMob (بريدي موب)",
                account_holder: 'Nextvora Academy Algérie',
                account_number: '001 00600 0001234567 89',
                iban: 'DZ52 0010 0600 0001 2345 6789',
                swift_code: 'BNALFZAL',
                bank_instructions_ar: 'يرجى التحويل بالدينار الجزائري (DZD) عبر تطبيق بريدي موب (BaridiMob RIP) أو الحساب البنكي، مع كتابة اسم المستخدم وإرفاق وصل العملية.'
            };
        } else if (code === 'MA') {
            rule = {
                country_code: 'MA',
                country_name: 'Morocco',
                country_name_ar: 'المغرب',
                currency_code: 'MAD',
                currency_symbol: 'DH',
                usd_rate: 10.0,
                usdt_rate: 10.0,
                usdt_enabled: 1,
                local_currency_enabled: 1,
                stripe_enabled: 0,
                paypal_enabled: 0,
                payoneer_enabled: 0,
                bank_transfer_enabled: 1,
                is_active: 1,
                bank_name: 'Attijariwafa Bank (التجاري وفا بنك)',
                account_holder: 'Nextvora Academy Maroc SARL',
                account_number: '007 780 0001234567890123 45',
                iban: 'MA64 0077 8000 0123 4567 8901 2345',
                swift_code: 'BCMAMAMC',
                bank_instructions_ar: 'يرجى التحويل بالدرهم المغربي (MAD) إلى الحساب أعلاه مع كتابة اسم المستخدم في خانة الملاحظات وإرفاق وصل التحويل لتسريع التأكيد.'
            };
        } else if (code === 'TN') {
            rule = {
                country_code: 'TN',
                country_name: 'Tunisia',
                country_name_ar: 'تونس',
                currency_code: 'TND',
                currency_symbol: 'DT',
                usd_rate: 3.10,
                usdt_rate: 3.10,
                usdt_enabled: 1,
                local_currency_enabled: 1,
                stripe_enabled: 0,
                paypal_enabled: 0,
                payoneer_enabled: 0,
                bank_transfer_enabled: 1,
                is_active: 1,
                bank_name: 'Banque Internationale Arabe de Tunisie (BIAT)',
                account_holder: 'Nextvora Academy Tunisie',
                account_number: '08 000 0000123456789 01',
                iban: 'TN59 0800 0000 0123 4567 8901',
                swift_code: 'BIATTNTT',
                bank_instructions_ar: 'يرجى التحويل بالدينار التونسي (TND) إلى الحساب البنكي المعتمد أعلاه وإرفاق وصل التحويل لتفعيل رصيدك.'
            };
        } else if (code === 'AE') {
            rule = {
                country_code: 'AE',
                country_name: 'United Arab Emirates',
                country_name_ar: 'الإمارات العربية المتحدة',
                currency_code: 'AED',
                currency_symbol: 'AED',
                usd_rate: 3.6725,
                usdt_rate: 3.6725,
                usdt_enabled: 1,
                local_currency_enabled: 1,
                stripe_enabled: 1,
                paypal_enabled: 1,
                payoneer_enabled: 1,
                bank_transfer_enabled: 1,
                is_active: 1,
                bank_name: 'Emirates NBD (بنك الإمارات دبي الوطني)',
                account_holder: 'Nextvora Education LLC',
                account_number: '101 23456789 01',
                iban: 'AE07 0260 0001 0123 4567 8901',
                swift_code: 'EBILAEAD',
                bank_instructions_ar: 'يرجى التحويل بالدرهم الإماراتي (AED) أو الدولار إلى الحساب أعلاه وإرفاق إشعار التحويل البنكي لتأكيد العملية.'
            };
        } else {
            // Global / Rest of World
            rule = rules.find(r => r.country_code === 'GLOBAL' && r.is_active) || {
                country_code: 'GLOBAL',
                country_name: 'Global / Rest of World',
                country_name_ar: 'عالمي',
                currency_code: 'USD',
                currency_symbol: '$',
                usd_rate: 1.0,
                usdt_rate: 1.0,
                usdt_enabled: 1,
                local_currency_enabled: 0,
                stripe_enabled: 1,
                paypal_enabled: 1,
                payoneer_enabled: 1,
                bank_transfer_enabled: 1,
                is_active: 1
            };
        }
    }

    const isAlgeria = rule.country_code === 'DZ';

    return {
        ...rule,
        usd_rate: Number(rule.usd_rate) || 1.0,
        usdt_rate: Number(rule.usdt_rate) || 1.0,
        usdt_enabled: isAlgeria ? false : (rule.usdt_enabled !== undefined ? !!rule.usdt_enabled : true),
        local_currency_enabled: rule.local_currency_enabled !== undefined ? !!rule.local_currency_enabled : (rule.country_code !== 'GLOBAL'),
        stripe_enabled: !!rule.stripe_enabled,
        paypal_enabled: !!rule.paypal_enabled,
        payoneer_enabled: !!rule.payoneer_enabled,
        bank_transfer_enabled: rule.bank_transfer_enabled !== undefined ? !!rule.bank_transfer_enabled : true,
        bank_name: rule.bank_name || null,
        account_holder: rule.account_holder || null,
        account_number: rule.account_number || null,
        iban: rule.iban || null,
        swift_code: rule.swift_code || null,
        bank_instructions: rule.bank_instructions || null,
        bank_instructions_ar: rule.bank_instructions_ar || null
    };
}

/**
 * Country of an international phone number (e.g. +213..., 00213..., 213...).
 * Local numbers starting with a single 0 are ambiguous (06/07 exist in DZ and MA) and are ignored.
 */
const PHONE_PREFIXES = [
    ['213', 'DZ'], ['212', 'MA'], ['216', 'TN'], ['971', 'AE'], ['974', 'QA'], ['966', 'SA'], ['33', 'FR'], ['1', 'US'],
];
function countryFromPhone(raw) {
    let digits = String(raw || '').replace(/[^\d+]/g, '');
    if (!digits) return null;
    if (digits.startsWith('+')) digits = digits.slice(1);
    else if (digits.startsWith('00')) digits = digits.slice(2);
    else if (digits.startsWith('0')) return null;
    if (digits.length < 8) return null;
    const match = PHONE_PREFIXES.find(([prefix]) => digits.startsWith(prefix));
    return match ? match[1] : null;
}

/**
 * Only trust the Cloudflare country header when the API really sits behind Cloudflare:
 * otherwise any client can send it. Generic x-country headers are never trusted.
 */
function getTrustedIpCountry(req) {
    if (process.env.TRUST_CF_IPCOUNTRY !== 'true') return '';
    const value = String(req.headers?.['cf-ipcountry'] || '').toUpperCase().trim();
    return value === 'XX' || value === 'T1' ? '' : value;
}

/**
 * Detect the country code of a request.
 *
 * Display mode (default): ?country= override, then profile, then trusted IP country.
 * Strict mode ({ strict: true }) for money movements (deposits, withdrawals):
 *   - the client-controlled ?country= override is ignored;
 *   - the profile country, the phone number country and the trusted IP country are evaluated and the most
 *     restrictive one wins (a country with USDT disabled beats one with USDT enabled),
 *     so editing the profile or using a VPN alone cannot lift a regulatory restriction.
 */
async function detectUserCountry(req, { strict = false } = {}) {
    const rules = await getAllCountryRules();
    const availableCodes = rules.map(r => r.country_code.toUpperCase());

    // Helper to map country names to standard codes
    const mapNameToCode = (input) => {
        if (!input) return null;
        const str = input.toString().toLowerCase().trim();
        const strUpper = input.toString().toUpperCase().trim();

        if (strUpper === 'DZ' || str.includes('algeria') || str.includes('algérie') || str.includes('الجزائر')) return 'DZ';
        if (strUpper === 'MA' || str.includes('morocco') || str.includes('maroc') || str.includes('المغرب')) return 'MA';
        if (strUpper === 'TN' || str.includes('tunisia') || str.includes('tunisie') || str.includes('تونس')) return 'TN';
        if (strUpper === 'AE' || str.includes('emirates') || str.includes('uae') || str.includes('الإمارات')) return 'AE';
        if (strUpper === 'FR' || str.includes('france') || str.includes('فرنسا')) return 'FR';
        if (strUpper === 'US' || str.includes('united states') || str.includes('usa') || str.includes('أمريكا')) return 'US';

        // Check if input is a 2-letter ISO code that exists in rules
        if (strUpper.length === 2 && availableCodes.includes(strUpper)) {
            return strUpper;
        }

        // Fuzzy search by country_name or country_name_ar in rules
        const matched = rules.find(r => 
            r.country_code.toLowerCase() === str ||
            (r.country_name && r.country_name.toLowerCase() === str) ||
            (r.country_name_ar && r.country_name_ar.includes(str))
        );
        return matched ? matched.country_code : null;
    };

    // 0. Query parameter override (display only, never for money movements)
    if (!strict) {
        const queryCountry = req.query?.country || req.query?.country_code;
        const queryMatch = mapNameToCode(queryCountry);
        if (queryMatch) return queryMatch;
    }

    // 1. Saved profile country of the logged-in user, and the country of their phone number
    let profileCode = null;
    let phoneCode = null;
    if (req.user && req.user.id) {
        try {
            const [rows] = await db.query(`
                SELECT country_code, country, whatsapp_number, phone
                FROM profiles 
                WHERE id = ? 
                LIMIT 1
            `, [req.user.id]);

            if (rows.length > 0) {
                profileCode = mapNameToCode(rows[0].country_code) || mapNameToCode(rows[0].country) || 'GLOBAL';
                phoneCode = countryFromPhone(rows[0].whatsapp_number) || countryFromPhone(rows[0].phone);
            }
        } catch (err) {
            console.error('[detectUserCountry] profile lookup error:', err);
        }
    }

    // 2. Trusted CDN country header
    const ipCode = mapNameToCode(getTrustedIpCountry(req));

    if (strict) {
        const candidates = [...new Set([profileCode, phoneCode, ipCode].filter(Boolean))];
        for (const code of candidates) {
            if (code === 'DZ') return 'DZ';
        }
        for (const code of candidates) {
            const rule = await getRuleForCountry(code);
            if (!rule.usdt_enabled) return code;
        }
        return candidates[0] || 'GLOBAL';
    }

    // A member whose profile or phone points to Algeria always gets the Algerian rules,
    // so prices, bank details and allowed methods stay consistent with the strict checks.
    if (profileCode === 'DZ' || phoneCode === 'DZ') return 'DZ';
    if (profileCode) return profileCode;
    if (ipCode) return ipCode;

    // 3. Fallback default for unknown / global visitors is GLOBAL (USD)
    return 'GLOBAL';
}

/**
 * Convert USD amount to localized representation according to country rules
 */
function formatAmount(usdAmount, rule) {
    const amount = Number(usdAmount || 0);
    const usdRate = Number(rule.usd_rate || 1);
    const localAmount = amount * usdRate;

    const isAlgeria = rule.country_code === 'DZ';
    const isGlobal = rule.country_code === 'GLOBAL' || !rule.local_currency_enabled;

    // Global / Non-local: strictly USD ($)
    if (isGlobal) {
        return {
            country_code: 'GLOBAL',
            primary_amount: amount,
            primary_currency: 'USD',
            currency_symbol: '$',
            formatted_primary: `$${amount.toLocaleString()}`,
            formatted_dual: `$${amount.toLocaleString()} USD`,
            usdt_enabled: true,
            usdt_amount: amount
        };
    }

    const formattedLocal = `${Math.round(localAmount).toLocaleString()} ${rule.currency_code}`;

    // Strictly no USDT or USD for Algeria
    if (isAlgeria || !rule.usdt_enabled) {
        return {
            country_code: rule.country_code,
            primary_amount: Math.round(localAmount),
            primary_currency: rule.currency_code,
            currency_symbol: rule.currency_symbol,
            formatted_primary: formattedLocal,
            formatted_dual: formattedLocal,
            usdt_enabled: false,
            usdt_amount: null
        };
    }

    // Countries with USDT enabled (e.g. Morocco, Tunisia, UAE, etc.):
    const formattedUsdt = `${amount.toLocaleString()} USDT`;
    const formattedDual = `${formattedLocal} (≈ ${formattedUsdt})`;

    return {
        country_code: rule.country_code,
        primary_amount: Math.round(localAmount * 100) / 100,
        primary_currency: rule.currency_code,
        currency_symbol: rule.currency_symbol,
        formatted_primary: formattedLocal,
        formatted_dual: formattedDual,
        usdt_enabled: true,
        usdt_amount: amount
    };
}

/**
 * True when any of the given payment descriptors (method name, provider, reference...) denotes crypto / USDT.
 */
function isCryptoPayment(...values) {
    return values.some(v => {
        const str = String(v || '').toLowerCase();
        return str.includes('usdt') || str.includes('crypto') || str.includes('nowpayments');
    });
}

/**
 * Regulatory rule for money movements: crypto is forbidden for Algeria and for any country
 * whose rule has USDT disabled. Uses strict country detection (no client overrides).
 */
async function isCryptoBlockedFor(req) {
    const countryCode = await detectUserCountry(req, { strict: true });
    const rule = await getRuleForCountry(countryCode);
    return countryCode === 'DZ' || !rule.usdt_enabled;
}

module.exports = {
    countryFromPhone,
    isCryptoPayment,
    isCryptoBlockedFor,
    getAllCountryRules,
    getRuleForCountry,
    detectUserCountry,
    formatAmount,
    invalidateCache
};
