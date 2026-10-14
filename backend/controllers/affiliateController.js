const db = require('../config/db');
const crypto = require('crypto');
const currencyService = require('../services/currencyService');
const nowpaymentsService = require('../services/nowpaymentsService');
const emailService = require('../services/emailService');

function genUuid() {
    return crypto.randomUUID();
}

/**
 * Helper to compute effective unlocked generations for a user.
 * Formula: Math.max(packageUnlockedGenerations, rankUnlockedGenerations)
 */
async function getUserEffectiveUnlockedGenerations(userId, conn) {
    // 1. Package unlocked generations
    const [packRows] = await conn.query(`
        SELECT p.unlocked_generations, p.price, p.name, p.name_ar, p.level
        FROM user_packages up
        JOIN packages p ON up.package_id = p.id
        WHERE up.user_id = ? AND up.status = 'active'
        ORDER BY p.level DESC
        LIMIT 1
    `, [userId]);
    const pkg = packRows[0] || null;
    const packageUnlocked = pkg ? Number(pkg.unlocked_generations || 0) : 0;

    // 2. Rank qualification
    const [ranks] = await conn.query('SELECT * FROM ranks ORDER BY level DESC');

    const [salesRow] = await conn.query(`
        SELECT COUNT(DISTINCT up.id) AS direct_sales
        FROM users u
        JOIN user_packages up ON u.id = up.user_id
        WHERE u.referrer_id = ? AND up.status = 'active'
    `, [userId]);
    const directSales = Number(salesRow[0]?.direct_sales || 0);

    const [turnoverRow] = await conn.query(`
        SELECT SUM(sale_amount) AS turnover
        FROM commissions
        WHERE recipient_id = ?
    `, [userId]);
    const teamTurnover = Number(turnoverRow[0]?.turnover || 0);

    let rankUnlocked = 0;
    let qualifiedRank = ranks.find(r => r.level === 0) || null;

    for (const r of ranks) {
        if (directSales >= r.min_direct_sales && teamTurnover >= Number(r.min_team_turnover)) {
            qualifiedRank = r;
            rankUnlocked = Number(r.unlocked_generations || 0);
            break;
        }
    }

    const effective = Math.max(packageUnlocked, rankUnlocked);
    return {
        effective,
        packageUnlocked,
        rankUnlocked,
        package: pkg,
        rank: qualifiedRank,
        directSales,
        teamTurnover
    };
}

/**
 * Get user wallet stats and overview
 */
exports.getWallet = async (req, res) => {
    const userId = req.user.id;

    try {
        // Verify user exists first
        const [userCheck] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
        if (userCheck.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Fetch or create wallet
        let [wallets] = await db.query('SELECT * FROM user_wallets WHERE user_id = ?', [userId]);
        if (wallets.length === 0) {
            const newId = genUuid();
            await db.query(`
                INSERT INTO user_wallets (id, user_id, balance, pending_balance, total_earned, total_withdrawn)
                VALUES (?, ?, 0.00, 0.00, 0.00, 0.00)
            `, [newId, userId]);
            wallets = [{ id: newId, user_id: userId, balance: '0.00', pending_balance: '0.00', total_earned: '0.00', total_withdrawn: '0.00' }];
        }
        const wallet = wallets[0];

        // Get recent commissions
        const [recentCommissions] = await db.query(`
            SELECT c.*, p.name AS package_name, p.name_ar AS package_name_ar,
                   u.email AS source_user_email, pr.full_name AS source_user_name
            FROM commissions c
            JOIN packages p ON c.package_id = p.id
            JOIN users u ON c.source_user_id = u.id
            LEFT JOIN profiles pr ON u.id = pr.id
            WHERE c.recipient_id = ?
            ORDER BY c.created_at DESC
            LIMIT 10
        `, [userId]);

        // Get affiliate settings (min withdrawal)
        const [minWithdrawalRow] = await db.query("SELECT value FROM platform_settings WHERE `key` = 'affiliate_min_withdrawal'");
        const minWithdrawal = Number(minWithdrawalRow[0]?.value || 50);

        res.json({
            wallet: {
                balance: Number(wallet.balance),
                pendingBalance: Number(wallet.pending_balance),
                totalEarned: Number(wallet.total_earned),
                totalWithdrawn: Number(wallet.total_withdrawn),
            },
            minWithdrawal,
            recentCommissions
        });
    } catch (err) {
        console.error('[getWallet]', err);
        res.status(500).json({ error: 'Failed to fetch wallet info' });
    }
};

/**
 * Get full commission history
 */
exports.getCommissionsHistory = async (req, res) => {
    const userId = req.user.id;
    const { generation, limit = 50, offset = 0 } = req.query;

    try {
        let query = `
            SELECT c.*, p.name AS package_name, p.name_ar AS package_name_ar,
                   u.email AS source_user_email, pr.full_name AS source_user_name
            FROM commissions c
            JOIN packages p ON c.package_id = p.id
            JOIN users u ON c.source_user_id = u.id
            LEFT JOIN profiles pr ON u.id = pr.id
            WHERE c.recipient_id = ?
        `;
        const params = [userId];

        if (generation) {
            query += ' AND c.generation_level = ?';
            params.push(generation);
        }

        query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
        params.push(Number(limit), Number(offset));

        const [commissions] = await db.query(query, params);
        res.json({ commissions });
    } catch (err) {
        console.error('[getCommissionsHistory]', err);
        res.status(500).json({ error: 'Failed to fetch commissions history' });
    }
};

/**
 * Submit withdrawal request
 */
exports.requestWithdrawal = async (req, res) => {
    const userId = req.user.id;
    const { amount, paymentMethod, paymentDetails, payment_method, payment_details } = req.body || {};
    const method = paymentMethod || payment_method;
    const details = paymentDetails || payment_details;

    const withdrawAmount = Number(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
        return res.status(400).json({ error: 'Please enter a valid amount' });
    }

    if (!method || !details) {
        return res.status(400).json({ error: 'Payment method and details are required' });
    }

    // Strict security check: DZ users or countries with USDT disabled cannot withdraw via crypto or USDT
    const countryCode = await currencyService.detectUserCountry(req);
    const countryRule = await currencyService.getRuleForCountry(countryCode);
    const isCrypto = (method || '').toLowerCase().includes('usdt') || 
                     (method || '').toLowerCase().includes('crypto') || 
                     (method || '').toLowerCase().includes('nowpayments') ||
                     (details || '').toLowerCase().includes('usdt');
    if ((countryCode === 'DZ' || !countryRule.usdt_enabled) && isCrypto) {
        return res.status(403).json({ error: 'معاملات USDT والعملات المشفرة غير متاحة في بلدك أو تم حظرها بقرار تنظيمي' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Idempotency & duplicate submission guard: throttle rapid requests within 10 seconds
        const [recentDup] = await connection.query(
            "SELECT id FROM withdrawal_requests WHERE user_id = ? AND status = 'pending' AND created_at > NOW() - INTERVAL 10 SECOND",
            [userId]
        );
        if (recentDup.length > 0) {
            await connection.rollback();
            return res.status(409).json({ error: 'طلب سحب مماثل قيد المعالجة حالياً. يرجى الانتظار / A matching withdrawal request is already pending.' });
        }

        // Check min withdrawal threshold
        const [minWithdrawRow] = await connection.query("SELECT value FROM platform_settings WHERE platform_settings.key = 'affiliate_min_withdrawal'");
        const minWithdrawal = Number(minWithdrawRow[0]?.value || 50);

        if (withdrawAmount < minWithdrawal) {
            await connection.rollback();
            return res.status(400).json({ error: `Minimum withdrawal amount is $${minWithdrawal}` });
        }

        // Check wallet balance with row lock
        const [wallets] = await connection.query('SELECT * FROM user_wallets WHERE user_id = ? FOR UPDATE', [userId]);
        if (wallets.length === 0 || Number(wallets[0].balance) < withdrawAmount) {
            await connection.rollback();
            return res.status(400).json({ error: 'Insufficient available balance', code: 'INSUFFICIENT_BALANCE' });
        }

        // Deduct from available balance (total_withdrawn is only incremented when approved)
        await connection.query(`
            UPDATE user_wallets
            SET balance = balance - ?
            WHERE user_id = ?
        `, [withdrawAmount, userId]);

        // Insert withdrawal request
        const withdrawalId = genUuid();
        await connection.query(`
            INSERT INTO withdrawal_requests (id, user_id, amount, payment_method, payment_details, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
        `, [withdrawalId, userId, withdrawAmount, method, details]);

        await connection.commit();

        // Safely dispatch withdrawal-requested email notification
        emailService.sendToUser(userId, 'withdrawal-requested', {
            amount: withdrawAmount.toFixed(2),
            currency: 'USD',
            payment_method: method,
            withdrawal_id: withdrawalId,
            date: new Date().toISOString().replace('T', ' ').substring(0, 19)
        }).catch(e => console.error('[requestWithdrawal] Email error:', e.message));

        res.status(201).json({
            message: 'Withdrawal request submitted successfully. It will be reviewed by administration.',
            withdrawalId
        });
    } catch (err) {
        await connection.rollback();
        console.error('[requestWithdrawal]', err);
        res.status(500).json({ error: 'Failed to submit withdrawal request' });
    } finally {
        connection.release();
    }
};

/**
 * Get user withdrawal requests history
 */
exports.getMyWithdrawals = async (req, res) => {
    const userId = req.user.id;
    try {
        const [withdrawals] = await db.query(`
            SELECT * FROM withdrawal_requests
            WHERE user_id = ?
            ORDER BY created_at DESC
        `, [userId]);
        res.json({ withdrawals });
    } catch (err) {
        console.error('[getMyWithdrawals]', err);
        res.status(500).json({ error: 'Failed to fetch withdrawal history' });
    }
};

/**
 * Get / update user saved payout settings
 */
exports.getPayoutSettings = async (req, res) => {
    const userId = req.user.id;
    try {
        const [settings] = await db.query('SELECT * FROM user_payout_settings WHERE user_id = ?', [userId]);
        res.json({ payoutSettings: settings[0] || {} });
    } catch (err) {
        console.error('[getPayoutSettings]', err);
        res.status(500).json({ error: 'Failed to fetch payout settings' });
    }
};

exports.updatePayoutSettings = async (req, res) => {
    const userId = req.user.id;
    const { bankName, accountHolder, iban, swiftCode, paypalEmail, payoneerEmail, stripeAccount } = req.body;

    try {
        await db.query(`
            INSERT INTO user_payout_settings (id, user_id, bank_name, account_holder, iban, swift_code, paypal_email, payoneer_email, stripe_account)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                bank_name = VALUES(bank_name),
                account_holder = VALUES(account_holder),
                iban = VALUES(iban),
                swift_code = VALUES(swift_code),
                paypal_email = VALUES(paypal_email),
                payoneer_email = VALUES(payoneer_email),
                stripe_account = VALUES(stripe_account)
        `, [genUuid(), userId, bankName || null, accountHolder || null, iban || null, swiftCode || null, paypalEmail || null, payoneerEmail || null, stripeAccount || null]);

        res.json({ message: 'Payout settings saved successfully' });
    } catch (err) {
        console.error('[updatePayoutSettings]', err);
        res.status(500).json({ error: 'Failed to update payout settings' });
    }
};

/**
 * Get 5-Generation Team Network Tree & Stats
 */
exports.getMyTeamNetwork = async (req, res) => {
    const userId = req.user.id;

    try {
        // Get user affiliate info
        const [userRow] = await db.query('SELECT id, affiliate_code, affiliate_status, affiliate_enabled FROM users WHERE id = ?', [userId]);
        const user = userRow[0];
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // 10 Generations Traversal
        const generations = {
            1: { count: 0, sales: 0, commissions: 0, members: [] },
            2: { count: 0, sales: 0, commissions: 0, members: [] },
            3: { count: 0, sales: 0, commissions: 0, members: [] },
            4: { count: 0, sales: 0, commissions: 0, members: [] },
            5: { count: 0, sales: 0, commissions: 0, members: [] },
            6: { count: 0, sales: 0, commissions: 0, members: [] },
            7: { count: 0, sales: 0, commissions: 0, members: [] },
            8: { count: 0, sales: 0, commissions: 0, members: [] },
            9: { count: 0, sales: 0, commissions: 0, members: [] },
            10: { count: 0, sales: 0, commissions: 0, members: [] },
        };

        // Level 1: direct referrals
        const [gen1Members] = await db.query(`
            SELECT u.id, u.email, u.created_at, pr.full_name, pr.avatar_url,
                   (SELECT p.name_ar FROM user_packages up JOIN packages p ON up.package_id = p.id WHERE up.user_id = u.id AND up.status = 'active' LIMIT 1) AS active_package_name
            FROM users u
            LEFT JOIN profiles pr ON u.id = pr.id
            WHERE u.referrer_id = ?
            ORDER BY u.created_at DESC
        `, [userId]);

        generations[1].count = gen1Members.length;
        generations[1].members = gen1Members;

        let currentLevelIds = gen1Members.map(m => m.id);

        for (let level = 2; level <= 10; level++) {
            if (currentLevelIds.length === 0) break;

            const placeholders = currentLevelIds.map(() => '?').join(',');
            const [nextLevelMembers] = await db.query(`
                SELECT u.id, u.email, u.created_at, pr.full_name, pr.avatar_url,
                       (SELECT p.name_ar FROM user_packages up JOIN packages p ON up.package_id = p.id WHERE up.user_id = u.id AND up.status = 'active' LIMIT 1) AS active_package_name
                FROM users u
                LEFT JOIN profiles pr ON u.id = pr.id
                WHERE u.referrer_id IN (${placeholders})
                ORDER BY u.created_at DESC
            `, currentLevelIds);

            generations[level].count = nextLevelMembers.length;
            generations[level].members = nextLevelMembers;
            currentLevelIds = nextLevelMembers.map(m => m.id);
        }

        // Get commissions breakdown per generation
        const [commStats] = await db.query(`
            SELECT generation_level, 
                   COUNT(*) AS transactions_count, 
                   SUM(sale_amount) AS total_sales, 
                   SUM(commission_amount) AS total_commission
            FROM commissions
            WHERE recipient_id = ?
            GROUP BY generation_level
        `, [userId]);

        commStats.forEach(stat => {
            if (generations[stat.generation_level]) {
                generations[stat.generation_level].sales = Number(stat.total_sales || 0);
                generations[stat.generation_level].commissions = Number(stat.total_commission || 0);
            }
        });

        // Totals across all 10 generations
        const totalTeamMembers = Object.values(generations).reduce((acc, g) => acc + g.count, 0);
        const totalTeamSales = Object.values(generations).reduce((acc, g) => acc + g.sales, 0);
        const totalTeamCommissions = Object.values(generations).reduce((acc, g) => acc + g.commissions, 0);

        // Get student's current active package, rank, and effective unlocked generations
        const { effective: effectiveUnlocked, packageUnlocked, rankUnlocked, package: currentPackage, rank: currentRank } = await getUserEffectiveUnlockedGenerations(userId, db);

        res.json({
            affiliateCode: user.affiliate_code,
            affiliateStatus: user.affiliate_status,
            currentPackage,
            currentRank,
            packageUnlockedGenerations: packageUnlocked,
            rankUnlockedGenerations: rankUnlocked,
            unlockedGenerations: effectiveUnlocked,
            generations,
            totals: {
                totalTeamMembers,
                totalTeamSales,
                totalTeamCommissions,
                directReferralsCount: generations[1].count
            }
        });
    } catch (err) {
        console.error('[getMyTeamNetwork]', err);
        res.status(500).json({ error: 'Failed to fetch team network' });
    }
};

/**
 * Get Ranks and student progress
 */
exports.getRanksAndProgress = async (req, res) => {
    const userId = req.user.id;

    try {
        const [ranks] = await db.query('SELECT * FROM ranks ORDER BY level ASC');

        // Calculate student's direct sales & total team turnover
        const [directSalesCountRow] = await db.query(`
            SELECT COUNT(DISTINCT up.id) AS direct_sales
            FROM users u
            JOIN user_packages up ON u.id = up.user_id
            WHERE u.referrer_id = ? AND up.status = 'active'
        `, [userId]);
        const directSales = Number(directSalesCountRow[0]?.direct_sales || 0);

        const [teamTurnoverRow] = await db.query(`
            SELECT SUM(sale_amount) AS turnover
            FROM commissions
            WHERE recipient_id = ?
        `, [userId]);
        const teamTurnover = Number(teamTurnoverRow[0]?.turnover || 0);

        // Find current rank (highest level where both conditions are met)
        let currentRank = ranks[0];
        let nextRank = ranks[1] || null;

        for (let i = 0; i < ranks.length; i++) {
            const r = ranks[i];
            if (directSales >= r.min_direct_sales && teamTurnover >= Number(r.min_team_turnover)) {
                currentRank = r;
                nextRank = ranks[i + 1] || null;
            }
        }

        res.json({
            ranks,
            userStats: {
                directSales,
                teamTurnover,
                currentRank,
                nextRank
            }
        });
    } catch (err) {
        console.error('[getRanksAndProgress]', err);
        res.status(500).json({ error: 'Failed to fetch ranks' });
    }
};

/**
 * Submit a wallet deposit request
 */
exports.requestDeposit = async (req, res) => {
    const userId = req.user.id;
    const { amount, paymentMethod = 'bank_transfer', paymentReference = '', notes = '', receiptUrl = '', payCurrency } = req.body;

    const depositAmount = Number(amount);
    if (!depositAmount || depositAmount <= 0) {
        return res.status(400).json({ error: 'يرجى إدخال مبلغ إيداع صحيح أكبر من 0' });
    }

    // Strict security check: DZ users or countries with USDT disabled cannot deposit via crypto or USDT
    const countryCode = await currencyService.detectUserCountry(req);
    const countryRule = await currencyService.getRuleForCountry(countryCode);
    const isCrypto = (paymentMethod || '').toLowerCase().includes('usdt') || 
                     (paymentMethod || '').toLowerCase().includes('crypto') || 
                     (paymentMethod || '').toLowerCase().includes('nowpayments') ||
                     (paymentReference || '').toLowerCase().includes('usdt');
    if ((countryCode === 'DZ' || !countryRule.usdt_enabled) && isCrypto) {
        return res.status(403).json({ error: 'إيداعات USDT والعملات المشفرة غير متاحة في بلدك أو تم حظرها بقرار تنظيمي' });
    }

    const isNowPayments = (paymentMethod || '').toLowerCase().includes('nowpayments');

    // For manual bank transfers and offline deposits: transaction reference and receipt proof image are MANDATORY
    if (!isNowPayments) {
        if (!paymentReference || !paymentReference.toString().trim()) {
            return res.status(400).json({ error: 'يرجى إدخال رقم المعاملة أو الرقم المرجعي للتحويل البنكي (Transaction Reference / TxID)' });
        }
        if (!receiptUrl || !receiptUrl.toString().trim()) {
            return res.status(400).json({ error: 'يرجى رفع صورة وصل التحويل البنكي لإتمام طلب الإيداع' });
        }
    }

    // Pre-flight check for NOWPayments limits if crypto method selected
    let nowPaymentsConfig = null;
    if (isNowPayments) {
        try {
            nowPaymentsConfig = await nowpaymentsService.getConfig();
            if (depositAmount < nowPaymentsConfig.minDeposit) {
                return res.status(400).json({ error: `الحد الأدنى للإيداع عبر NOWPayments هو $${nowPaymentsConfig.minDeposit} USD` });
            }
            if (depositAmount > nowPaymentsConfig.maxDeposit) {
                return res.status(400).json({ error: `الحد الأقصى للإيداع عبر NOWPayments هو $${nowPaymentsConfig.maxDeposit} USD` });
            }
        } catch (cfgErr) {
            return res.status(500).json({ error: cfgErr.message || 'فشل تحميل إعدادات بوابة NOWPayments' });
        }
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Fetch or create wallet
        let [wallets] = await connection.query('SELECT * FROM user_wallets WHERE user_id = ? FOR UPDATE', [userId]);
        if (wallets.length === 0) {
            const wId = genUuid();
            await connection.query(`
                INSERT INTO user_wallets (id, user_id, balance, pending_balance, total_earned, total_withdrawn)
                VALUES (?, ?, 0.00, 0.00, 0.00, 0.00)
            `, [wId, userId]);
            wallets = [{ id: wId, user_id: userId, balance: 0 }];
        }
        const currentBal = Number(wallets[0].balance);

        const trxId = genUuid();
        const refId = isNowPayments ? `NP-DEP-${trxId.substring(0, 8).toUpperCase()}` : (paymentReference || `DEP-${Date.now()}`);
        
        let initialPayment = null;
        let attemptId = null;
        let nextRenewalTime = null;

        if (isNowPayments) {
            // 1. Call official NOWPayments API to create payment
            try {
                initialPayment = await nowpaymentsService.createPayment({
                    priceAmount: depositAmount,
                    priceCurrency: 'USD',
                    payCurrency: payCurrency || nowPaymentsConfig?.defaultPayCurrency || 'usdtbsc',
                    orderId: trxId,
                    orderDescription: `Nexyvora Deposit #${trxId} ($${depositAmount} USD)`
                });
            } catch (apiErr) {
                await connection.rollback();
                console.error('[requestDeposit:NowPayments] API Error:', apiErr.message);
                return res.status(502).json({
                    error: 'فشل الاتصال ببوابة NOWPayments لإنشاء عنوان الدفع. يرجى المحاولة لاحقاً.',
                    details: apiErr.message
                });
            }

            attemptId = genUuid();
            nextRenewalTime = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes from now
        }

        const metadata = {
            paymentMethod,
            paymentReference: refId,
            notes,
            receiptUrl,
            requestedAt: new Date().toISOString(),
            ...(isNowPayments ? {
                active_attempt_id: attemptId,
                active_attempt_number: 1,
                active_payment_id: initialPayment.paymentId,
                active_pay_address: initialPayment.payAddress,
                active_pay_amount: initialPayment.payAmount,
                active_pay_currency: initialPayment.payCurrency,
                active_network: initialPayment.network,
                next_renewal_at: nextRenewalTime.toISOString()
            } : {})
        };

        // 2. Persist parent deposit transaction
        await connection.query(`
            INSERT INTO transactions (id, user_id, type, amount, currency, balance_before, balance_after, status, reference_id, description, metadata)
            VALUES (?, ?, 'deposit', ?, 'USD', ?, ?, 'pending', ?, ?, ?)
        `, [
            trxId,
            userId,
            depositAmount,
            currentBal,
            currentBal,
            refId,
            isNowPayments ? `طلب إيداع عبر NOWPayments (${initialPayment.payCurrency})` : `طلب إيداع في المحفظة عبر ${paymentMethod}`,
            JSON.stringify(metadata)
        ]);

        // 3. Persist initial payment attempt if NOWPayments
        if (isNowPayments && initialPayment) {
            await connection.query(`
                INSERT INTO payment_attempts (
                    id, transaction_id, user_id, provider, provider_payment_id, provider_order_id,
                    attempt_number, pay_address, pay_amount, pay_currency, price_amount, price_currency,
                    network, status, is_wallet_credited, next_renewal_at, metadata
                ) VALUES (?, ?, ?, 'nowpayments', ?, ?, 1, ?, ?, ?, ?, ?, ?, 'waiting', 0, ?, ?)
            `, [
                attemptId,
                trxId,
                userId,
                initialPayment.paymentId,
                trxId,
                initialPayment.payAddress,
                initialPayment.payAmount,
                initialPayment.payCurrency,
                initialPayment.priceAmount,
                initialPayment.priceCurrency,
                initialPayment.network || 'bsc',
                nextRenewalTime,
                JSON.stringify({
                    created_at: new Date().toISOString(),
                    rawResponse: initialPayment.raw
                })
            ]);
        }

        // Create notification for admin
        const notifId = genUuid();
        await connection.query(`
            INSERT INTO notifications (id, user_id, title, content, type, is_read, created_at)
            SELECT ?, id, 'طلب إيداع رصيد جديد', ?, 'deposit', 0, CURRENT_TIMESTAMP
            FROM users WHERE role = 'admin' LIMIT 1
        `, [notifId, `قام الطالب بتقديم طلب إيداع محفظة بقيمة $${depositAmount} USD عبر ${paymentMethod}.`]);

        await connection.commit();

        res.status(201).json({
            message: isNowPayments ? 'تم إنشاء طلب الدفع بنجاح عبر NOWPayments' : 'تم تقديم طلب الإيداع بنجاح! سيتم مراجعته وتأكيد شحن رصيدك.',
            transactionId: trxId,
            referenceId: refId,
            ...(isNowPayments ? {
                payment: {
                    attemptId,
                    attemptNumber: 1,
                    paymentId: initialPayment.paymentId,
                    payAddress: initialPayment.payAddress,
                    payAmount: initialPayment.payAmount,
                    payCurrency: initialPayment.payCurrency,
                    priceAmount: initialPayment.priceAmount,
                    priceCurrency: initialPayment.priceCurrency,
                    network: initialPayment.network,
                    status: initialPayment.paymentStatus,
                    nextRenewalAt: nextRenewalTime.toISOString(),
                    expirationEstimateDate: initialPayment.expirationEstimateDate
                }
            } : {})
        });
    } catch (err) {
        await connection.rollback();
        console.error('[requestDeposit]', err);
        res.status(500).json({ error: 'فشل تقديم طلب الإيداع' });
    } finally {
        connection.release();
    }
};

/**
 * Get current user's wallet deposit requests history with payment attempts
 */
exports.getMyDeposits = async (req, res) => {
    const userId = req.user.id;
    try {
        const [deposits] = await db.query(`
            SELECT * FROM transactions
            WHERE user_id = ? AND type = 'deposit'
            ORDER BY created_at DESC
        `, [userId]);

        const [attempts] = await db.query(`
            SELECT * FROM payment_attempts
            WHERE user_id = ?
            ORDER BY attempt_number ASC
        `, [userId]);

        const attemptsByTrx = {};
        for (const att of attempts) {
            if (!attemptsByTrx[att.transaction_id]) attemptsByTrx[att.transaction_id] = [];
            attemptsByTrx[att.transaction_id].push(att);
        }

        const formatted = deposits.map(d => {
            const meta = typeof d.metadata === 'string' ? JSON.parse(d.metadata || '{}') : (d.metadata || {});
            const trxAttempts = attemptsByTrx[d.id] || [];
            const activeAttempt = trxAttempts.length > 0 ? trxAttempts[trxAttempts.length - 1] : null;
            return {
                ...d,
                metadata: meta,
                attempts: trxAttempts,
                activeAttempt
            };
        });

        res.json({ deposits: formatted });
    } catch (err) {
        console.error('[getMyDeposits]', err);
        res.status(500).json({ error: 'Failed to fetch deposits' });
    }
};

/**
 * Get all payment attempts for a specific deposit session (Member or Admin)
 */
exports.getDepositAttempts = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    try {
        const [trxRows] = await db.query('SELECT * FROM transactions WHERE id = ?', [id]);
        if (trxRows.length === 0) {
            return res.status(404).json({ error: 'Deposit transaction not found' });
        }

        const trx = trxRows[0];
        if (!isAdmin && trx.user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized to view this deposit session' });
        }

        const [attempts] = await db.query(
            'SELECT * FROM payment_attempts WHERE transaction_id = ? ORDER BY attempt_number ASC',
            [id]
        );

        res.json({
            transaction: {
                ...trx,
                metadata: typeof trx.metadata === 'string' ? JSON.parse(trx.metadata || '{}') : (trx.metadata || {})
            },
            attempts
        });
    } catch (err) {
        console.error('[getDepositAttempts]', err);
        res.status(500).json({ error: 'Failed to fetch deposit attempts' });
    }
};

/**
 * Get platform payment account info for deposit instructions
 */
exports.getPlatformPaymentMethods = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT value FROM platform_settings WHERE `key` = 'payment_account_settings' LIMIT 1");
        let settings = null;
        if (rows.length > 0 && rows[0].value) {
            settings = typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : rows[0].value;
        }
        res.json({ paymentAccounts: settings });
    } catch (err) {
        console.error('[getPlatformPaymentMethods]', err);
        res.status(500).json({ error: 'Failed to fetch payment methods' });
    }
};

/**
 * Get Team Tree for current user (Downline tree starting at current user)
 */
exports.getUserTeamTree = async (req, res) => {
    const userId = req.user.id;
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
                pkg.name_ar AS package_name,
                pkg.name AS package_name_en,
                pkg.level AS package_level,
                up.status AS package_status,
                r.name AS rank_name,
                r.name_ar AS rank_name_ar,
                r.color_hex AS rank_color
            FROM users u
            LEFT JOIN profiles p ON u.id = p.id
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
            WHERE u.role = 'student' OR u.id = ?
            ORDER BY u.created_at ASC
        `, [userId]);

        // Build adjacency map
        const userMap = {};
        users.forEach(u => {
            userMap[u.id] = { ...u, children: [] };
        });

        // Ensure current user is in map
        if (!userMap[userId]) {
            const [meRow] = await db.query(`
                SELECT u.id, COALESCE(p.full_name, u.email) as name, u.email, u.affiliate_code, u.referrer_id, u.created_at, u.kyc_status, p.avatar_url, p.phone
                FROM users u
                LEFT JOIN profiles p ON u.id = p.id
                WHERE u.id = ?
            `, [userId]);
            if (meRow[0]) {
                userMap[userId] = { ...meRow[0], children: [] };
            } else {
                return res.status(404).json({ error: 'User not found' });
            }
        }

        // Link parent-child
        users.forEach(u => {
            if (u.referrer_id && userMap[u.referrer_id]) {
                userMap[u.referrer_id].children.push(userMap[u.id]);
            }
        });

        // Compute direct count and total team count recursively
        function countDescendants(node) {
            let total = 0;
            node.directCount = node.children.length;
            node.children.forEach(child => {
                total += 1 + countDescendants(child);
            });
            node.teamCount = total;
            return total;
        }

        const userRoot = userMap[userId];
        countDescendants(userRoot);

        // Collect all downline users that belong to this user's tree
        const downlineUsers = [];
        function collectAll(node) {
            downlineUsers.push(node);
            node.children.forEach(collectAll);
        }
        collectAll(userRoot);

        res.json({
            tree: [userRoot],
            allUsers: downlineUsers,
            totalUsers: downlineUsers.length
        });
    } catch (err) {
        console.error('[getUserTeamTree]', err);
        res.status(500).json({ error: 'Failed to build user team tree' });
    }
};


