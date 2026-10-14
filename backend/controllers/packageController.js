const db = require('../config/db');
const crypto = require('crypto');
const emailService = require('../services/emailService');

function genUuid() {
    return crypto.randomUUID();
}

/**
 * Helper to compute effective unlocked generations for a user.
 * Formula: Math.max(packageUnlockedGenerations, rankUnlockedGenerations)
 * Packages:
 *   - CORE ($30): 0 gens
 *   - FLOW ($150): 1 gen (G1)
 *   - GROW ($500): 2 gens (G1+G2)
 *   - PRIME ($1000): 3 gens (G1+G2+G3)
 * Ranks:
 *   - Level 0 (Member): 0 gens
 *   - Level 1 (Bronze): 2 gens (G1+G2)
 *   - Level 2 (Silver): 3 gens (G1+G2+G3)
 *   - Level 3 (Gold): 4 gens (G1+G2+G3+G4)
 *   - Level 4 (Platinum): 6 gens (G1..G6)
 *   - Level 5 (Diamond VIP): 10 gens (G1..G10)
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
async function processPackageActivation(connection, { userPackageId, userId, targetPackage, saleAmount, upgradedFromId, paymentMethod, paymentReference }) {
    // 1. Update user_package status to 'active'
    await connection.query(`
        UPDATE user_packages 
        SET status = 'active', is_current = 1, amount_paid = ?,
            purchased_at = CURRENT_TIMESTAMP, 
            expires_at = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 YEAR)
        WHERE id = ?
    `, [saleAmount, userPackageId]);

    // If upgrading, set any previous active packages for this user to upgraded
    if (upgradedFromId) {
        await connection.query(`
            UPDATE user_packages 
            SET status = 'upgraded', is_current = 0 
            WHERE user_id = ? AND id != ? AND status = 'active'
        `, [userId, userPackageId]);
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
        // Find currently active package for user (valid within 1-year subscription window)
        const [userPackages] = await db.query(`
            SELECT up.*, p.name AS package_name, p.name_ar AS package_name_ar, 
                   p.slug, p.price AS package_original_price, p.level, p.features, p.badge_text,
                   p.unlocked_generations
            FROM user_packages up
            JOIN packages p ON up.package_id = p.id
            WHERE up.user_id = ? AND up.status = 'active' AND (up.expires_at IS NULL OR up.expires_at > CURRENT_TIMESTAMP)
            ORDER BY p.level DESC
            LIMIT 1
        `, [userId]);

        const current = userPackages[0] || null;
        if (current && typeof current.features === 'string') {
            current.features = JSON.parse(current.features || '[]');
        }

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

        // Available upgrade options (packages of higher level)
        let upgrades = [];
        if (current) {
            const [availableUpgrades] = await db.query(`
                SELECT p.*, (p.price - ?) AS upgrade_price
                FROM packages p
                WHERE p.level > ? AND p.is_active = 1
                ORDER BY p.level ASC
            `, [current.package_original_price, current.level]);

            upgrades = availableUpgrades.map(pkg => ({
                ...pkg,
                upgrade_price: Math.max(0, Number(pkg.upgrade_price)),
                features: typeof pkg.features === 'string' ? JSON.parse(pkg.features || '[]') : (pkg.features || [])
            }));
        } else {
            // All packages available to purchase
            const [allPkgs] = await db.query('SELECT * FROM packages WHERE is_active = 1 ORDER BY level ASC');
            upgrades = allPkgs.map(pkg => ({
                ...pkg,
                upgrade_price: Number(pkg.price),
                features: typeof pkg.features === 'string' ? JSON.parse(pkg.features || '[]') : (pkg.features || [])
            }));
        }

        res.json({ 
            currentPackage: current, 
            hasActivePackage: !!current, 
            pendingPackage: pending, 
            availableUpgrades: upgrades 
        });
    } catch (err) {
        console.error('[getMyPackage]', err);
        res.status(500).json({ error: 'Failed to fetch user package' });
    }
};

/**
 * Purchase or Upgrade a package (with transaction safety & 5-Generation Affiliate Commission Distribution)
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

        // 2. Check current active package
        const [currentActive] = await connection.query(`
            SELECT up.*, p.price AS current_price, p.level AS current_level
            FROM user_packages up
            JOIN packages p ON up.package_id = p.id
            WHERE up.user_id = ? AND up.status = 'active'
            ORDER BY p.level DESC
            LIMIT 1
        `, [userId]);

        let saleAmount = Number(targetPackage.price);
        let upgradedFromId = null;

        if (currentActive.length > 0) {
            const current = currentActive[0];

            if (current.package_id === targetPackage.id) {
                await connection.rollback();
                return res.status(400).json({ error: 'You already have this package active' });
            }

            if (targetPackage.level <= current.current_level) {
                await connection.rollback();
                return res.status(400).json({ error: 'Cannot downgrade to a lower or equal package' });
            }

            // Upgrade price difference
            saleAmount = Math.max(0, Number(targetPackage.price) - Number(current.current_price));
            upgradedFromId = current.package_id;
        }

        // 3. Handle Wallet vs Manual (Bank / USDT) Payment Methods
        const isWalletPayment = (paymentMethod === 'wallet');
        let paymentRefToSave = paymentReference;

        if (isWalletPayment) {
            // Check wallet balance
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
                upgradedFromId ? `ترقية باقة من رصيد المحفظة إلى ${targetPackage.name_ar || targetPackage.name}` : `شراء باقة من رصيد المحفظة: ${targetPackage.name_ar || targetPackage.name}`,
                JSON.stringify({ packageId: targetPackage.id, paymentMethod: 'wallet', isUpgrade: !!upgradedFromId })
            ]);

            // Create active user_package entry
            const newUserPackageId = genUuid();
            await connection.query(`
                INSERT INTO user_packages (id, user_id, package_id, amount_paid, payment_method, payment_reference, receipt_url, notes, status, is_current, upgraded_from_package_id, purchased_at, expires_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, ?, CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 YEAR))
            `, [newUserPackageId, userId, targetPackage.id, saleAmount, paymentMethod, paymentRefToSave, receiptUrl, notes, upgradedFromId]);

            // Process activation (courses, commissions, notifications)
            const { distributedCommissions } = await processPackageActivation(connection, {
                userPackageId: newUserPackageId,
                userId,
                targetPackage,
                saleAmount,
                upgradedFromId,
                paymentMethod: 'wallet',
                paymentReference: paymentRefToSave
            });

            await connection.commit();

            return res.json({
                message: upgradedFromId ? 'تم ترقية الباقة بنجاح من رصيد المحفظة!' : 'تم شراء وتفعيل الباقة بنجاح من رصيد المحفظة!',
                status: 'active',
                package: targetPackage,
                amountPaid: saleAmount,
                isUpgrade: !!upgradedFromId,
                commissionsDistributed: distributedCommissions.length
            });
        } else {
            // Non-wallet payment (USDT, Bank Transfer): Create PENDING request
            paymentRefToSave = paymentReference || `PKG-${Date.now()}`;

            // Check if user already has a pending package request for this or another package; if so, we can update or create
            const [existingPending] = await connection.query(`
                SELECT id FROM user_packages WHERE user_id = ? AND status = 'pending'
            `, [userId]);

            let targetUserPackageId = genUuid();
            if (existingPending.length > 0) {
                targetUserPackageId = existingPending[0].id;
                await connection.query(`
                    UPDATE user_packages 
                    SET package_id = ?, amount_paid = ?, payment_method = ?, payment_reference = ?,
                        receipt_url = ?, notes = ?, upgraded_from_package_id = ?, purchased_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `, [targetPackage.id, saleAmount, paymentMethod, paymentRefToSave, receiptUrl, notes, upgradedFromId, targetUserPackageId]);
            } else {
                await connection.query(`
                    INSERT INTO user_packages (id, user_id, package_id, amount_paid, payment_method, payment_reference, receipt_url, notes, status, is_current, upgraded_from_package_id, purchased_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?, CURRENT_TIMESTAMP)
                `, [targetUserPackageId, userId, targetPackage.id, saleAmount, paymentMethod, paymentRefToSave, receiptUrl, notes, upgradedFromId]);
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
                upgradedFromId ? `طلب ترقية باقة (${paymentMethod}) إلى ${targetPackage.name_ar || targetPackage.name} [قيد المراجعة]` : `طلب تفعيل باقة (${paymentMethod}): ${targetPackage.name_ar || targetPackage.name} [قيد المراجعة]`,
                JSON.stringify({ packageId: targetPackage.id, paymentMethod, receiptUrl, notes, isUpgrade: !!upgradedFromId, userPackageId: targetUserPackageId })
            ]);

            // Notify admin / log
            const notifId = genUuid();
            await connection.query(`
                INSERT INTO notifications (id, user_id, title, content, type, is_read, created_at)
                VALUES (?, ?, 'تم استلام طلب تفعيل الباقة', ?, 'package', 0, CURRENT_TIMESTAMP)
            `, [notifId, userId, `تم استلام طلب تفعيل باقة ${targetPackage.name_ar || targetPackage.name} بنجاح وإرفاق وصل التحويل. طلبك الآن قيد المراجعة والتدقيق وسوف يتم تفعيل حسابك فور مراجعة الإدارة.`]);

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

