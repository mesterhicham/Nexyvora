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
async function getRuleForCountry(countryCode) {
    const rules = await getAllCountryRules();
    const code = (countryCode || '').toUpperCase().trim();
    
    // Strict requirement: Local currency is ONLY enabled for Morocco (MA) and Algeria (DZ).
    // All other countries MUST receive USD ($) without local currency conversion.
    if (code === 'DZ') {
        let rule = rules.find(r => r.country_code === 'DZ' && r.is_active);
        if (!rule) {
            return {
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
                paypal_enabled: 0,
                payoneer_enabled: 0,
                bank_transfer_enabled: 1,
                is_active: 1
            };
        }
        return {
            ...rule,
            usd_rate: Number(rule.usd_rate) || 250,
            usdt_rate: Number(rule.usdt_rate) || 250,
            usdt_enabled: false, // Strict ban on USDT for Algeria
            local_currency_enabled: true,
            stripe_enabled: !!rule.stripe_enabled,
            paypal_enabled: !!rule.paypal_enabled,
            payoneer_enabled: !!rule.payoneer_enabled,
            bank_transfer_enabled: !!rule.bank_transfer_enabled
        };
    }

    if (code === 'MA') {
        let rule = rules.find(r => r.country_code === 'MA' && r.is_active);
        if (!rule) {
            return {
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
                is_active: 1
            };
        }
        return {
            ...rule,
            usd_rate: Number(rule.usd_rate) || 10,
            usdt_rate: Number(rule.usdt_rate) || 10,
            usdt_enabled: !!rule.usdt_enabled,
            local_currency_enabled: true,
            stripe_enabled: !!rule.stripe_enabled,
            paypal_enabled: !!rule.paypal_enabled,
            payoneer_enabled: !!rule.payoneer_enabled,
            bank_transfer_enabled: !!rule.bank_transfer_enabled
        };
    }

    // All other countries or guests: strictly USD ($) with no local currency
    return {
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

/**
 * Detect country code from user profile, query params, or request headers
 */
async function detectUserCountry(req) {
    // 0. Query parameter override (e.g. ?country=DZ or ?country=Algeria)
    const queryCountry = (req.query?.country || req.query?.country_code || '').toString().toLowerCase().trim();
    if (queryCountry) {
        if (queryCountry === 'dz' || queryCountry.includes('algeria') || queryCountry.includes('algérie') || queryCountry.includes('الجزائر')) {
            return 'DZ';
        }
        if (queryCountry === 'ma' || queryCountry.includes('morocco') || queryCountry.includes('maroc') || queryCountry.includes('المغرب')) {
            return 'MA';
        }
    }

    // 1. If user is logged in, look up user's saved country in profiles
    if (req.user && req.user.id) {
        try {
            const [rows] = await db.query(`
                SELECT country_code, country 
                FROM profiles 
                WHERE id = ? 
                LIMIT 1
            `, [req.user.id]);

            if (rows.length > 0) {
                const cCode = (rows[0].country_code || '').toUpperCase().trim();
                const cName = (rows[0].country || '').toLowerCase().trim();

                if (cCode === 'DZ' || cName.includes('algeria') || cName.includes('algérie') || cName.includes('الجزائر')) {
                    return 'DZ';
                }
                if (cCode === 'MA' || cName.includes('morocco') || cName.includes('maroc') || cName.includes('المغرب')) {
                    return 'MA';
                }

                // If user selected any other country, return GLOBAL (USD)
                return 'GLOBAL';
            }
        } catch (err) {
            console.error('[detectUserCountry] profile lookup error:', err);
        }
    }

    // 2. Check Proxy / CDN Headers
    const headers = req.headers || {};
    const ipCountry = (headers['cf-ipcountry'] || headers['x-country-code'] || headers['x-country'] || '').toUpperCase().trim();
    if (ipCountry === 'DZ') return 'DZ';
    if (ipCountry === 'MA') return 'MA';

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

    // Strict Algeria check
    const isAlgeria = rule.country_code === 'DZ';
    const isMorocco = rule.country_code === 'MA';

    // Non-Algerian & Non-Moroccan: strictly USD ($)
    if (!isAlgeria && !isMorocco) {
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

    // Format local string
    const formattedLocal = `${Math.round(localAmount).toLocaleString()} ${rule.currency_code}`;

    if (isAlgeria || !rule.usdt_enabled) {
        return {
            country_code: rule.country_code,
            primary_amount: Math.round(localAmount),
            primary_currency: rule.currency_code,
            currency_symbol: rule.currency_symbol,
            formatted_primary: formattedLocal,
            formatted_dual: formattedLocal, // Strictly no USDT or USD for Algeria
            usdt_enabled: false,
            usdt_amount: null
        };
    }

    // For Morocco with USDT enabled:
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

module.exports = {
    getAllCountryRules,
    getRuleForCountry,
    detectUserCountry,
    formatAmount,
    invalidateCache
};
