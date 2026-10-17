const db = require('../config/db');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const nowpaymentsService = require('../services/nowpaymentsService');
const rankService = require('../services/rankService');

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

    // 2. Rank qualification (calculated dynamically through rank engine)
    let rankUnlocked = 0;
    let qualifiedRank = null;
    let directSales = 0;
    let teamTurnover = 0;

    try {
        const evalRes = await rankService.evaluateUserRankAndProgress(userId, conn, false);
        qualifiedRank = evalRes.userStats.currentRank;
        rankUnlocked = Number(qualifiedRank?.unlocked_generations || 0);
        directSales = evalRes.userStats.directSales;
        teamTurnover = evalRes.userStats.teamTurnover;
    } catch (e) {
        console.error('[packageController.getUserEffectiveUnlockedGenerations.rankError]', e);
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
 * Get all available active packages
 */
exports.getAllPackages = async (req, res) => {
    try {
        const [packages] = await db.query(`
            SELECT p.*, 
                   (SELECT COUNT(*) FROM package_courses pc WHERE pc.package_id = p.id) AS course_count
            FROM packages p
            WHERE p.is_active = 1
            ORDER BY p.level ASC
        `);

        // Parse features JSON if string
        const formatted = packages.map(pkg => ({
            ...pkg,
            features: typeof pkg.features === 'string' ? JSON.parse(pkg.features || '[]') : (pkg.features || [])
        }));

        res.json({ packages: formatted });
    } catch (err) {
        console.error('[getAllPackages]', err);
        res.status(500).json({ error: 'Failed to fetch packages' });
    }
};

/**
 * Get single package details with its included courses (cumulative: includes courses up to its level)
 */
exports.getPackageDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const [packages] = await db.query('SELECT * FROM packages WHERE id = ? OR slug = ?', [id, id]);
        if (packages.length === 0) {
            return res.status(404).json({ error: 'Package not found' });
        }

        const pkg = packages[0];
        pkg.features = typeof pkg.features === 'string' ? JSON.parse(pkg.features || '[]') : (pkg.features || []);

        // Cumulative courses: courses linked to this package or packages of lower/equal level
        const [courses] = await db.query(`
            SELECT DISTINCT f.id, f.title, f.description, f.thumbnail_url, f.price, p.level AS package_level
            FROM formations f
            JOIN package_courses pc ON f.id = pc.formation_id
            JOIN packages p ON pc.package_id = p.id
            WHERE p.level <= ? AND f.is_published = 1
            ORDER BY p.level ASC, f.title ASC
        `, [pkg.level]);

        res.json({ package: pkg, courses });
    } catch (err) {
        console.error('[getPackageDetails]', err);
        res.status(500).json({ error: 'Failed to fetch package details' });
    }
};

/**
 * Get current student's active package and eligible upgrades
 */
/**
 * Helper to activate a user_package, enroll student in courses, distribute commissions,
 * and send notifications. Can be called on immediate wallet payment or on admin approval.
 */
async function processPackageActivation(connection, { userPackageId, userId, targetPackage, saleAmount, paymentMethod, paymentReference }) {
    // 1. Update user_package status to 'active'
    await connection.query(`
        UPDATE user_packages 
        SET status = 'active', amount_paid = ?,
            purchased_at = CURRENT_TIMESTAMP, 
            expires_at = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 YEAR)
        WHERE id = ?
    `, [saleAmount, userPackageId]);

    // Keep all purchased packages in independent history (status = 'active').
    // Update is_current = 1 strictly for the highest level active package of this user.
    const [highestPackRows] = await connection.query(`
        SELECT up.id 
        FROM user_packages up
        JOIN packages p ON up.package_id = p.id
        WHERE up.user_id = ? AND up.status = 'active'
        ORDER BY p.level DESC, up.purchased_at DESC
        LIMIT 1
    `, [userId]);

    if (highestPackRows.length > 0) {
        await connection.query('UPDATE user_packages SET is_current = 0 WHERE user_id = ?', [userId]);
        await connection.query('UPDATE user_packages SET is_current = 1 WHERE id = ?', [highestPackRows[0].id]);
    }

    // 2. Enroll student in courses
    let studentId = null;
    const [studentRows] = await connection.query('SELECT id FROM students WHERE user_id = ? OR id = ?', [userId, userId]);
    if (studentRows.length > 0) {
        studentId = studentRows[0].id;
    } else {
        studentId = genUuid();
        await connection.query('INSERT INTO students (id, user_id, status, created_at) VALUES (?, ?, "active", NOW())', [studentId, userId]);
    }

    const [coursesToEnroll] = await connection.query(`
        SELECT DISTINCT f.id AS formation_id
        FROM formations f
        JOIN package_courses pc ON f.id = pc.formation_id
        JOIN packages p ON pc.package_id = p.id
        WHERE p.level <= ?
    `, [targetPackage.level]);

    for (const c of coursesToEnroll) {
        const [exists] = await connection.query(
            'SELECT id FROM formation_enrollments WHERE student_id = ? AND formation_id = ?',
            [studentId, c.formation_id]
        );
        if (exists.length === 0) {
            await connection.query(`
                INSERT INTO formation_enrollments (id, student_id, formation_id, payment_status, enrolled_at)
                VALUES (?, ?, ?, 'approved', CURRENT_TIMESTAMP)
            `, [genUuid(), studentId, c.formation_id]);
        }
    }

    // 3. Commission Engine
    // Prevent duplicate commission payouts if this user_package has already had commissions distributed
    const [existingCommissions] = await connection.query(
        'SELECT id FROM commissions WHERE user_package_id = ? LIMIT 1',
        [userPackageId]
    );
    if (existingCommissions.length > 0) {
        console.warn(`[processPackageActivation] Commissions already paid for user_package ${userPackageId}. Skipping commission distribution to prevent duplicates.`);
        return { distributedCommissions: [] };
    }

    const [buyerRows] = await connection.query('SELECT id, referrer_id, email FROM users WHERE id = ?', [userId]);
    const buyer = buyerRows[0];
    const distributedCommissions = [];

    const isRegistrationMembership = saleAmount <= 30 || (targetPackage.slug && targetPackage.slug.includes('community')) || (targetPackage.slug && targetPackage.slug.includes('core')) || Number(targetPackage.price) <= 30;

    if (isRegistrationMembership) {
        // Direct Sponsor receives 50% ($15 USD) Direct Registration Commission
        if (buyer && buyer.referrer_id) {
            const [sponsorRows] = await connection.query(`
                SELECT u.id, u.email, u.affiliate_status, u.affiliate_enabled
                FROM users u
                WHERE u.id = ?
            `, [buyer.referrer_id]);

            if (sponsorRows.length > 0) {
                const sponsor = sponsorRows[0];
                const isAffiliateEnabled = sponsor.affiliate_enabled === 1 && sponsor.affiliate_status !== 'suspended';

                if (isAffiliateEnabled) {
                    const regBonusAmount = 15.00; // 50% of $30
                    const commId = genUuid();

                    await connection.query(`
                        INSERT INTO commissions (id, recipient_id, source_user_id, package_id, user_package_id, generation_level, rate_percentage, sale_amount, commission_amount, status)
                        VALUES (?, ?, ?, ?, ?, 1, 50.00, ?, ?, 'available')
                    `, [commId, sponsor.id, userId, targetPackage.id, userPackageId, saleAmount, regBonusAmount]);

                    const [spWalletRows] = await connection.query('SELECT balance FROM user_wallets WHERE user_id = ? FOR UPDATE', [sponsor.id]);
                    const spBalBefore = spWalletRows.length > 0 ? Number(spWalletRows[0].balance) : 0;
                    const spBalAfter = Number((spBalBefore + regBonusAmount).toFixed(2));

                    await connection.query(`
                        INSERT INTO user_wallets (id, user_id, balance, pending_balance, total_earned, total_withdrawn)
                        VALUES (?, ?, ?, 0.00, ?, 0.00)
                        ON DUPLICATE KEY UPDATE
                            balance = balance + VALUES(balance),
                            total_earned = total_earned + VALUES(total_earned)
                    `, [genUuid(), sponsor.id, regBonusAmount, regBonusAmount]);

                    // Record transaction ledger entry for sponsor commission
                    await connection.query(`
                        INSERT INTO transactions (id, user_id, type, amount, currency, balance_before, balance_after, status, reference_id, description)
                        VALUES (?, ?, 'commission', ?, 'USD', ?, ?, 'completed', ?, ?)
                    `, [
                        genUuid(),
                        sponsor.id,
                        regBonusAmount,
                        spBalBefore,
                        spBalAfter,
                        `REGCOMM-${Date.now()}`,
                        `عمولة تسجيل عضوية مباشرة ($15) لانضمام عضو جديد`
                    ]);

                    const notifId = genUuid();
                    const notifMsg = `مبروك! حصلت على عمولة تسجيل عضوية مباشرة بقيمة $${regBonusAmount.toFixed(2)} USD (50%) لانضمام وتفعيل عضو جديد في فريقك.`;
                    await connection.query(`
                        INSERT INTO notifications (id, user_id, title, content, type, is_read, created_at)
                        VALUES (?, ?, 'عمولة تسجيل عضوية جديدة', ?, 'commission', 0, CURRENT_TIMESTAMP)
                    `, [notifId, sponsor.id, notifMsg]);

                    distributedCommissions.push({
                        recipient_id: sponsor.id,
                        type: 'direct_registration',
                        amount: regBonusAmount
                    });
                }
            }
        }
    } else {
        // Regular Package or Upgrade ($150, $500, $1000): 10% Direct + 10-Generations Matching Bonus
        const [settingsRows] = await connection.query(`
            SELECT \`key\`, value FROM platform_settings 
            WHERE \`key\` IN (
                'affiliate_require_pack_purchase',
                'affiliate_direct_rate',
                'affiliate_gen1_rate', 'affiliate_gen2_rate', 'affiliate_gen3_rate', 'affiliate_gen4_rate', 'affiliate_gen5_rate',
                'affiliate_gen6_rate', 'affiliate_gen7_rate', 'affiliate_gen8_rate', 'affiliate_gen9_rate', 'affiliate_gen10_rate'
            )
        `);
        const settingsMap = {};
        settingsRows.forEach(r => { settingsMap[r.key] = r.value; });

        const directRate = Number(settingsMap['affiliate_direct_rate'] || 10); // 10%
        const requirePack = settingsMap['affiliate_require_pack_purchase'] === '1';

        const matchingRates = {
            1: Number(settingsMap['affiliate_gen1_rate'] || 5),
            2: Number(settingsMap['affiliate_gen2_rate'] || 4),
            3: Number(settingsMap['affiliate_gen3_rate'] || 3),
            4: Number(settingsMap['affiliate_gen4_rate'] || 2),
            5: Number(settingsMap['affiliate_gen5_rate'] || 1),
            6: Number(settingsMap['affiliate_gen6_rate'] || 1),
            7: Number(settingsMap['affiliate_gen7_rate'] || 1),
            8: Number(settingsMap['affiliate_gen8_rate'] || 0.5),
            9: Number(settingsMap['affiliate_gen9_rate'] || 0.5),
            10: Number(settingsMap['affiliate_gen10_rate'] || 0.5),
        };

        const directCommAmount = Number(((saleAmount * directRate) / 100).toFixed(2));

        if (buyer && buyer.referrer_id && directCommAmount > 0) {
            const [sponsorRows] = await connection.query(`
                SELECT u.id, u.email, u.affiliate_status, u.affiliate_enabled,
                       (SELECT COUNT(*) FROM user_packages up WHERE up.user_id = u.id AND up.status = 'active') AS active_packs_count
                FROM users u
                WHERE u.id = ?
            `, [buyer.referrer_id]);

            if (sponsorRows.length > 0) {
                const sponsor = sponsorRows[0];
                const isAffiliateEnabled = sponsor.affiliate_enabled === 1 && sponsor.affiliate_status !== 'suspended';
                const hasPurchasedPack = Number(sponsor.active_packs_count) > 0;
                const isDirectEligible = isAffiliateEnabled && (!requirePack || hasPurchasedPack);

                if (isDirectEligible) {
                    const directCommId = genUuid();
                    await connection.query(`
                        INSERT INTO commissions (id, recipient_id, source_user_id, package_id, user_package_id, generation_level, rate_percentage, sale_amount, commission_amount, status)
                        VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, 'available')
                    `, [directCommId, sponsor.id, userId, targetPackage.id, userPackageId, directRate, saleAmount, directCommAmount]);

                    const [spWalletRows] = await connection.query('SELECT balance FROM user_wallets WHERE user_id = ? FOR UPDATE', [sponsor.id]);
                    const spBalBefore = spWalletRows.length > 0 ? Number(spWalletRows[0].balance) : 0;
                    const spBalAfter = Number((spBalBefore + directCommAmount).toFixed(2));

                    await connection.query(`
                        INSERT INTO user_wallets (id, user_id, balance, pending_balance, total_earned, total_withdrawn)
                        VALUES (?, ?, ?, 0.00, ?, 0.00)
                        ON DUPLICATE KEY UPDATE
                            balance = balance + VALUES(balance),
                            total_earned = total_earned + VALUES(total_earned)
                    `, [genUuid(), sponsor.id, directCommAmount, directCommAmount]);

                    await connection.query(`
                        INSERT INTO transactions (id, user_id, type, amount, currency, balance_before, balance_after, status, reference_id, description)
                        VALUES (?, ?, 'commission', ?, 'USD', ?, ?, 'completed', ?, ?)
                    `, [
                        genUuid(),
                        sponsor.id,
                        directCommAmount,
                        spBalBefore,
                        spBalAfter,
                        `DIRCOMM-${Date.now()}`,
                        `عمولة باقة مباشرة (${directRate}%) من شراء باقة ${targetPackage.name_ar || targetPackage.name}`
                    ]);

                    const notifId = genUuid();
                    const notifMsg = `مبروك! حصلت على عمولة مباشرة بقيمة $${directCommAmount.toFixed(2)} (${directRate}%) من شراء باقة ${targetPackage.name_ar || targetPackage.name} بواسطة عضوك المباشر.`;
                    await connection.query(`
                        INSERT INTO notifications (id, user_id, title, content, type, is_read, created_at)
                        VALUES (?, ?, 'عمولة باقة مباشرة جديدة', ?, 'commission', 0, CURRENT_TIMESTAMP)
                    `, [notifId, sponsor.id, notifMsg]);

                    distributedCommissions.push({
                        recipient_id: sponsor.id,
                        type: 'direct_package_commission',
                        rate: `${directRate}%`,
                        amount: directCommAmount
                    });
                }
            }
        }

        // Matching Bonus Loop
        let currentReferrerId = buyer ? buyer.referrer_id : null;
        let genLevel = 1;

        while (currentReferrerId && genLevel <= 10) {
            const [ancestorRows] = await connection.query(`
                SELECT u.id, u.email, u.referrer_id, u.affiliate_status, u.affiliate_enabled,
                       (SELECT COUNT(*) FROM user_packages up WHERE up.user_id = u.id AND up.status = 'active') AS active_packs_count
                FROM users u
                WHERE u.id = ?
            `, [currentReferrerId]);

            if (ancestorRows.length === 0) break;
            const ancestor = ancestorRows[0];

            const { effective: effectiveUnlocked, package: ancestorPack, rank: ancestorRank } = await getUserEffectiveUnlockedGenerations(ancestor.id, connection);

            const isAffiliateEnabled = ancestor.affiliate_enabled === 1 && ancestor.affiliate_status !== 'suspended';
            const hasPurchasedPack = Number(ancestor.active_packs_count) > 0;
            const isGenerationUnlocked = genLevel <= effectiveUnlocked;
            const isEligible = isAffiliateEnabled && (!requirePack || hasPurchasedPack) && isGenerationUnlocked;

            const matchRate = matchingRates[genLevel] || 0;
            const matchAmount = Number(((directCommAmount * matchRate) / 100).toFixed(2));

            if (isEligible && matchAmount > 0) {
                const matchCommId = genUuid();

                await connection.query(`
                    INSERT INTO commissions (id, recipient_id, source_user_id, package_id, user_package_id, generation_level, rate_percentage, sale_amount, commission_amount, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')
                `, [matchCommId, ancestor.id, userId, targetPackage.id, userPackageId, genLevel, matchRate, directCommAmount, matchAmount]);

                const [ancWalletRows] = await connection.query('SELECT balance FROM user_wallets WHERE user_id = ? FOR UPDATE', [ancestor.id]);
                const ancBalBefore = ancWalletRows.length > 0 ? Number(ancWalletRows[0].balance) : 0;
                const ancBalAfter = Number((ancBalBefore + matchAmount).toFixed(2));

                await connection.query(`
                    INSERT INTO user_wallets (id, user_id, balance, pending_balance, total_earned, total_withdrawn)
                    VALUES (?, ?, ?, 0.00, ?, 0.00)
                    ON DUPLICATE KEY UPDATE
                        balance = balance + VALUES(balance),
                        total_earned = total_earned + VALUES(total_earned)
                `, [genUuid(), ancestor.id, matchAmount, matchAmount]);

                await connection.query(`
                    INSERT INTO transactions (id, user_id, type, amount, currency, balance_before, balance_after, status, reference_id, description)
                    VALUES (?, ?, 'commission', ?, 'USD', ?, ?, 'completed', ?, ?)
                `, [
                    genUuid(),
                    ancestor.id,
                    matchAmount,
                    ancBalBefore,
                    ancBalAfter,
                    `MATCHCOMM-${Date.now()}-${genLevel}`,
                    `عمولة Matching Bonus (${matchRate}%) من مبيعات الجيل ${genLevel}`
                ]);

                const notifId = genUuid();
                const notifMsg = `مبروك! حصلت على عمولة Matching Bonus بقيمة $${matchAmount.toFixed(2)} (${matchRate}% من العمولة المباشرة) من مبيعات الجيل ${genLevel} لشراء ${targetPackage.name_ar || targetPackage.name}.`;
                await connection.query(`
                    INSERT INTO notifications (id, user_id, title, content, type, is_read, created_at)
                    VALUES (?, ?, 'عمولة Matching Bonus', ?, 'commission', 0, CURRENT_TIMESTAMP)
                `, [notifId, ancestor.id, notifMsg]);

                distributedCommissions.push({
                    recipient_id: ancestor.id,
                    generation: genLevel,
                    rate: `${matchRate}%`,
                    amount: matchAmount
                });
            } else if (hasPurchasedPack && !isGenerationUnlocked && matchAmount > 0) {
                const notifId = genUuid();
                const packName = ancestorPack?.name_ar || ancestorPack?.name || 'باقتك';
                const rankName = ancestorRank?.name_ar || '';
                const notifMsg = `تنبيه: تمت عملية في جيلك ${genLevel}. لم تستلم عمولة قدرها $${matchAmount.toFixed(2)} لأن خطتك الحالية (${packName}${rankName ? ' - ' + rankName : ''}) تفتح أرباح حتى الجيل ${effectiveUnlocked} فقط. بادر بالترقية أو رفع رتبتك لفتح هذا الجيل ومضاعفة أرباحك!`;
                await connection.query(`
                    INSERT INTO notifications (id, user_id, title, content, type, is_read, created_at)
                    VALUES (?, ?, 'فرصة ربح: عمولة جيل مقفل', ?, 'upgrade_alert', 0, CURRENT_TIMESTAMP)
                `, [notifId, ancestor.id, notifMsg]);
            }

            currentReferrerId = ancestor.referrer_id;
            genLevel++;
        }
    }

    // 4. Send notification to the student
    const studentNotifId = genUuid();
    await connection.query(`
        INSERT INTO notifications (id, user_id, title, content, type, is_read, created_at)
        VALUES (?, ?, 'تم تفعيل باقتك بنجاح!', ?, 'package', 0, CURRENT_TIMESTAMP)
    `, [studentNotifId, userId, `تهانينا! تم تفعيل باقة ${targetPackage.name_ar || targetPackage.name} بنجاح. حسابك الآن مفعل بالكامل وبإمكانك تصفح المنصة والاستفادة من جميع المميزات.`]);

    // Safely dispatch package-purchased email to buyer in background
    emailService.sendToUser(userId, 'package-purchased', {
        package_name: targetPackage.name_ar || targetPackage.name,
        price: Number(saleAmount || targetPackage.price || 0).toFixed(2),
        currency: 'USD',
        tier: targetPackage.tier || targetPackage.level || 'Standard',
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        academy_url: '/academy'
    }).catch(e => console.error('[processPackageActivation:buyer] Email error:', e.message));

    // Safely dispatch commission-earned email to each earning sponsor in background
    for (const comm of distributedCommissions) {
        if (comm.recipient_id && comm.amount > 0) {
            emailService.sendToUser(comm.recipient_id, 'commission-earned', {
                amount: Number(comm.amount).toFixed(2),
                currency: 'USD',
                generation: String(comm.generation || 1),
                source_user: buyer ? (buyer.name || 'عضو في فريقك') : 'عضو في فريقك',
                wallet_balance: '---',
                date: new Date().toISOString().replace('T', ' ').substring(0, 19)
            }).catch(e => console.error('[processPackageActivation:comm] Email error:', e.message));
        }
    }

    // 5. Check if direct referrer qualifies for Founder Club (100 seats, $5000 in 30 days)
    const directReferrerId = buyer ? buyer.referrer_id : null;
    if (directReferrerId) {
        try {
            const founderCtrl = require('./founderController');
            await founderCtrl.checkAndQualifyFounder(connection, directReferrerId);
        } catch (fErr) {
            console.error('[FounderClubCheck] Error checking founder qualification:', fErr);
        }
    }

    return { distributedCommissions };
}

exports.processPackageActivation = processPackageActivation;

/**
 * Get current student's active package, pending package (if any), and eligible upgrades
 */
exports.getMyPackage = async (req, res) => {
    const userId = req.user.id;
    try {
        // Find currently highest active package for user (valid within 1-year subscription window)
        const [userPackages] = await db.query(`
            SELECT up.*, p.name AS package_name, p.name_ar AS package_name_ar, 
                   p.slug, p.price AS package_original_price, p.level, p.features, p.badge_text,
                   p.unlocked_generations
            FROM user_packages up
            JOIN packages p ON up.package_id = p.id
            WHERE up.user_id = ? AND up.status = 'active' AND (up.expires_at IS NULL OR up.expires_at > CURRENT_TIMESTAMP)
            ORDER BY p.level DESC, up.purchased_at DESC
            LIMIT 1
        `, [userId]);

        const current = userPackages[0] || null;
        if (current && typeof current.features === 'string') {
            current.features = JSON.parse(current.features || '[]');
        }

        // Fetch full independent purchases history for this user
        const [purchasedPackages] = await db.query(`
            SELECT up.id, up.package_id, up.amount_paid, up.payment_method, up.payment_reference, 
                   up.receipt_url, up.notes, up.status, up.is_current, up.purchased_at, up.expires_at,
                   p.name AS package_name, p.name_ar AS package_name_ar, p.slug, p.price AS package_price,
                   p.level, p.unlocked_generations, p.badge_text, p.features
            FROM user_packages up
            JOIN packages p ON up.package_id = p.id
            WHERE up.user_id = ?
            ORDER BY up.purchased_at DESC
        `, [userId]);

        const formattedHistory = purchasedPackages.map(pkg => ({
            ...pkg,
            features: typeof pkg.features === 'string' ? JSON.parse(pkg.features || '[]') : (pkg.features || [])
        }));

        // Also check if there is a pending package request
        const [pendingRows] = await db.query(`
            SELECT up.*, p.name AS package_name, p.name_ar AS package_name_ar,
                   p.slug, p.price AS package_original_price, p.level, p.features, p.badge_text
            FROM user_packages up
            JOIN packages p ON up.package_id = p.id
            WHERE up.user_id = ? AND up.status = 'pending'
            ORDER BY up.purchased_at DESC
            LIMIT 1
        `, [userId]);

        const pending = pendingRows[0] || null;
        if (pending && typeof pending.features === 'string') {
            pending.features = JSON.parse(pending.features || '[]');
        }

        // All active packages with full pricing and purchase status (no upgrade deductions)
        const [allPkgs] = await db.query('SELECT * FROM packages WHERE is_active = 1 ORDER BY level ASC');
        const activeOwnedPackageIds = new Set(
            purchasedPackages.filter(p => p.status === 'active').map(p => p.package_id)
        );

        const availablePackages = allPkgs.map(pkg => ({
            ...pkg,
            price: Number(pkg.price),
            upgrade_price: Number(pkg.price), // Keep for backwards compatibility
            isPurchased: activeOwnedPackageIds.has(pkg.id),
            features: typeof pkg.features === 'string' ? JSON.parse(pkg.features || '[]') : (pkg.features || [])
        }));

        // Available packages to purchase (those not yet owned)
        const unpurchasedPackages = availablePackages.filter(pkg => !pkg.isPurchased);

        // Check if there is an active pending NOWPayments payment order
        let activeNowPaymentsOrder = null;
        const [pendingTxRows] = await db.query(`
            SELECT id, reference_id, amount, status, metadata, created_at
            FROM transactions
            WHERE user_id = ? AND type = 'package_purchase' AND status = 'pending'
            ORDER BY created_at DESC
            LIMIT 1
        `, [userId]);

        if (pendingTxRows.length > 0) {
            const tx = pendingTxRows[0];
            const meta = typeof tx.metadata === 'string' ? JSON.parse(tx.metadata || '{}') : (tx.metadata || {});
            if (meta.isNowPayments && meta.active_pay_address) {
                activeNowPaymentsOrder = {
                    orderId: tx.id,
                    paymentId: meta.active_payment_id || tx.reference_id,
                    payAddress: meta.active_pay_address,
                    payAmount: meta.active_pay_amount || tx.amount || 30,
                    payCurrency: meta.active_pay_currency || 'USDTBSC',
                    network: meta.active_network || 'bsc',
                    createdAt: tx.created_at,
                    expiresAt: meta.expires_at || new Date(new Date(tx.created_at).getTime() + 20 * 60 * 1000).toISOString()
                };
            }
        }

        res.json({ 
            currentPackage: current, 
            highestPackage: current,
            hasActivePackage: !!current, 
            pendingPackage: pending, 
            activeNowPaymentsOrder,
            purchasedPackages: formattedHistory,
            availablePackages,
            availableUpgrades: unpurchasedPackages 
        });
    } catch (err) {
        console.error('[getMyPackage]', err);
        res.status(500).json({ error: 'Failed to fetch user package' });
    }
};

/**
 * Purchase a package (Full price, independent purchase record, with transaction safety & Affiliate Commission Distribution)
 */
exports.purchaseOrUpgradePackage = async (req, res) => {
    const userId = req.user.id;
    const { packageId, paymentMethod = 'bank_transfer', paymentReference = '', receiptUrl = '', notes = '' } = req.body;

    if (!packageId) {
        return res.status(400).json({ error: 'Package ID is required' });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Get target package
        const [targetPackages] = await connection.query('SELECT * FROM packages WHERE id = ? AND is_active = 1', [packageId]);
        if (targetPackages.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Target package not found or inactive' });
        }
        const targetPackage = targetPackages[0];

        // 2. Prevent duplicate purchase: check if user already owns this package and it is active
        const [existingOwned] = await connection.query(`
            SELECT id FROM user_packages 
            WHERE user_id = ? AND package_id = ? AND status = 'active'
        `, [userId, targetPackage.id]);

        if (existingOwned.length > 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'أنت تمتلك هذه الباقة بالفعل ومفعلة في حسابك.' });
        }

        // Each package is purchased at its FULL price with NO deductions of previous packages
        const saleAmount = Number(targetPackage.price);

        // 3. Handle Wallet vs Manual (Bank / USDT) Payment Methods
        const isWalletPayment = (paymentMethod === 'wallet');
        let paymentRefToSave = paymentReference;

        if (isWalletPayment) {
            // Check wallet balance against full package price
            const [walletRows] = await connection.query('SELECT * FROM user_wallets WHERE user_id = ? FOR UPDATE', [userId]);
            const wallet = walletRows[0];
            const currentBal = wallet ? Number(wallet.balance) : 0;

            if (currentBal < saleAmount) {
                await connection.rollback();
                return res.status(400).json({ 
                    error: `رصيد المحفظة غير كافٍ. رصيدك المتاح هو $${currentBal.toFixed(2)} USD والمبلغ المطلوب هو $${saleAmount.toFixed(2)} USD. يرجى شحن محفظتك أولاً.` 
                });
            }

            const balanceBefore = currentBal;
            const balanceAfter = Number((currentBal - saleAmount).toFixed(2));

            await connection.query('UPDATE user_wallets SET balance = balance - ? WHERE user_id = ?', [saleAmount, userId]);

            paymentRefToSave = paymentReference || `WAL-${Date.now()}`;

            // Insert transaction record into ledger
            const trxId = genUuid();
            await connection.query(`
                INSERT INTO transactions (id, user_id, type, amount, currency, balance_before, balance_after, status, reference_id, description, metadata)
                VALUES (?, ?, 'package_purchase', ?, 'USD', ?, ?, 'completed', ?, ?, ?)
            `, [
                trxId,
                userId,
                saleAmount,
                balanceBefore,
                balanceAfter,
                paymentRefToSave,
                `شراء باقة ${targetPackage.name_ar || targetPackage.name} من رصيد المحفظة بالسعر الكامل ($${saleAmount})`,
                JSON.stringify({ packageId: targetPackage.id, paymentMethod: 'wallet', isFullPurchase: true })
            ]);

            // Create active user_package entry (stored independently)
            const newUserPackageId = genUuid();
            await connection.query(`
                INSERT INTO user_packages (id, user_id, package_id, amount_paid, payment_method, payment_reference, receipt_url, notes, status, is_current, purchased_at, expires_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 0, CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 YEAR))
            `, [newUserPackageId, userId, targetPackage.id, saleAmount, paymentMethod, paymentRefToSave, receiptUrl, notes]);

            // Process activation (courses, commissions, notifications)
            const { distributedCommissions } = await processPackageActivation(connection, {
                userPackageId: newUserPackageId,
                userId,
                targetPackage,
                saleAmount,
                paymentMethod: 'wallet',
                paymentReference: paymentRefToSave
            });

            await connection.commit();

            return res.json({
                message: 'تم شراء وتفعيل الباقة بنجاح من رصيد المحفظة بالسعر الكامل!',
                status: 'active',
                package: targetPackage,
                amountPaid: saleAmount,
                commissionsDistributed: distributedCommissions.length
            });
        } else if (paymentMethod === 'nowpayments_crypto' || paymentMethod === 'usdt') {
            // NOWPayments Crypto (USDT BEP20) dynamic dedicated wallet creation
            const trxId = genUuid();
            let initialPayment = null;
            try {
                initialPayment = await nowpaymentsService.createPayment({
                    priceAmount: saleAmount,
                    priceCurrency: 'USD',
                    payCurrency: 'usdtbsc', // Always USDT on BEP20 (Binance Smart Chain)
                    orderId: trxId,
                    orderDescription: `Nexyvora Package Activation #${trxId} ($${saleAmount} USD)`
                });
            } catch (apiErr) {
                await connection.rollback();
                console.error('[purchaseOrUpgradePackage:NowPayments] API Error:', apiErr.message);
                return res.status(502).json({
                    error: 'فشل الاتصال ببوابة NOWPayments لإنشاء عنوان الدفع المخصص. يرجى المحاولة لاحقاً.',
                    details: apiErr.message
                });
            }

            const attemptId = genUuid();
            const nextRenewalTime = new Date(Date.now() + 20 * 60 * 1000);

            // Upsert user_packages in pending status
            const [existingPending] = await connection.query(`
                SELECT id FROM user_packages WHERE user_id = ? AND status = 'pending'
            `, [userId]);

            let targetUserPackageId = genUuid();
            if (existingPending.length > 0) {
                targetUserPackageId = existingPending[0].id;
                await connection.query(`
                    UPDATE user_packages 
                    SET package_id = ?, amount_paid = ?, payment_method = 'nowpayments_crypto', payment_reference = ?,
                        receipt_url = NULL, notes = 'NOWPayments USDT (BEP20)', purchased_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `, [targetPackage.id, saleAmount, initialPayment.paymentId, targetUserPackageId]);
            } else {
                await connection.query(`
                    INSERT INTO user_packages (id, user_id, package_id, amount_paid, payment_method, payment_reference, receipt_url, notes, status, is_current, purchased_at)
                    VALUES (?, ?, ?, ?, 'nowpayments_crypto', ?, NULL, 'NOWPayments USDT (BEP20)', 'pending', 0, CURRENT_TIMESTAMP)
                `, [targetUserPackageId, userId, targetPackage.id, saleAmount, initialPayment.paymentId]);
            }

            const meta = {
                isNowPayments: true,
                packageId: targetPackage.id,
                userPackageId: targetUserPackageId,
                paymentMethod: 'nowpayments_crypto',
                isFullPurchase: true,
                active_attempt_id: attemptId,
                active_payment_id: initialPayment.paymentId,
                active_pay_address: initialPayment.payAddress,
                active_pay_amount: initialPayment.payAmount,
                active_pay_currency: initialPayment.payCurrency,
                active_network: initialPayment.network || 'bsc',
                next_renewal_at: nextRenewalTime.toISOString(),
                expires_at: nextRenewalTime.toISOString(),
                requested_at: new Date().toISOString()
            };

            await connection.query(`
                INSERT INTO transactions (id, user_id, type, amount, currency, balance_before, balance_after, status, reference_id, description, metadata)
                VALUES (?, ?, 'package_purchase', ?, 'USD', 0, 0, 'pending', ?, ?, ?)
            `, [
                trxId,
                userId,
                saleAmount,
                initialPayment.paymentId,
                `طلب شراء وتفعيل باقة عبر NOWPayments (USDT BEP20): ${targetPackage.name_ar || targetPackage.name} بالسعر الكامل ($${saleAmount})`,
                JSON.stringify(meta)
            ]);

            try {
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
                        is_package_activation: true,
                        package_id: targetPackage.id,
                        user_package_id: targetUserPackageId,
                        rawResponse: initialPayment.raw
                    })
                ]);
            } catch (attErr) {
                console.warn('[purchaseOrUpgradePackage] Could not write payment_attempts (ignored):', attErr.message);
            }

            await connection.commit();

            return res.json({
                message: 'تم إنشاء عنوان محفظة الدفع المخصصة بنجاح عبر NOWPayments!',
                status: 'waiting_payment',
                isNowPayments: true,
                orderId: trxId,
                userPackageId: targetUserPackageId,
                payment: {
                    orderId: trxId,
                    paymentId: initialPayment.paymentId,
                    payAddress: initialPayment.payAddress,
                    payAmount: initialPayment.payAmount,
                    payCurrency: initialPayment.payCurrency,
                    network: initialPayment.network || 'bsc',
                    expiresAt: nextRenewalTime.toISOString()
                }
            });
        } else {
            // Non-wallet payment (Bank Transfer): Create PENDING request
            paymentRefToSave = paymentReference || `PKG-${Date.now()}`;

            const [existingPending] = await connection.query(`
                SELECT id FROM user_packages WHERE user_id = ? AND status = 'pending'
            `, [userId]);

            let targetUserPackageId = genUuid();
            if (existingPending.length > 0) {
                targetUserPackageId = existingPending[0].id;
                await connection.query(`
                    UPDATE user_packages 
                    SET package_id = ?, amount_paid = ?, payment_method = ?, payment_reference = ?,
                        receipt_url = ?, notes = ?, purchased_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `, [targetPackage.id, saleAmount, paymentMethod, paymentRefToSave, receiptUrl, notes, targetUserPackageId]);
            } else {
                await connection.query(`
                    INSERT INTO user_packages (id, user_id, package_id, amount_paid, payment_method, payment_reference, receipt_url, notes, status, is_current, purchased_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, CURRENT_TIMESTAMP)
                `, [targetUserPackageId, userId, targetPackage.id, saleAmount, paymentMethod, paymentRefToSave, receiptUrl, notes]);
            }

            // Record pending transaction in ledger for reference
            const trxId = genUuid();
            await connection.query(`
                INSERT INTO transactions (id, user_id, type, amount, currency, balance_before, balance_after, status, reference_id, description, metadata)
                VALUES (?, ?, 'package_purchase', ?, 'USD', 0, 0, 'pending', ?, ?, ?)
            `, [
                trxId,
                userId,
                saleAmount,
                paymentRefToSave,
                `طلب شراء وتفعيل باقة (${paymentMethod}): ${targetPackage.name_ar || targetPackage.name} بالسعر الكامل ($${saleAmount}) [قيد المراجعة]`,
                JSON.stringify({ packageId: targetPackage.id, paymentMethod, receiptUrl, notes, isFullPurchase: true, userPackageId: targetUserPackageId })
            ]);

            // Notify admin / log
            const notifId = genUuid();
            await connection.query(`
                INSERT INTO notifications (id, user_id, title, content, type, is_read, created_at)
                VALUES (?, ?, 'تم استلام طلب تفعيل الباقة', ?, 'package', 0, CURRENT_TIMESTAMP)
            `, [notifId, userId, `تم استلام طلب تفعيل باقة ${targetPackage.name_ar || targetPackage.name} بنجاح وإرفاق وصل التحويل بالسعر الكامل ($${saleAmount}). طلبك الآن قيد المراجعة والتدقيق وسوف يتم تفعيل حسابك فور مراجعة الإدارة.`]);

            await connection.commit();

            return res.json({
                message: 'تم إرسال طلب تفعيل الباقة وإرفاق الوصل بنجاح! طلبك الآن قيد المراجعة والتدقيق وسيتم تفعيل حسابك فور التحقق.',
                status: 'pending',
                package: targetPackage,
                amountPaid: saleAmount,
                userPackageId: targetUserPackageId
            });
        }
    } catch (err) {
        await connection.rollback();
        console.error('[purchaseOrUpgradePackage]', err);
        res.status(500).json({ error: 'Failed to process package purchase' });
    } finally {
        connection.release();
    }
};

/**
 * Admin: Assign courses to package
 */
exports.assignCoursesToPackage = async (req, res) => {
    const { packageId } = req.params;
    const { formationIds = [] } = req.body;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Clear existing courses for this package
        await connection.query('DELETE FROM package_courses WHERE package_id = ?', [packageId]);

        // Insert new associations
        for (const formationId of formationIds) {
            await connection.query(`
                INSERT INTO package_courses (id, package_id, formation_id)
                VALUES (?, ?, ?)
            `, [genUuid(), packageId, formationId]);
        }

        // Automatically sync new courses to all active students whose package level >= this package level
        const [pkgRows] = await connection.query('SELECT level FROM packages WHERE id = ?', [packageId]);
        if (pkgRows.length > 0 && formationIds.length > 0) {
            const pkgLevel = pkgRows[0].level;
            const [eligibleStudents] = await connection.query(`
                SELECT DISTINCT s.id AS student_id
                FROM user_packages up
                JOIN packages p ON up.package_id = p.id
                JOIN students s ON up.user_id = s.user_id
                WHERE up.status = 'active' AND p.level >= ?
            `, [pkgLevel]);

            for (const st of eligibleStudents) {
                for (const formId of formationIds) {
                    const [exists] = await connection.query(
                        'SELECT id FROM formation_enrollments WHERE student_id = ? AND formation_id = ?',
                        [st.student_id, formId]
                    );
                    if (exists.length === 0) {
                        await connection.query(`
                            INSERT INTO formation_enrollments (id, student_id, formation_id, payment_status, enrolled_at)
                            VALUES (?, ?, ?, 'approved', CURRENT_TIMESTAMP)
                        `, [genUuid(), st.student_id, formId]);
                    }
                }
            }
        }

        await connection.commit();
        res.json({ message: 'Courses assigned to package and synced to active students successfully', count: formationIds.length });
    } catch (err) {
        await connection.rollback();
        console.error('[assignCoursesToPackage]', err);
        res.status(500).json({ error: 'Failed to assign courses to package' });
    } finally {
        connection.release();
    }
};

/**
 * Admin: Update package details (name, price, generations, content, features)
 */
exports.updatePackage = async (req, res) => {
    const { id } = req.params;
    const { 
        name, 
        name_ar, 
        description, 
        description_ar, 
        price, 
        unlocked_generations, 
        features, 
        badge_text,
        is_active 
    } = req.body;

    try {
        const [existing] = await db.query('SELECT * FROM packages WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Package not found' });
        }

        const current = existing[0];
        const updatedName = name !== undefined ? String(name).trim() : current.name;
        const updatedNameAr = name_ar !== undefined ? String(name_ar).trim() : current.name_ar;
        const updatedDesc = description !== undefined ? String(description).trim() : current.description;
        const updatedDescAr = description_ar !== undefined ? String(description_ar).trim() : current.description_ar;
        const updatedPrice = price !== undefined ? Number(price) : Number(current.price);
        const updatedGens = unlocked_generations !== undefined ? Math.min(10, Math.max(0, parseInt(unlocked_generations, 10))) : current.unlocked_generations;
        
        let updatedFeatures = current.features;
        if (features !== undefined) {
            updatedFeatures = Array.isArray(features) ? JSON.stringify(features) : features;
        }

        const updatedBadge = badge_text !== undefined ? badge_text : current.badge_text;
        const updatedActive = is_active !== undefined ? (is_active ? 1 : 0) : current.is_active;

        await db.query(`
            UPDATE packages 
            SET name = ?, name_ar = ?, description = ?, description_ar = ?, price = ?, 
                unlocked_generations = ?, features = ?, badge_text = ?, is_active = ?, updated_at = NOW()
            WHERE id = ?
        `, [
            updatedName,
            updatedNameAr,
            updatedDesc,
            updatedDescAr,
            updatedPrice,
            updatedGens,
            updatedFeatures,
            updatedBadge,
            updatedActive,
            id
        ]);

        const [updatedRows] = await db.query('SELECT * FROM packages WHERE id = ?', [id]);
        const updatedPkg = updatedRows[0];
        updatedPkg.features = typeof updatedPkg.features === 'string' ? JSON.parse(updatedPkg.features || '[]') : (updatedPkg.features || []);

        res.json({ message: 'Package updated successfully', package: updatedPkg });
    } catch (err) {
        console.error('[updatePackage]', err);
        res.status(500).json({ error: 'Failed to update package' });
    }
};

/**
 * Check real-time payment status of NOWPayments package purchase and activate if confirmed
 */
exports.checkNowPaymentsPayment = async (req, res) => {
    const userId = req.user.id;
    const { orderId } = req.params;

    if (!orderId) {
        return res.status(400).json({ error: 'Order ID is required' });
    }

    try {
        // 1. Check if user already has an active package
        const [activeRows] = await db.query(`
            SELECT up.*, p.name AS package_name, p.name_ar AS package_name_ar
            FROM user_packages up
            JOIN packages p ON up.package_id = p.id
            WHERE up.user_id = ? AND up.status = 'active'
            ORDER BY p.level DESC LIMIT 1
        `, [userId]);

        // 2. Find transaction
        const [txRows] = await db.query(`
            SELECT * FROM transactions
            WHERE (id = ? OR reference_id = ?) AND user_id = ? AND type = 'package_purchase'
            ORDER BY created_at DESC LIMIT 1
        `, [orderId, orderId, userId]);

        if (txRows.length === 0) {
            if (activeRows.length > 0) {
                return res.json({
                    status: 'active',
                    message: 'تم تفعيل حسابك بنجاح!',
                    currentPackage: activeRows[0]
                });
            }
            return res.status(404).json({ error: 'لم يتم العثور على معاملة تفعيل الباقة' });
        }

        const transaction = txRows[0];
        if (transaction.status === 'completed') {
            return res.json({
                status: 'active',
                message: 'تم تفعيل حسابك بنجاح!',
                currentPackage: activeRows[0] || null
            });
        }

        const meta = typeof transaction.metadata === 'string' ? JSON.parse(transaction.metadata || '{}') : (transaction.metadata || {});
        const paymentId = meta.active_payment_id || transaction.reference_id;

        if (!paymentId) {
            return res.json({ status: 'pending', message: 'في انتظار بيانات بوابة الدفع' });
        }

        // 3. Query NOWPayments live API
        let statusData;
        try {
            statusData = await nowpaymentsService.getPaymentStatus(paymentId);
        } catch (apiErr) {
            console.error('[checkNowPaymentsPayment] API Error:', apiErr.message);
            return res.json({
                status: 'waiting_payment',
                paymentStatus: 'waiting',
                message: 'جاري مراقبة الشبكة والتحقق من المعاملة...'
            });
        }

        const isCompleted = ['finished', 'confirmed'].includes(statusData.paymentStatus);

        if (isCompleted) {
            // Activate now in transaction
            const connection = await db.getConnection();
            try {
                await connection.beginTransaction();

                // Re-check transaction status under lock
                const [lockedTx] = await connection.query('SELECT status FROM transactions WHERE id = ? FOR UPDATE', [transaction.id]);
                if (lockedTx[0]?.status === 'completed') {
                    await connection.rollback();
                    return res.json({ status: 'active', message: 'تم تفعيل حسابك بنجاح!' });
                }

                // Get target package
                const packageId = meta.packageId;
                const [pkgRows] = await connection.query('SELECT * FROM packages WHERE id = ?', [packageId]);
                const targetPackage = pkgRows[0];

                let userPackageId = meta.userPackageId;
                if (!userPackageId) {
                    const [pendingUp] = await connection.query(`
                        SELECT id FROM user_packages WHERE user_id = ? AND status = 'pending' ORDER BY purchased_at DESC LIMIT 1
                    `, [userId]);
                    userPackageId = pendingUp[0]?.id;
                }

                if (!targetPackage || !userPackageId) {
                    await connection.rollback();
                    return res.status(500).json({ error: 'بيانات الباقة غير متوفرة لإتمام التفعيل' });
                }

                // Call core activation processor
                await processPackageActivation(connection, {
                    userPackageId,
                    userId,
                    targetPackage,
                    saleAmount: Number(transaction.amount || targetPackage.price),
                    upgradedFromId: meta.upgradedFromId || null,
                    paymentMethod: 'nowpayments_crypto',
                    paymentReference: paymentId
                });

                // Update transaction status to completed
                const updatedMeta = {
                    ...meta,
                    payment_status: statusData.paymentStatus,
                    completed_at: new Date().toISOString(),
                    actually_paid: statusData.actuallyPaid,
                    actually_paid_fiat: statusData.actuallyPaidAtFiat
                };

                await connection.query(`
                    UPDATE transactions 
                    SET status = 'completed', description = CONCAT(description, ' [تم الدفع والتفعيل التلقائي]'), metadata = ?
                    WHERE id = ?
                `, [JSON.stringify(updatedMeta), transaction.id]);

                // Update payment_attempts
                await connection.query(`
                    UPDATE payment_attempts 
                    SET status = ?, actually_paid = ?, actually_paid_fiat = ?, is_wallet_credited = 1, wallet_credited_at = NOW()
                    WHERE transaction_id = ? OR provider_payment_id = ?
                `, [statusData.paymentStatus, statusData.actuallyPaid, statusData.actuallyPaidAtFiat, transaction.id, paymentId]);

                await connection.commit();

                return res.json({
                    status: 'active',
                    message: '🎉 تم استلام الدفع بنجاح وتفعيل عضويتك الرسمية في الأكاديمية!',
                    package: targetPackage
                });
            } catch (actErr) {
                await connection.rollback();
                console.error('[checkNowPaymentsPayment:ActivationError]', actErr);
                return res.status(500).json({ error: 'فشل تفعيل الباقة: ' + actErr.message });
            } finally {
                connection.release();
            }
        }

        return res.json({
            status: 'waiting_payment',
            paymentStatus: statusData.paymentStatus,
            message: statusData.paymentStatus === 'sending' || statusData.paymentStatus === 'confirming'
                ? 'تم استلام المعاملة على البلوكشين وجاري تأكيدها...'
                : 'في انتظار وصول التحويل عبر شبكة USDT (BEP20)...'
        });
    } catch (err) {
        console.error('[checkNowPaymentsPayment]', err);
        res.status(500).json({ error: 'Failed to check payment status' });
    }
};


