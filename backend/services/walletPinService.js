const bcrypt = require('bcryptjs');
const db = require('../config/db');

const PIN_REGEX = /^\d{4,6}$/;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 30;

class WalletPinError extends Error {
    constructor(message, code, status = 400, extra = {}) {
        super(message);
        this.code = code;
        this.status = status;
        Object.assign(this, extra);
    }
}

function isValidPinFormat(pin) {
    return typeof pin === 'string' && PIN_REGEX.test(pin);
}

async function getPinStatus(userId, conn = db) {
    const [rows] = await conn.query(
        'SELECT wallet_pin_hash, wallet_pin_locked_until FROM users WHERE id = ? LIMIT 1',
        [userId]
    );
    if (rows.length === 0) return { hasPin: false, lockedUntil: null };
    const lockedUntil = rows[0].wallet_pin_locked_until && new Date(rows[0].wallet_pin_locked_until) > new Date()
        ? new Date(rows[0].wallet_pin_locked_until)
        : null;
    return { hasPin: !!rows[0].wallet_pin_hash, lockedUntil };
}

/**
 * Verify the PIN of a user. Throws WalletPinError when missing, locked or wrong.
 * Failed attempts are counted and the PIN is locked after MAX_FAILED_ATTEMPTS.
 */
async function verifyPin(userId, pin) {
    const [rows] = await db.query(
        'SELECT wallet_pin_hash, wallet_pin_failed_attempts, wallet_pin_locked_until FROM users WHERE id = ? LIMIT 1',
        [userId]
    );
    const row = rows[0];
    if (!row || !row.wallet_pin_hash) {
        throw new WalletPinError(
            'يجب إنشاء رمز PIN للمحفظة قبل السحب / You must create a wallet PIN before withdrawing',
            'WALLET_PIN_NOT_SET', 400
        );
    }
    if (row.wallet_pin_locked_until && new Date(row.wallet_pin_locked_until) > new Date()) {
        throw new WalletPinError(
            'تم قفل رمز PIN مؤقتاً بسبب محاولات خاطئة متكررة / Wallet PIN is temporarily locked after too many failed attempts',
            'WALLET_PIN_LOCKED', 423, { lockedUntil: row.wallet_pin_locked_until }
        );
    }
    if (!isValidPinFormat(String(pin || ''))) {
        throw new WalletPinError('رمز PIN مطلوب (4 إلى 6 أرقام) / Wallet PIN is required (4-6 digits)', 'WALLET_PIN_REQUIRED', 400);
    }

    const ok = await bcrypt.compare(String(pin), row.wallet_pin_hash);
    if (!ok) {
        const attempts = Number(row.wallet_pin_failed_attempts || 0) + 1;
        if (attempts >= MAX_FAILED_ATTEMPTS) {
            await db.query(
                'UPDATE users SET wallet_pin_failed_attempts = 0, wallet_pin_locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id = ?',
                [LOCK_MINUTES, userId]
            );
            throw new WalletPinError(
                `تم قفل رمز PIN لمدة ${LOCK_MINUTES} دقيقة / Wallet PIN locked for ${LOCK_MINUTES} minutes`,
                'WALLET_PIN_LOCKED', 423
            );
        }
        await db.query('UPDATE users SET wallet_pin_failed_attempts = ? WHERE id = ?', [attempts, userId]);
        const left = MAX_FAILED_ATTEMPTS - attempts;
        throw new WalletPinError(
            `رمز PIN غير صحيح. المحاولات المتبقية: ${left} / Incorrect wallet PIN. Attempts left: ${left}`,
            'WALLET_PIN_INVALID', 401, { attemptsLeft: left }
        );
    }

    if (Number(row.wallet_pin_failed_attempts || 0) > 0 || row.wallet_pin_locked_until) {
        await db.query('UPDATE users SET wallet_pin_failed_attempts = 0, wallet_pin_locked_until = NULL WHERE id = ?', [userId]);
    }
    return true;
}

/**
 * Create or change the PIN of a user. Changing an existing PIN requires the current one.
 */
async function setPin(userId, newPin, currentPin) {
    if (!isValidPinFormat(String(newPin || ''))) {
        throw new WalletPinError('رمز PIN يجب أن يتكون من 4 إلى 6 أرقام / Wallet PIN must be 4-6 digits', 'WALLET_PIN_FORMAT', 400);
    }
    const status = await getPinStatus(userId);
    if (status.hasPin) {
        await verifyPin(userId, currentPin);
    }
    const hash = await bcrypt.hash(String(newPin), 12);
    await db.query(
        'UPDATE users SET wallet_pin_hash = ?, wallet_pin_failed_attempts = 0, wallet_pin_locked_until = NULL WHERE id = ?',
        [hash, userId]
    );
}

async function resetPin(userId, conn = db) {
    await conn.query(
        'UPDATE users SET wallet_pin_hash = NULL, wallet_pin_failed_attempts = 0, wallet_pin_locked_until = NULL WHERE id = ?',
        [userId]
    );
}

/**
 * Send a WalletPinError as an HTTP response. Returns false for any other error.
 */
function sendPinError(res, err) {
    if (!(err instanceof WalletPinError)) return false;
    const body = { error: err.message, code: err.code };
    if (err.attemptsLeft !== undefined) body.attemptsLeft = err.attemptsLeft;
    if (err.lockedUntil) body.lockedUntil = err.lockedUntil;
    res.status(err.status).json(body);
    return true;
}

module.exports = {
    WalletPinError,
    isValidPinFormat,
    getPinStatus,
    verifyPin,
    setPin,
    resetPin,
    sendPinError,
    MAX_FAILED_ATTEMPTS,
};
