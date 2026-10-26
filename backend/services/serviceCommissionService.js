const crypto = require('crypto');

/**
 * Isolated Commission Processor for the Services section
 * Strict 10% to DIRECT referrer only (Generation 1).
 * Completely isolated from Package Commissions and 10-Generations matching bonus.
 */
class ServiceCommissionService {
    /**
     * Process 10% direct commission for a paid service order
     * @param {Object} connection - Active MySQL connection inside transaction
     * @param {Object} params - { orderId, orderNumber, buyerId, saleAmount, productName }
     */
    static async processDirectCommission(connection, { orderId, orderNumber, buyerId, saleAmount, productName }) {
        if (!orderId || !buyerId || !saleAmount || Number(saleAmount) <= 0) {
            return { processed: false, reason: 'Invalid parameters' };
        }

        // 1. Check if commission already processed (Idempotency check)
        const [existingOrder] = await connection.query(
            'SELECT commission_processed FROM service_orders WHERE id = ? FOR UPDATE',
            [orderId]
        );
        if (!existingOrder.length || existingOrder[0].commission_processed === 1) {
            return { processed: false, reason: 'Commission already processed' };
        }

        // 2. Check if already in service_commissions table
        const [existingComm] = await connection.query(
            'SELECT id FROM service_commissions WHERE order_id = ?',
            [orderId]
        );
        if (existingComm.length > 0) {
            await connection.query(
                'UPDATE service_orders SET commission_processed = 1 WHERE id = ?',
                [orderId]
            );
            return { processed: false, reason: 'Commission already recorded' };
        }

        // 3. Find the direct referrer (sponsor)
        const [buyerRows] = await connection.query(
            'SELECT referrer_id, username, email FROM users WHERE id = ?',
            [buyerId]
        );
        if (!buyerRows.length || !buyerRows[0].referrer_id) {
            // Buyer has no referrer -> mark processed and return
            await connection.query(
                'UPDATE service_orders SET commission_processed = 1 WHERE id = ?',
                [orderId]
            );
            return { processed: false, reason: 'No direct referrer' };
        }

        const referrerId = buyerRows[0].referrer_id;
        const buyerName = buyerRows[0].username || buyerRows[0].email;

        // 4. Verify referrer eligibility
        const [refRows] = await connection.query(
            'SELECT id, affiliate_status, affiliate_enabled, status FROM users WHERE id = ?',
            [referrerId]
        );
        if (!refRows.length || refRows[0].affiliate_status === 'suspended' || refRows[0].status !== 'active') {
            await connection.query(
                'UPDATE service_orders SET commission_processed = 1 WHERE id = ?',
                [orderId]
            );
            return { processed: false, reason: 'Referrer not eligible or suspended' };
        }

        // 5. Get commission rate from platform_settings (default 10%)
        const [rateRows] = await connection.query(
            "SELECT value FROM platform_settings WHERE `key` = 'service_commission_rate' LIMIT 1"
        );
        const ratePercentage = Number(rateRows[0]?.value || 10);
        const commissionAmount = Number(((saleAmount * ratePercentage) / 100).toFixed(2));

        if (commissionAmount <= 0) {
            await connection.query(
                'UPDATE service_orders SET commission_processed = 1 WHERE id = ?',
                [orderId]
            );
            return { processed: false, reason: 'Commission amount zero' };
        }

        // 6. Record in service_commissions table
        const commissionId = crypto.randomUUID();
        await connection.query(`
            INSERT INTO service_commissions 
            (id, order_id, recipient_id, buyer_id, rate_percentage, sale_amount, commission_amount, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'available')
        `, [commissionId, orderId, referrerId, buyerId, ratePercentage, saleAmount, commissionAmount]);

        // 7. Lock or create referrer wallet
        let [walletRows] = await connection.query(
            'SELECT id, balance, total_earned FROM user_wallets WHERE user_id = ? FOR UPDATE',
            [referrerId]
        );

        let balanceBefore = 0;
        let balanceAfter = 0;

        if (walletRows.length === 0) {
            const walletId = crypto.randomUUID();
            balanceBefore = 0;
            balanceAfter = commissionAmount;
            await connection.query(`
                INSERT INTO user_wallets (id, user_id, balance, total_earned)
                VALUES (?, ?, ?, ?)
            `, [walletId, referrerId, balanceAfter, balanceAfter]);
        } else {
            balanceBefore = Number(walletRows[0].balance);
            balanceAfter = balanceBefore + commissionAmount;
            await connection.query(`
                UPDATE user_wallets 
                SET balance = balance + ?, 
                    total_earned = total_earned + ?,
                    updated_at = NOW()
                WHERE user_id = ?
            `, [commissionAmount, commissionAmount, referrerId]);
        }

        // 8. Record in transactions ledger
        const transactionId = crypto.randomUUID();
        const txDesc = `عمولة مبيعات خدمات (10%) - طلب رقم #${orderNumber} (${productName || 'خدمة'})`;
        await connection.query(`
            INSERT INTO transactions 
            (id, user_id, type, amount, currency, balance_before, balance_after, status, reference_id, description, metadata)
            VALUES (?, ?, 'service_commission', ?, 'USD', ?, ?, 'completed', ?, ?, ?)
        `, [
            transactionId, 
            referrerId, 
            commissionAmount, 
            balanceBefore, 
            balanceAfter,
            `SCOM-${orderId}`, // distinct from the buyer's purchase reference (transactions.reference_id is UNIQUE)
            txDesc,
            JSON.stringify({ order_id: orderId, buyer_id: buyerId, rate_percentage: ratePercentage, sale_amount: saleAmount })
        ]);

        // 9. Mark order commission as processed
        await connection.query(
            'UPDATE service_orders SET commission_processed = 1 WHERE id = ?',
            [orderId]
        );

        // 10. Send notification to direct referrer
        const notifId = crypto.randomUUID();
        await connection.query(`
            INSERT INTO notifications (id, user_id, type, title, content, reference_id, reference_type, is_read)
            VALUES (?, ?, 'commission', 'عمولة خدمة جديدة!', ?, ?, 'service_order', 0)
        `, [
            notifId,
            referrerId,
            `تهانينا! لقد حصلت على عمولة مباشرة بقيمة $${commissionAmount} (10%) من شراء العضو ${buyerName} لـ "${productName || 'خدمة'}" (طلب #${orderNumber}).`,
            orderId
        ]);

        return {
            processed: true,
            commissionId,
            referrerId,
            commissionAmount,
            ratePercentage
        };
    }
}

module.exports = ServiceCommissionService;
