const db = require('../config/db');
const crypto = require('crypto');
const genUuid = () => crypto.randomUUID();

/**
 * Get the full recursive downline user IDs for a given user.
 * Excludes the user itself.
 * Deduplicates to prevent any loops or double-counting.
 */
async function getDownlineUserIds(userId, conn = db) {
    const downlineIds = new Set();
    let currentLevelIds = [userId];

    // Traverse up to 50 levels deep to cover any network depth
    for (let depth = 0; depth < 50; depth++) {
        if (currentLevelIds.length === 0) break;

        const placeholders = currentLevelIds.map(() => '?').join(',');
        const [rows] = await conn.query(`
            SELECT id FROM users 
            WHERE referrer_id IN (${placeholders}) AND id != ?
        `, [...currentLevelIds, userId]);

        const nextLevelIds = [];
        for (const row of rows) {
            if (row.id !== userId && !downlineIds.has(row.id)) {
                downlineIds.add(row.id);
                nextLevelIds.push(row.id);
            }
        }
        currentLevelIds = nextLevelIds;
    }

    return Array.from(downlineIds);
}

/**
 * Calculate user's direct sales and total team turnover
 */
async function getUserSalesStats(userId, downlineUserIds, conn = db) {
    // 1. Direct active package purchases made by direct referrals
    const [directSalesRow] = await conn.query(`
        SELECT COUNT(DISTINCT up.id) AS direct_sales
        FROM users u
        JOIN user_packages up ON u.id = up.user_id
        WHERE u.referrer_id = ? AND up.status = 'active'
    `, [userId]);
    const directSales = Number(directSalesRow[0]?.direct_sales || 0);

    // 2. Team turnover:
    // Check active package sales from all downline members
    let downlinePackagesSum = 0;
    if (downlineUserIds.length > 0) {
        const placeholders = downlineUserIds.map(() => '?').join(',');
        const [packSumRow] = await conn.query(`
            SELECT COALESCE(SUM(p.price), 0) AS total_package_sales
            FROM user_packages up
            JOIN packages p ON up.package_id = p.id
            WHERE up.status = 'active' AND up.user_id IN (${placeholders})
        `, downlineUserIds);
        downlinePackagesSum = Number(packSumRow[0]?.total_package_sales || 0);
    }

    // Also check total commissions turnover record for this user:
    const [commRow] = await conn.query(`
        SELECT COALESCE(SUM(sale_amount), 0) AS comm_turnover
        FROM commissions
        WHERE recipient_id = ?
    `, [userId]);
    const commTurnover = Number(commRow[0]?.comm_turnover || 0);

    // Team Turnover is the maximum of downline package sales and commissions turnover
    const teamTurnover = Math.max(downlinePackagesSum, commTurnover);

    return { directSales, teamTurnover };
}

/**
 * Get map of user_id -> highest achieved rank level for downline members
 */
async function getDownlineAchievedRanks(downlineUserIds, conn = db) {
    const userMaxRankLevel = {};
    if (downlineUserIds.length === 0) return userMaxRankLevel;

    const placeholders = downlineUserIds.map(() => '?').join(',');
    const [achieverRows] = await conn.query(`
        SELECT la.user_id, r.level
        FROM leader_achievers la
        JOIN ranks r ON la.rank_id = r.id
        WHERE la.user_id IN (${placeholders})
    `, downlineUserIds);

    achieverRows.forEach(row => {
        const cur = userMaxRankLevel[row.user_id] || 0;
        if (row.level > cur) {
            userMaxRankLevel[row.user_id] = row.level;
        }
    });

    return userMaxRankLevel;
}

/**
 * Evaluate user's current rank, promote if eligible, and return progress towards next rank.
 * @param {string} userId - User ID to evaluate
 * @param {object} [existingConn] - Optional active DB connection/transaction
 * @param {boolean} [autoPromote=true] - Whether to grant promotion & credit reward in DB
 */
async function evaluateUserRankAndProgress(userId, existingConn = null, autoPromote = true) {
    const shouldRelease = !existingConn;
    const conn = existingConn || await db.getConnection();

    try {
        // Fetch all active ranks ordered by level ASC
        const [ranks] = await conn.query(`
            SELECT r.*, 
                   req.name AS required_rank_name, 
                   req.name_ar AS required_rank_name_ar,
                   req.level AS required_rank_level
            FROM ranks r
            LEFT JOIN ranks req ON r.required_rank_id = req.id
            WHERE r.is_active = 1
            ORDER BY r.level ASC
        `);

        const rankMapById = {};
        ranks.forEach(r => {
            rankMapById[r.id] = r;
        });

        // Get downline tree (excludes user itself, deduplicated)
        const downlineUserIds = await getDownlineUserIds(userId, conn);

        // Sales metrics
        const { directSales, teamTurnover } = await getUserSalesStats(userId, downlineUserIds, conn);

        // Achieved ranks map for downline members: { [user_id]: maxLevel }
        const downlineRankMap = await getDownlineAchievedRanks(downlineUserIds, conn);

        // Fetch user's existing achieved ranks from leader_achievers
        const [userAchievements] = await conn.query(`
            SELECT rank_id, reward_paid FROM leader_achievers WHERE user_id = ?
        `, [userId]);
        const achievedRankIds = new Set(userAchievements.map(a => a.rank_id));

        // Evaluate qualification for each rank
        let currentRank = ranks[0] || { level: 0, name: 'Member', name_ar: 'عضو مسجل', color_hex: '#64748b' };
        let nextRank = null;
        const newlyPromotedRanks = [];

        for (const r of ranks) {
            if (r.level === 0) continue; // Base member is always met

            // 1. Team Sales condition
            const salesMet = teamTurnover >= Number(r.min_team_turnover);

            // 2. Leadership condition
            let leadersMet = true;
            let currentLeadersCount = 0;
            const reqCount = Number(r.required_rank_count || 0);

            if (r.required_rank_id && reqCount > 0) {
                const targetRank = rankMapById[r.required_rank_id];
                const targetLevel = targetRank ? targetRank.level : 1;

                // Count distinct downline members who have achieved at least this required level
                for (const memberId of downlineUserIds) {
                    const memberLevel = downlineRankMap[memberId] || 0;
                    if (memberLevel >= targetLevel) {
                        currentLeadersCount++;
                    }
                }
                leadersMet = currentLeadersCount >= reqCount;
            }

            // 3. Condition Operator (AND vs OR)
            let isQualified = false;
            if (r.condition_operator === 'OR') {
                isQualified = salesMet || leadersMet;
            } else {
                isQualified = salesMet && leadersMet;
            }

            if (isQualified) {
                currentRank = r;
                // If user hasn't achieved this rank yet, schedule for promotion
                if (!achievedRankIds.has(r.id)) {
                    newlyPromotedRanks.push({
                        rank: r,
                        directSales,
                        teamTurnover,
                        leadersCount: currentLeadersCount
                    });
                }
            } else {
                // First rank that failed qualification is the nextRank
                if (!nextRank) {
                    nextRank = r;
                }
            }
        }

        // Execute promotions inside transaction if autoPromote is enabled and new promotions exist
        if (autoPromote && newlyPromotedRanks.length > 0) {
            let inTx = false;
            try {
                if (!existingConn) {
                    await conn.beginTransaction();
                    inTx = true;
                }

                for (const item of newlyPromotedRanks) {
                    const r = item.rank;
                    const rewardBonus = Number(r.reward_bonus || 0);

                    // Insert into leader_achievers (with IGNORE to be 100% idempotent)
                    const achieverId = genUuid();
                    const [insRes] = await conn.query(`
                        INSERT IGNORE INTO leader_achievers 
                        (id, user_id, rank_id, direct_sales_at_time, team_turnover_at_time, leaders_count_at_time, reward_amount, reward_paid, achieved_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
                    `, [
                        achieverId,
                        userId,
                        r.id,
                        item.directSales,
                        item.teamTurnover,
                        item.leadersCount,
                        rewardBonus,
                        rewardBonus > 0 ? 1 : 0
                    ]);

                    // If inserted successfully and reward > 0, credit user's wallet
                    if (insRes.affectedRows > 0 && rewardBonus > 0) {
                        // Lock wallet row
                        const [wallets] = await conn.query(`
                            SELECT * FROM user_wallets WHERE user_id = ? FOR UPDATE
                        `, [userId]);

                        let balBefore = 0;
                        if (wallets.length === 0) {
                            const newWId = genUuid();
                            await conn.query(`
                                INSERT INTO user_wallets (id, user_id, balance, pending_balance, total_earned, total_withdrawn)
                                VALUES (?, ?, ?, 0.00, ?, 0.00)
                            `, [newWId, userId, rewardBonus, rewardBonus]);
                            balBefore = 0;
                        } else {
                            balBefore = Number(wallets[0].balance || 0);
                            await conn.query(`
                                UPDATE user_wallets 
                                SET balance = balance + ?, total_earned = total_earned + ?
                                WHERE user_id = ?
                            `, [rewardBonus, rewardBonus, userId]);
                        }

                        const balAfter = balBefore + rewardBonus;

                        // Insert transaction log
                        const txId = genUuid();
                        await conn.query(`
                            INSERT INTO transactions (id, user_id, type, amount, currency, balance_before, balance_after, status, reference_id, description, metadata, created_at)
                            VALUES (?, ?, 'rank_reward', ?, 'USD', ?, ?, 'completed', ?, ?, ?, NOW())
                        `, [
                            txId,
                            userId,
                            rewardBonus,
                            balBefore,
                            balAfter,
                            `RANK-${r.level}-${r.id.substring(0, 8)}`,
                            `مكافأة الوصول لرتبة ${r.name_ar} (${r.name})`,
                            JSON.stringify({ rank_id: r.id, rank_name: r.name, rank_level: r.level, gift_name: r.gift_name })
                        ]);

                        // Update transaction_id in leader_achievers
                        await conn.query(`
                            UPDATE leader_achievers SET transaction_id = ? WHERE id = ?
                        `, [txId, achieverId]);

                        // Send in-app notification
                        const notifId = genUuid();
                        await conn.query(`
                            INSERT INTO notifications (id, user_id, title, content, type, is_read, created_at)
                            VALUES (?, ?, ?, ?, 'rank_promotion', 0, NOW())
                        `, [
                            notifId,
                            userId,
                            `تهانينا! لقد بلغت رتبة ${r.name_ar || r.name}`,
                            `تمت ترقيتك بنجاح إلى رتبة ${r.name_ar || r.name} (${r.name}) وحصلت على مكافأة نقدية بقيمة $${rewardBonus} USD بالإضافة إلى هدية ${r.gift_name || ''}!`
                        ]);
                    }
                }

                if (inTx) {
                    await conn.commit();
                }
            } catch (pErr) {
                if (inTx) await conn.rollback();
                console.error('[rankService.evaluateUserRankAndProgress.promotionError]', pErr);
            }
        }

        // Build detailed nextRank progress data
        let progress = null;
        if (nextRank) {
            const reqSales = Number(nextRank.min_team_turnover || 0);
            const salesCurrent = teamTurnover;
            const salesPercent = reqSales > 0 ? Math.min(100, Math.round((salesCurrent / reqSales) * 100)) : 100;
            const salesMet = salesCurrent >= reqSales;

            let leadershipInfo = null;
            let leadersPercent = 100;
            let leadersMet = true;

            if (nextRank.required_rank_id && Number(nextRank.required_rank_count || 0) > 0) {
                const targetRank = rankMapById[nextRank.required_rank_id];
                const targetLevel = targetRank ? targetRank.level : 1;
                const reqCount = Number(nextRank.required_rank_count);

                let curCount = 0;
                for (const memberId of downlineUserIds) {
                    const memberLevel = downlineRankMap[memberId] || 0;
                    if (memberLevel >= targetLevel) {
                        curCount++;
                    }
                }

                leadersPercent = reqCount > 0 ? Math.min(100, Math.round((curCount / reqCount) * 100)) : 100;
                leadersMet = curCount >= reqCount;

                leadershipInfo = {
                    requiredRankId: nextRank.required_rank_id,
                    requiredRankName: targetRank ? targetRank.name : '',
                    requiredRankNameAr: targetRank ? targetRank.name_ar : '',
                    requiredRankLevel: targetLevel,
                    requiredCount: reqCount,
                    currentCount: curCount,
                    percent: leadersPercent,
                    isMet: leadersMet
                };
            }

            const isAnd = nextRank.condition_operator !== 'OR';
            const overallPercent = isAnd 
                ? (leadershipInfo ? Math.round((salesPercent + leadersPercent) / 2) : salesPercent)
                : Math.max(salesPercent, leadersPercent);

            progress = {
                sales: {
                    current: salesCurrent,
                    required: reqSales,
                    percent: salesPercent,
                    isMet: salesMet
                },
                leadership: leadershipInfo,
                operator: nextRank.condition_operator || 'AND',
                overallPercent,
                isEligibleForPromotion: isAnd ? (salesMet && leadersMet) : (salesMet || leadersMet)
            };
        }

        // Enhance ranks array with user-specific achievement flags
        const enrichedRanks = ranks.map(rk => {
            const isCurrent = currentRank.level === rk.level;
            const isAchieved = currentRank.level >= rk.level && rk.level > 0;
            const isNext = nextRank && nextRank.level === rk.level;
            return {
                ...rk,
                isCurrent,
                isAchieved,
                isNext
            };
        });

        return {
            ranks: enrichedRanks,
            userStats: {
                directSales,
                teamTurnover,
                downlineCount: downlineUserIds.length,
                currentRank,
                nextRank,
                progress
            }
        };
    } finally {
        if (shouldRelease && conn) {
            conn.release();
        }
    }
}

module.exports = {
    getDownlineUserIds,
    getUserSalesStats,
    getDownlineAchievedRanks,
    evaluateUserRankAndProgress
};
