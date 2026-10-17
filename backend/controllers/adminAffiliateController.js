const db = require('../config/db');
const crypto = require('crypto');
const genUuid = () => crypto.randomUUID();
const packageController = require('./packageController');
const emailService = require('../services/emailService');

/**
 * 1. WALLET MANAGEMENT
 */
exports.getWallets = async (req, res) => {
    const { search, filter, sort } = req.query;

    try {
        let query = `
            SELECT 
                u.id, 
                COALESCE(p.full_name, u.email) AS name, 
                u.email, 
                u.affiliate_code, 
                p.avatar_url,
                COALESCE(w.balance, 0) AS main_balance,
                COALESCE(w.total_earned, 0) AS commissions,
                COALESCE(w.pending_balance, 0) AS bonus,
                COALESCE(w.total_withdrawn, 0) AS total_withdrawn,
                COALESCE(w.can_withdraw, 1) AS can_withdraw
            FROM users u
            LEFT JOIN profiles p ON u.id = p.id
            LEFT JOIN user_wallets w ON u.id = w.user_id
            WHERE u.role = 'student'
        `;

        const params = [];

        if (search) {
            query += ` AND (p.full_name LIKE ? OR u.email LIKE ? OR u.affiliate_code LIKE ?)`;
            const s = `%${search}%`;
            params.push(s, s, s);
        }

        if (filter === 'with_balance') {
            query += ` AND w.balance > 0`;
        }

        if (sort === 'max_balance') {
            query += ` ORDER BY main_balance DESC`;
        } else if (sort === 'max_commissions') {
            query += ` ORDER BY commissions DESC`;
        } else {
            query += ` ORDER BY u.created_at DESC`;
        }

        const [members] = await db.query(query, params);

        // Overall statistics
        const [totalRow] = await db.query(`
            SELECT 
                COUNT(*) AS totalMembers,
                SUM(CASE WHEN balance > 0 THEN 1 ELSE 0 END) AS membersWithBalance,
                SUM(balance) AS totalBalances,
                SUM(total_earned) AS totalCommissionsPaid
            FROM user_wallets
        `);

        res.json({
            members,
            stats: {
                totalMembers: totalRow[0]?.totalMembers || 0,
                membersWithBalance: totalRow[0]?.membersWithBalance || 0,
                totalBalances: Number(totalRow[0]?.totalBalances || 0),
                totalCommissionsPaid: Number(totalRow[0]?.totalCommissionsPaid || 0),
            }
        });
    } catch (err) {
        console.error('[getWallets]', err);
        res.status(500).json({ error: 'Failed to fetch wallets' });
    }
};

exports.adjustWalletBalance = async (req, res) => {
    const { userId, action, amount, note } = req.body;
    const numAmount = Number(amount);

    if (!numAmount || numAmount <= 0) {
        return res.status(400).json({ error: 'Please specify a valid amount' });
    }
    if (!['credit', 'debit'].includes(action)) {
        return res.status(400).json({ error: 'Action must be credit or debit' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [wallets] = await connection.query('SELECT * FROM user_wallets WHERE user_id = ? FOR UPDATE', [userId]);
        if (wallets.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'User wallet not found' });
        }

        const wallet = wallets[0];
        const balanceBefore = Number(wallet.balance);
        let balanceAfter = balanceBefore;

        if (action === 'credit') {
            balanceAfter = balanceBefore + numAmount;
            await connection.query(`
                UPDATE user_wallets
                SET balance = balance + ?
                WHERE user_id = ?
            `, [numAmount, userId]);
        } else {
            if (balanceBefore < numAmount) {
                await connection.rollback();
                return res.status(400).json({ error: 'User does not have sufficient balance to deduct this amount' });
            }
            balanceAfter = balanceBefore - numAmount;
            await connection.query(`
                UPDATE user_wallets
                SET balance = balance - ?
                WHERE user_id = ?
            `, [numAmount, userId]);
        }

        // Record in transactions
        await connection.query(`
            INSERT INTO transactions (id, user_id, type, amount, currency, balance_before, balance_after, status, reference_id, description)
            VALUES (?, ?, ?, ?, 'USD', ?, ?, 'completed', ?, ?)
        `, [
            genUuid(),
            userId,
            action === 'credit' ? 'admin_credit' : 'admin_debit',
            numAmount,
            balanceBefore,
            balanceAfter,
            `ADM-${Date.now()}`,
            note || (action === 'credit' ? 'Manual credit by administrator' : 'Manual debit by administrator')
        ]);

        await connection.commit();
        res.json({ message: 'Balance adjusted successfully', newBalance: balanceAfter });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('[adjustWalletBalance]', err);
        res.status(500).json({ error: 'Failed to adjust balance' });
    } finally {
        connection.release();
    }
};

exports.toggleUserWithdrawal = async (req, res) => {
    const { userId, canWithdraw } = req.body;
    try {
        await db.query(`
            UPDATE user_wallets
            SET can_withdraw = ?
            WHERE user_id = ?
        `, [canWithdraw ? 1 : 0, userId]);

        res.json({ message: `Withdrawal ${canWithdraw ? 'enabled' : 'disabled'} successfully` });
    } catch (err) {
        console.error('[toggleUserWithdrawal]', err);
        res.status(500).json({ error: 'Failed to update withdrawal status' });
    }
};

/**
 * 2. WITHDRAWAL MONITORING
 */
exports.getAdminWithdrawals = async (req, res) => {
    const { status } = req.query;

    try {
        let query = `
            SELECT 
                w.id,
                w.user_id,
                w.amount,
                w.payment_method,
                w.payment_details,
                w.status,
                w.admin_notes,
                w.transaction_proof,
                w.created_at,
                w.processed_at,
                COALESCE(p.full_name, u.email) AS user_name,
                u.email AS user_email,
                p.avatar_url
            FROM withdrawal_requests w
            JOIN users u ON w.user_id = u.id
            LEFT JOIN profiles p ON u.id = p.id
        `;

        const params = [];
        if (status && status !== 'all') {
            query += ` WHERE w.status = ?`;
            params.push(status);
        }

        query += ` ORDER BY w.created_at DESC`;

        const [withdrawals] = await db.query(query, params);
        res.json({ withdrawals });
    } catch (err) {
        console.error('[getAdminWithdrawals]', err);
        res.status(500).json({ error: 'Failed to fetch withdrawals' });
    }
};

exports.approveWithdrawal = async (req, res) => {
    const { id } = req.params;
    const { transactionProof, notes } = req.body;
    const adminId = req.user.id;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [rows] = await connection.query('SELECT * FROM withdrawal_requests WHERE id = ? FOR UPDATE', [id]);
        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Withdrawal request not found' });
        }
        const request = rows[0];

        if (request.status !== 'pending') {
            await connection.rollback();
            return res.status(400).json({ error: 'This request is already processed' });
        }

        // Increment total_withdrawn now that payment is approved
        await connection.query(`
            UPDATE user_wallets
            SET total_withdrawn = total_withdrawn + ?
            WHERE user_id = ?
        `, [request.amount, request.user_id]);

        await connection.query(`
            UPDATE withdrawal_requests
            SET status = 'completed',
                transaction_proof = ?,
                admin_notes = ?,
                processed_by = ?,
                processed_at = NOW()
            WHERE id = ?
        `, [transactionProof || null, notes || null, adminId, id]);

        // Record in transactions ledger
        await connection.query(`
            INSERT INTO transactions (id, user_id, type, amount, currency, status, reference_id, description)
            VALUES (?, ?, 'withdrawal', ?, 'USD', 'completed', ?, ?)
        `, [
            genUuid(),
            request.user_id,
            request.amount,
            transactionProof || `WTH-${id.substring(0, 8)}`,
            `Withdrawal payout approved via ${request.payment_method}`
        ]);

        await connection.commit();

        // Safely dispatch withdrawal-approved email notification
        emailService.sendToUser(request.user_id, 'withdrawal-approved', {
            amount: Number(request.amount).toFixed(2),
            currency: 'USD',
            payment_method: request.payment_method || 'Bank Transfer',
            transaction_proof: transactionProof || `WTH-${id.substring(0, 8)}`,
            date: new Date().toISOString().replace('T', ' ').substring(0, 19)
        }).catch(e => console.error('[approveWithdrawal] Email error:', e.message));

        res.json({ message: 'Withdrawal request approved successfully' });
    } catch (err) {
        await connection.rollback();
        console.error('[approveWithdrawal]', err);
        res.status(500).json({ error: 'Failed to approve withdrawal' });
    } finally {
        connection.release();
    }
};

exports.rejectWithdrawal = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [rows] = await connection.query('SELECT * FROM withdrawal_requests WHERE id = ? FOR UPDATE', [id]);
        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Withdrawal request not found' });
        }
        const request = rows[0];

        if (request.status !== 'pending') {
            await connection.rollback();
            return res.status(400).json({ error: 'This request is already processed' });
        }

        // Refund the amount to user's wallet available balance
        await connection.query(`
            UPDATE user_wallets
            SET balance = balance + ?
            WHERE user_id = ?
        `, [request.amount, request.user_id]);

        // Update withdrawal request
        await connection.query(`
            UPDATE withdrawal_requests
            SET status = 'rejected',
                admin_notes = ?,
                processed_by = ?,
                processed_at = NOW()
            WHERE id = ?
        `, [reason || 'Withdrawal rejected by administration', adminId, id]);

        // Record in transactions
        await connection.query(`
            INSERT INTO transactions (id, user_id, type, amount, currency, status, reference_id, description)
            VALUES (?, ?, 'bonus', ?, 'USD', 'completed', ?, ?)
        `, [
            genUuid(),
            request.user_id,
            request.amount,
            `REJ-${id.substring(0, 8)}`,
            `Refund for rejected withdrawal: ${reason || 'Details rejected'}`
        ]);

        await connection.commit();

        // Safely dispatch withdrawal-rejected email notification
        emailService.sendToUser(request.user_id, 'withdrawal-rejected', {
            amount: Number(request.amount).toFixed(2),
            currency: 'USD',
            reason: reason || 'البيانات البنكية غير مطابقة أو لم يتم اعتماد وسيلة التحويل',
            refunded_balance: Number(request.amount).toFixed(2),
            date: new Date().toISOString().replace('T', ' ').substring(0, 19)
        }).catch(e => console.error('[rejectWithdrawal] Email error:', e.message));

        res.json({ message: 'Withdrawal rejected and amount refunded to user wallet' });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('[rejectWithdrawal]', err);
        res.status(500).json({ error: 'Failed to reject withdrawal' });
    } finally {
        connection.release();
    }
};

/**
 * 3. DEPOSIT MANAGEMENT
 */
exports.getAdminDeposits = async (req, res) => {
    try {
        // 1. Package purchases / activation requests
        const [pkgDeposits] = await db.query(`
            SELECT 
                up.id,
                up.user_id,
                'package' AS category,
                up.package_id,
                up.amount_paid AS price_paid,
                up.payment_method,
                up.payment_reference,
                up.status,
                up.receipt_url,
                up.notes,
                up.purchased_at AS created_at,
                COALESCE(p.full_name, u.email) AS user_name,
                u.email AS user_email,
                p.avatar_url,
                pkg.name AS package_name,
                pkg.name_ar AS package_name_ar,
                pkg.level AS package_level
            FROM user_packages up
            JOIN users u ON up.user_id = u.id
            LEFT JOIN profiles p ON u.id = p.id
            JOIN packages pkg ON up.package_id = pkg.id
            ORDER BY up.purchased_at DESC
        `);

        // 2. Wallet deposit requests from transactions table
        const [walletDeposits] = await db.query(`
            SELECT 
                t.id,
                t.user_id,
                'wallet' AS category,
                NULL AS package_id,
                t.amount AS price_paid,
                t.currency,
                t.status,
                t.reference_id AS payment_reference,
                t.description,
                t.metadata,
                t.created_at,
                COALESCE(p.full_name, u.email) AS user_name,
                u.email AS user_email,
                p.avatar_url,
                'شحن رصيد المحفظة' AS package_name_ar,
                'Wallet Deposit' AS package_name,
                0 AS package_level
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN profiles p ON u.id = p.id
            WHERE t.type = 'deposit'
            ORDER BY t.created_at DESC
        `);

        // Format metadata
        const formattedWalletDeposits = walletDeposits.map(d => {
            const meta = typeof d.metadata === 'string' ? JSON.parse(d.metadata || '{}') : (d.metadata || {});
            return {
                ...d,
                payment_method: meta.paymentMethod || 'bank_transfer',
                payment_reference: d.payment_reference || meta.paymentReference || 'N/A',
                notes: meta.notes || '',
                receipt_url: meta.receiptUrl || null
            };
        });

        // Combine and sort by date descending
        const allDeposits = [...formattedWalletDeposits, ...pkgDeposits].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        res.json({ deposits: allDeposits });
    } catch (err) {
        console.error('[getAdminDeposits]', err);
        res.status(500).json({ error: 'Failed to fetch deposits' });
    }
};

exports.approveDeposit = async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Check if this is a pending package activation request
        const [pkgRows] = await connection.query('SELECT * FROM user_packages WHERE id = ? FOR UPDATE', [id]);
        if (pkgRows.length > 0) {
            const userPkg = pkgRows[0];
            if (userPkg.status === 'active') {
                await connection.rollback();
                return res.status(400).json({ error: 'تم تفعيل هذه الباقة مسبقاً' });
            }

            // Fetch package details
            const [targetPacks] = await connection.query('SELECT * FROM packages WHERE id = ?', [userPkg.package_id]);
            if (targetPacks.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'الباقة المحددة غير موجودة' });
            }
            const targetPackage = targetPacks[0];

            // Execute package activation (updates user_packages, enrolls courses, pays sponsor commissions)
            await packageController.processPackageActivation(connection, {
                userPackageId: userPkg.id,
                userId: userPkg.user_id,
                targetPackage,
                saleAmount: Number(userPkg.amount_paid),
                paymentMethod: userPkg.payment_method,
                paymentReference: userPkg.payment_reference
            });

            // Update matching pending transaction if present
            await connection.query(`
                UPDATE transactions 
                SET status = 'completed', description = CONCAT(COALESCE(description, ''), ' [تم التأكيد والتفعيل]')
                WHERE (reference_id = ? AND user_id = ?) OR (JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.userPackageId')) = ?)
            `, [userPkg.payment_reference, userPkg.user_id, userPkg.id]);

            await connection.commit();
            return res.json({ message: `تم تفعيل باقة (${targetPackage.name_ar || targetPackage.name}) للعضو وصرف العمولات بنجاح!` });
        }

        // 2. Check if this is a transaction record
        const [trxRows] = await connection.query('SELECT * FROM transactions WHERE id = ? FOR UPDATE', [id]);
        if (trxRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'طلب الإيداع أو الباقة غير موجود' });
        }
        const trx = trxRows[0];
        if (trx.status === 'completed') {
            await connection.rollback();
            return res.status(400).json({ error: 'تم تأكيد هذا الطلب مسبقاً' });
        }

        // 2a. If transaction is package_purchase, find and activate matching user_packages
        if (trx.type === 'package_purchase') {
            let meta = {};
            try {
                meta = typeof trx.metadata === 'string' ? JSON.parse(trx.metadata || '{}') : (trx.metadata || {});
            } catch (e) {}

            let userPkgId = meta.userPackageId;
            let userPkg = null;
            if (userPkgId) {
                const [rows] = await connection.query('SELECT * FROM user_packages WHERE id = ? FOR UPDATE', [userPkgId]);
                if (rows.length > 0) userPkg = rows[0];
            }
            if (!userPkg && trx.reference_id) {
                const [rows] = await connection.query('SELECT * FROM user_packages WHERE payment_reference = ? AND user_id = ? FOR UPDATE', [trx.reference_id, trx.user_id]);
                if (rows.length > 0) userPkg = rows[0];
            }
            if (!userPkg) {
                const [rows] = await connection.query('SELECT * FROM user_packages WHERE user_id = ? AND status = "pending" ORDER BY purchased_at DESC LIMIT 1 FOR UPDATE', [trx.user_id]);
                if (rows.length > 0) userPkg = rows[0];
            }

            if (userPkg) {
                const [targetPacks] = await connection.query('SELECT * FROM packages WHERE id = ?', [userPkg.package_id]);
                if (targetPacks.length === 0) {
                    await connection.rollback();
                    return res.status(404).json({ error: 'الباقة المحددة غير موجودة' });
                }
                const targetPackage = targetPacks[0];

                await packageController.processPackageActivation(connection, {
                    userPackageId: userPkg.id,
                    userId: userPkg.user_id,
                    targetPackage,
                    saleAmount: Number(userPkg.amount_paid),
                    paymentMethod: userPkg.payment_method,
                    paymentReference: userPkg.payment_reference
                });

                await connection.query(`
                    UPDATE transactions 
                    SET status = 'completed', description = CONCAT(COALESCE(description, ''), ' [تم التأكيد والتفعيل]')
                    WHERE id = ?
                `, [trx.id]);

                await connection.commit();
                return res.json({ message: `تم تفعيل باقة (${targetPackage.name_ar || targetPackage.name}) للعضو وصرف العمولات بنجاح!` });
            }
        }

        // 2b. Wallet deposit request
        let [wallets] = await connection.query('SELECT * FROM user_wallets WHERE user_id = ? FOR UPDATE', [trx.user_id]);
        if (wallets.length === 0) {
            const wId = genUuid();
            await connection.query(`
                INSERT INTO user_wallets (id, user_id, balance, pending_balance, total_earned, total_withdrawn)
                VALUES (?, ?, 0.00, 0.00, 0.00, 0.00)
            `, [wId, trx.user_id]);
            wallets = [{ id: wId, user_id: trx.user_id, balance: 0 }];
        }
        const currentBal = Number(wallets[0].balance);
        const depositAmount = Number(trx.amount);
        const newBal = Number((currentBal + depositAmount).toFixed(2));

        // Update wallet balance
        await connection.query('UPDATE user_wallets SET balance = balance + ? WHERE user_id = ?', [depositAmount, trx.user_id]);

        // Update transaction status
        await connection.query(`
            UPDATE transactions 
            SET status = 'completed', balance_before = ?, balance_after = ?, description = CONCAT(COALESCE(description, ''), ' [تم التأكيد]')
            WHERE id = ?
        `, [currentBal, newBal, id]);

        // Send notification to student
        const notifId = genUuid();
        await connection.query(`
            INSERT INTO notifications (id, user_id, title, content, type, is_read, created_at)
            VALUES (?, ?, 'تم تأكيد شحن المحفظة', ?, 'deposit', 0, CURRENT_TIMESTAMP)
        `, [notifId, trx.user_id, `تمت الموافقة على طلب إيداعك بقيمة $${depositAmount.toFixed(2)} USD وإضافته إلى رصيد محفظتك. رصيدك الحالي: $${newBal.toFixed(2)} USD.`]);

        await connection.commit();

        // Safely dispatch deposit-approved email notification
        emailService.sendToUser(trx.user_id, 'deposit-approved', {
            amount: depositAmount.toFixed(2),
            currency: 'USD',
            transaction_id: id,
            new_balance: newBal.toFixed(2),
            date: new Date().toISOString().replace('T', ' ').substring(0, 19)
        }).catch(e => console.error('[approveDeposit] Email error:', e.message));

        res.json({ message: 'تم تأكيد طلب الإيداع وشحن رصيد الطالب بنجاح', newBalance: newBal });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('[approveDeposit]', err);
        res.status(500).json({ error: err.message || 'فشل تأكيد طلب الإيداع أو الباقة' });
    } finally {
        connection.release();
    }
};

exports.rejectDeposit = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Check if user_packages
        const [pkgRows] = await connection.query('SELECT * FROM user_packages WHERE id = ? FOR UPDATE', [id]);
        if (pkgRows.length > 0) {
            const userPkg = pkgRows[0];
            await connection.query(`
                UPDATE user_packages 
                SET status = 'cancelled', notes = CONCAT(COALESCE(notes, ''), ' [تم الرفض: ', ?, ']')
                WHERE id = ?
            `, [reason || 'بيانات التحويل غير مطابقة أو الوصل غير واضح', id]);

            // Update matching pending transaction if present
            await connection.query(`
                UPDATE transactions 
                SET status = 'rejected', description = CONCAT(COALESCE(description, ''), ' [تم الرفض: ', ?, ']')
                WHERE (reference_id = ? AND user_id = ?) OR (JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.userPackageId')) = ?)
            `, [reason || 'بيانات التحويل غير مطابقة', userPkg.payment_reference, userPkg.user_id, userPkg.id]);

            // Send notification to student
            const notifId = genUuid();
            await connection.query(`
                INSERT INTO notifications (id, user_id, title, content, type, is_read, created_at)
                VALUES (?, ?, 'تم رفض طلب تفعيل الباقة', ?, 'package', 0, CURRENT_TIMESTAMP)
            `, [notifId, userPkg.user_id, `تم رفض طلب تفعيل الباقة الخاص بك. السبب: ${reason || 'بيانات التحويل غير مطابقة أو وصل الدفع غير واضح'}. يمكنك إعادة تقديم الطلب ببيانات صحيحة.`]);

            await connection.commit();

            // Safely dispatch package-rejected email notification
            emailService.sendToUser(userPkg.user_id, 'package-rejected', {
                package_name: 'الباقة المطلوبة',
                reason: reason || 'بيانات التحويل غير مطابقة أو وصل الدفع غير واضح',
                date: new Date().toISOString().replace('T', ' ').substring(0, 19)
            }).catch(e => console.error('[rejectDeposit:package] Email error:', e.message));

            return res.json({ message: 'تم رفض طلب تفعيل الباقة وإشعار العضو' });
        }

        // 2. Check transactions
        const [trxRows] = await connection.query('SELECT * FROM transactions WHERE id = ? FOR UPDATE', [id]);
        if (trxRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'طلب الإيداع أو الباقة غير موجود' });
        }
        const trx = trxRows[0];

        // 2a. If package purchase transaction, also reject user_package
        if (trx.type === 'package_purchase') {
            await connection.query(`
                UPDATE user_packages 
                SET status = 'cancelled', notes = CONCAT(COALESCE(notes, ''), ' [تم الرفض: ', ?, ']')
                WHERE (payment_reference = ? AND user_id = ?) OR (user_id = ? AND status = 'pending')
            `, [reason || 'بيانات التحويل غير مطابقة أو الوصل غير واضح', trx.reference_id, trx.user_id, trx.user_id]);
        }

        await connection.query(`
            UPDATE transactions 
            SET status = 'rejected', description = CONCAT(COALESCE(description, ''), ' [تم الرفض: ', ?, ']')
            WHERE id = ?
        `, [reason || 'بيانات التحويل غير مطابقة', id]);

        // Send notification to student
        const notifId = genUuid();
        await connection.query(`
            INSERT INTO notifications (id, user_id, title, content, type, is_read, created_at)
            VALUES (?, ?, 'تم رفض طلب الإيداع', ?, 'deposit', 0, CURRENT_TIMESTAMP)
        `, [notifId, trx.user_id, `تم رفض طلب إيداعك بقيمة $${Number(trx.amount).toFixed(2)} USD. السبب: ${reason || 'بيانات التحويل غير مطابقة أو الوصل غير واضح.'}`]);

        await connection.commit();

        // Safely dispatch deposit-rejected email notification
        emailService.sendToUser(trx.user_id, 'deposit-rejected', {
            amount: Number(trx.amount).toFixed(2),
            currency: 'USD',
            reason: reason || 'بيانات التحويل غير مطابقة أو الوصل غير واضح',
            transaction_id: id,
            date: new Date().toISOString().replace('T', ' ').substring(0, 19)
        }).catch(e => console.error('[rejectDeposit:deposit] Email error:', e.message));

        res.json({ message: 'تم رفض طلب الإيداع وإشعار الطالب' });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('[rejectDeposit]', err);
        res.status(500).json({ error: err.message || 'فشل رفض طلب الإيداع' });
    } finally {
        connection.release();
    }
};

/**
 * 4. TRANSACTIONS LEDGER
 */
exports.getAdminTransactions = async (req, res) => {
    const { search, type, limit = 50, offset = 0 } = req.query;

    try {
        let query = `
            SELECT 
                t.*,
                COALESCE(p.full_name, u.email) AS user_name,
                u.email AS user_email
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN profiles p ON u.id = p.id
            WHERE 1=1
        `;
        const params = [];

        if (type && type !== 'all') {
            query += ` AND t.type = ?`;
            params.push(type);
        }

        if (search) {
            query += ` AND (p.full_name LIKE ? OR u.email LIKE ? OR t.reference_id LIKE ?)`;
            const s = `%${search}%`;
            params.push(s, s, s);
        }

        query += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
        params.push(Number(limit), Number(offset));

        const [transactions] = await db.query(query, params);
        res.json({ transactions });
    } catch (err) {
        console.error('[getAdminTransactions]', err);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
};

/**
 * 5. TEAM TREE (FULL NETWORK RECURSIVE BUILDER)
 */
exports.getAdminTeamTree = async (req, res) => {
    try {
        const [users] = await db.query(`
            SELECT 
                u.id, 
                COALESCE(p.full_name, u.email) AS name, 
                u.email, 
                u.affiliate_code, 
                u.referrer_id, 
                u.created_at,
                u.kyc_status,
                p.avatar_url,
                p.phone,
                COALESCE(w.balance, 0) AS balance,
                COALESCE(w.total_earned, 0) AS total_earned,
                pkg.name_ar AS package_name,
                pkg.name AS package_name_en,
                pkg.level AS package_level,
                up.status AS package_status,
                r.name AS rank_name,
                r.name_ar AS rank_name_ar,
                r.color_hex AS rank_color
            FROM users u
            LEFT JOIN profiles p ON u.id = p.id
            LEFT JOIN user_wallets w ON u.id = w.user_id
            LEFT JOIN user_packages up ON (u.id = up.user_id AND up.is_current = 1 AND up.status = 'active')
            LEFT JOIN packages pkg ON up.package_id = pkg.id
            LEFT JOIN (
                SELECT la1.user_id, r1.name, r1.name_ar, r1.color_hex
                FROM leader_achievers la1
                JOIN ranks r1 ON la1.rank_id = r1.id
                WHERE la1.id IN (
                    SELECT MAX(id) FROM leader_achievers GROUP BY user_id
                )
            ) r ON u.id = r.user_id
            WHERE u.role = 'student'
            ORDER BY u.created_at ASC
        `);

        // Build tree lookup
        const userMap = {};
        const roots = [];

        users.forEach(u => {
            userMap[u.id] = { ...u, children: [] };
        });

        users.forEach(u => {
            if (u.referrer_id && userMap[u.referrer_id]) {
                userMap[u.referrer_id].children.push(userMap[u.id]);
            } else {
                roots.push(userMap[u.id]);
            }
        });

        // Compute direct count and total team count for every node
        function countDescendants(node) {
            let total = 0;
            node.directCount = node.children.length;
            node.children.forEach(child => {
                total += 1 + countDescendants(child);
            });
            node.teamCount = total;
            return total;
        }

        roots.forEach(root => countDescendants(root));

        res.json({ 
            tree: roots, 
            allUsers: users, 
            totalUsers: users.length 
        });
    } catch (err) {
        console.error('[getAdminTeamTree]', err);
        res.status(500).json({ error: 'Failed to build team tree' });
    }
};

/**
 * 6. KYC VERIFICATION
 */
exports.getAdminKyc = async (req, res) => {
    const { status } = req.query;
    try {
        let query = `
            SELECT 
                k.*,
                COALESCE(p.full_name, u.email) AS user_name,
                u.email AS user_email,
                u.affiliate_code
            FROM user_kyc k
            JOIN users u ON k.user_id = u.id
            LEFT JOIN profiles p ON u.id = p.id
        `;
        const params = [];
        if (status && status !== 'all') {
            query += ` WHERE k.status = ?`;
            params.push(status);
        }
        query += ` ORDER BY k.created_at DESC`;

        const [requests] = await db.query(query, params);
        res.json({ requests });
    } catch (err) {
        console.error('[getAdminKyc]', err);
        res.status(500).json({ error: 'Failed to fetch KYC requests' });
    }
};

exports.updateKycStatus = async (req, res) => {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const adminId = req.user.id;

    if (!['verified', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const [kyc] = await db.query('SELECT * FROM user_kyc WHERE id = ?', [id]);
        if (kyc.length === 0) return res.status(404).json({ error: 'KYC request not found' });

        await db.query(`
            UPDATE user_kyc
            SET status = ?,
                admin_notes = ?,
                reviewed_by = ?,
                reviewed_at = NOW()
            WHERE id = ?
        `, [status, adminNotes || null, adminId, id]);

        await db.query(`
            UPDATE users
            SET kyc_status = ?
            WHERE id = ?
        `, [status, kyc[0].user_id]);

        // Safely dispatch kyc-approved or kyc-rejected email notification
        const kycTemplateSlug = status === 'verified' ? 'kyc-approved' : 'kyc-rejected';
        emailService.sendToUser(kyc[0].user_id, kycTemplateSlug, {
            reason: adminNotes || 'المستندات المرفوعة غير واضحة أو غير مكتملة',
            dashboard_url: '/profile'
        }).catch(e => console.error('[updateKycStatus] Email error:', e.message));

        res.json({ message: `KYC request ${status === 'verified' ? 'approved' : 'rejected'} successfully` });
    } catch (err) {
        console.error('[updateKycStatus]', err);
        res.status(500).json({ error: 'Failed to update KYC status' });
    }
};

/**
 * 7. LEADER RANKS & ACHIEVERS
 */
exports.getAdminRanks = async (req, res) => {
    try {
        const [ranks] = await db.query(`
            SELECT r.*, 
                   req.name AS required_rank_name, 
                   req.name_ar AS required_rank_name_ar,
                   req.level AS required_rank_level,
                   (SELECT COUNT(*) FROM leader_achievers la WHERE la.rank_id = r.id) AS achievers_count
            FROM ranks r
            LEFT JOIN ranks req ON r.required_rank_id = req.id
            ORDER BY r.level ASC
        `);
        res.json({ ranks });
    } catch (err) {
        console.error('[getAdminRanks]', err);
        res.status(500).json({ error: 'Failed to fetch ranks' });
    }
};

exports.createAdminRank = async (req, res) => {
    const { 
        name, 
        name_ar, 
        level,
        tagline,
        tagline_ar,
        logo_url,
        badge_icon,
        min_direct_sales = 0,
        min_team_turnover = 0,
        required_rank_id = null,
        required_rank_count = 0,
        condition_operator = 'AND',
        reward_bonus = 0,
        reward_amount = 0,
        gift_name = null,
        gift_name_ar = null,
        gift_image_url = null,
        unlocked_generations = 2,
        color_hex = '#6366f1',
        is_active = 1
    } = req.body;

    if (!name || !name_ar) {
        return res.status(400).json({ error: 'Rank name in English and Arabic are required' });
    }

    try {
        // If level not provided, pick max(level) + 1
        let rankLevel = Number(level);
        if (isNaN(rankLevel) || rankLevel <= 0) {
            const [maxRow] = await db.query('SELECT MAX(level) AS max_lvl FROM ranks');
            rankLevel = (maxRow[0]?.max_lvl || 0) + 1;
        }

        // Check if level already taken
        const [existing] = await db.query('SELECT id FROM ranks WHERE level = ?', [rankLevel]);
        if (existing.length > 0) {
            return res.status(400).json({ error: `Rank level ${rankLevel} is already used. Please choose another level.` });
        }

        const id = genUuid();
        const bonusVal = reward_bonus !== undefined ? Number(reward_bonus) : (reward_amount !== undefined ? Number(reward_amount) : 0);
        const gensVal = Math.min(10, Math.max(0, parseInt(unlocked_generations, 10) || 0));

        await db.query(`
            INSERT INTO ranks (
                id, level, name, name_ar, tagline, tagline_ar, badge_icon, logo_url,
                min_direct_sales, min_team_turnover, required_rank_id, required_rank_count, condition_operator,
                reward_bonus, gift_name, gift_name_ar, gift_image_url, unlocked_generations, color_hex, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id, rankLevel, name, name_ar, tagline || null, tagline_ar || null, badge_icon || 'award', logo_url || null,
            Number(min_direct_sales) || 0, Number(min_team_turnover) || 0, required_rank_id || null, Number(required_rank_count) || 0, condition_operator || 'AND',
            bonusVal, gift_name || null, gift_name_ar || null, gift_image_url || null, gensVal, color_hex || '#6366f1', is_active ? 1 : 0
        ]);

        res.status(201).json({ message: 'Rank created successfully', rankId: id });
    } catch (err) {
        console.error('[createAdminRank]', err);
        res.status(500).json({ error: 'Failed to create rank' });
    }
};

exports.updateAdminRank = async (req, res) => {
    const { id } = req.params;
    const { 
        name, 
        name_ar, 
        level,
        tagline,
        tagline_ar,
        logo_url,
        badge_icon,
        min_direct_sales, 
        min_team_turnover, 
        required_rank_id,
        required_rank_count,
        condition_operator,
        reward_amount, 
        reward_bonus, 
        gift_name,
        gift_name_ar,
        gift_image_url,
        unlocked_generations, 
        color_hex, 
        is_active
    } = req.body;

    const bonusVal = reward_bonus !== undefined ? Number(reward_bonus) : (reward_amount !== undefined ? Number(reward_amount) : 0);
    const gensVal = unlocked_generations !== undefined ? Math.min(10, Math.max(0, parseInt(unlocked_generations, 10))) : 0;

    try {
        // Prevent setting required_rank_id to self (anti-loop)
        if (required_rank_id === id) {
            return res.status(400).json({ error: 'A rank cannot have itself as a required leadership rank' });
        }

        await db.query(`
            UPDATE ranks
            SET name = COALESCE(?, name),
                name_ar = COALESCE(?, name_ar),
                tagline = ?,
                tagline_ar = ?,
                logo_url = ?,
                badge_icon = COALESCE(?, badge_icon),
                min_direct_sales = COALESCE(?, min_direct_sales),
                min_team_turnover = COALESCE(?, min_team_turnover),
                required_rank_id = ?,
                required_rank_count = COALESCE(?, required_rank_count),
                condition_operator = COALESCE(?, condition_operator),
                reward_bonus = ?,
                gift_name = ?,
                gift_name_ar = ?,
                gift_image_url = ?,
                unlocked_generations = ?,
                color_hex = COALESCE(?, color_hex),
                is_active = COALESCE(?, is_active)
            WHERE id = ?
        `, [
            name, name_ar, tagline || null, tagline_ar || null, logo_url || null, badge_icon,
            min_direct_sales, min_team_turnover, required_rank_id || null, required_rank_count, condition_operator,
            bonusVal, gift_name || null, gift_name_ar || null, gift_image_url || null, gensVal, color_hex, is_active !== undefined ? (is_active ? 1 : 0) : 1, id
        ]);

        res.json({ message: 'Rank updated successfully' });
    } catch (err) {
        console.error('[updateAdminRank]', err);
        res.status(500).json({ error: 'Failed to update rank' });
    }
};

exports.deleteAdminRank = async (req, res) => {
    const { id } = req.params;
    try {
        // Check if any achiever exists for this rank
        const [achievers] = await db.query('SELECT COUNT(*) AS cnt FROM leader_achievers WHERE rank_id = ?', [id]);
        if (achievers[0]?.cnt > 0) {
            // Safe deactivation: do not break existing historical achievers!
            await db.query('UPDATE ranks SET is_active = 0 WHERE id = ?', [id]);
            return res.json({ message: 'Rank has existing achievers and was safely deactivated instead of deleted' });
        }

        // Check if any other rank depends on this rank
        const [deps] = await db.query('SELECT COUNT(*) AS cnt FROM ranks WHERE required_rank_id = ?', [id]);
        if (deps[0]?.cnt > 0) {
            await db.query('UPDATE ranks SET is_active = 0 WHERE id = ?', [id]);
            return res.json({ message: 'Rank is required by other ranks and was safely deactivated instead of deleted' });
        }

        await db.query('DELETE FROM ranks WHERE id = ?', [id]);
        res.json({ message: 'Rank deleted successfully' });
    } catch (err) {
        console.error('[deleteAdminRank]', err);
        res.status(500).json({ error: 'Failed to delete rank' });
    }
};

exports.getAdminRankAchievers = async (req, res) => {
    try {
        const [achievers] = await db.query(`
            SELECT 
                la.*,
                COALESCE(p.full_name, u.email) AS user_name,
                u.email AS user_email,
                u.affiliate_code,
                p.avatar_url,
                r.name AS rank_name_en,
                r.name_ar AS rank_name,
                r.color_hex AS rank_color,
                r.badge_icon AS rank_badge,
                r.logo_url AS rank_logo,
                r.level AS rank_level
            FROM leader_achievers la
            JOIN users u ON la.user_id = u.id
            LEFT JOIN profiles p ON u.id = p.id
            JOIN ranks r ON la.rank_id = r.id
            ORDER BY la.achieved_at DESC
        `);

        res.json({ achievers });
    } catch (err) {
        console.error('[getAdminRankAchievers]', err);
        res.status(500).json({ error: 'Failed to fetch rank achievers' });
    }
};

/**
 * 8. GENERATION SETTINGS
 */
exports.getGenerationSettings = async (req, res) => {
    try {
        const [settings] = await db.query(`
            SELECT \`key\`, value FROM platform_settings 
            WHERE \`key\` IN (
                'affiliate_direct_rate',
                'affiliate_gen1_rate', 
                'affiliate_gen2_rate', 
                'affiliate_gen3_rate', 
                'affiliate_gen4_rate', 
                'affiliate_gen5_rate',
                'affiliate_gen6_rate',
                'affiliate_gen7_rate',
                'affiliate_gen8_rate',
                'affiliate_gen9_rate',
                'affiliate_gen10_rate',
                'affiliate_calc_mode',
                'affiliate_registration_fee',
                'affiliate_registration_sponsor_bonus',
                'affiliate_require_pack_purchase',
                'affiliate_min_withdrawal'
            )
        `);

        const map = {};
        settings.forEach(s => {
            map[s.key] = s.value;
        });

        res.json({ settings: map });
    } catch (err) {
        console.error('[getGenerationSettings]', err);
        res.status(500).json({ error: 'Failed to fetch generation settings' });
    }
};

exports.updateGenerationSettings = async (req, res) => {
    const {
        directRate,
        gen1Rate,
        gen2Rate,
        gen3Rate,
        gen4Rate,
        gen5Rate,
        gen6Rate,
        gen7Rate,
        gen8Rate,
        gen9Rate,
        gen10Rate,
        calcMode,
        registrationFee,
        registrationSponsorBonus,
        requirePackPurchase,
        minWithdrawal
    } = req.body;

    const updates = [
        ['affiliate_direct_rate', String(directRate ?? 10)],
        ['affiliate_gen1_rate', String(gen1Rate ?? 5)],
        ['affiliate_gen2_rate', String(gen2Rate ?? 4)],
        ['affiliate_gen3_rate', String(gen3Rate ?? 3)],
        ['affiliate_gen4_rate', String(gen4Rate ?? 2)],
        ['affiliate_gen5_rate', String(gen5Rate ?? 1)],
        ['affiliate_gen6_rate', String(gen6Rate ?? 1)],
        ['affiliate_gen7_rate', String(gen7Rate ?? 1)],
        ['affiliate_gen8_rate', String(gen8Rate ?? 0.5)],
        ['affiliate_gen9_rate', String(gen9Rate ?? 0.5)],
        ['affiliate_gen10_rate', String(gen10Rate ?? 0.5)],
        ['affiliate_calc_mode', String(calcMode || 'matching_bonus')],
        ['affiliate_registration_fee', String(registrationFee ?? 30)],
        ['affiliate_registration_sponsor_bonus', String(registrationSponsorBonus ?? 15)],
        ['affiliate_require_pack_purchase', requirePackPurchase ? '1' : '0'],
        ['affiliate_min_withdrawal', String(minWithdrawal ?? 50)],
    ];

    try {
        for (const [key, val] of updates) {
            await db.query(`
                INSERT INTO platform_settings (id, \`key\`, \`value\`, type, category, updated_at)
                VALUES (?, ?, ?, 'number', 'affiliate', NOW())
                ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`), updated_at = NOW()
            `, [genUuid(), key, val]);
        }

        res.json({ message: 'Generation settings updated successfully' });
    } catch (err) {
        console.error('[updateGenerationSettings]', err);
        res.status(500).json({ error: 'Failed to update generation settings' });
    }
};
