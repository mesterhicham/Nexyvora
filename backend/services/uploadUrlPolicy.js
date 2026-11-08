/**
 * Validation of user-submitted upload URLs (payment receipts, proofs...).
 * Only URLs pointing to files served by this platform are accepted. This blocks
 * `javascript:` / `data:` payloads (stored XSS in admin screens) and links to
 * other users' private files.
 */

const PUBLIC_PREFIX = '/uploads/';
const SECURE_PREFIX = '/api/upload/secure/';
const SAFE_FILENAME = /^[A-Za-z0-9._-]+$/;

function extractPath(rawUrl) {
    const value = String(rawUrl || '').trim();
    if (!value) return null;
    if (value.startsWith('/') && !value.startsWith('//')) return value.split(/[?#]/)[0];
    try {
        const parsed = new URL(value);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
        return parsed.pathname;
    } catch {
        return null;
    }
}

/**
 * @returns {{ ok: true, value: string } | { ok: false, error: string }}
 *          value is a host-less canonical path, or '' when no receipt was provided.
 */
function validateReceiptUrl(rawUrl, userId, { allowPublic = true } = {}) {
    const value = String(rawUrl || '').trim();
    if (!value) return { ok: true, value: '' };

    const path = extractPath(value);
    if (!path) return { ok: false, error: 'رابط الإيصال غير صالح / Invalid receipt URL' };

    // The API may be mounted behind a prefix (e.g. /backend/api/...), so match on the tail.
    const secureIdx = path.indexOf(SECURE_PREFIX);
    if (secureIdx !== -1) {
        const filename = path.slice(secureIdx + SECURE_PREFIX.length);
        if (!SAFE_FILENAME.test(filename) || !filename.startsWith(`sec_${userId}_`)) {
            return { ok: false, error: 'الإيصال لا يخص حسابك / Receipt file does not belong to your account' };
        }
        // Store a host-less canonical path so no foreign domain is ever persisted.
        return { ok: true, value: `${SECURE_PREFIX}${filename}` };
    }

    const publicIdx = path.indexOf(PUBLIC_PREFIX);
    if (allowPublic && publicIdx !== -1) {
        const filename = path.slice(publicIdx + PUBLIC_PREFIX.length);
        if (!SAFE_FILENAME.test(filename)) {
            return { ok: false, error: 'رابط الإيصال غير صالح / Invalid receipt URL' };
        }
        return { ok: true, value: `${PUBLIC_PREFIX}${filename}` };
    }

    return { ok: false, error: 'يجب رفع الإيصال عبر المنصة / Receipt must be uploaded through the platform' };
}

/**
 * Generic guard for user-supplied links that are rendered as <a href> / <img src>.
 * Accepts empty values, same-origin relative paths and http(s) URLs only.
 */
function isSafeHttpUrl(rawUrl) {
    const value = String(rawUrl || '').trim();
    if (!value) return true;
    return extractPath(value) !== null;
}

module.exports = { validateReceiptUrl, isSafeHttpUrl, extractPath };
