const db = require('../config/db');
const crypto = require('crypto');
const PayPalService = require('../services/paypalService');
const ServiceCommissionService = require('../services/serviceCommissionService');

function generateOrderNumber() {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `SRV-${dateStr}-${rand}`;
}

// --- PUBLIC & STUDENT ENDPOINTS ---

// 1. Get all active service categories
exports.getCategories = async (req, res) => {
    try {
        const [categories] = await db.query(`
            SELECT id, name, name_ar, name_fr, slug, type, description, description_ar, icon_url, sort_order
            FROM service_categories
            WHERE is_active = 1
            ORDER BY sort_order ASC, name ASC
        `);
        res.json({ success: true, data: categories });
    } catch (err) {
        console.error('Error in getCategories:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch categories', error: err.message });
    }
};

// 2. Get published products (with filters & search)
exports.getProducts = async (req, res) => {
    try {
        const { category_slug, category_id, search, limit = 50, offset = 0 } = req.query;

        let query = `
            SELECT 
                p.id, p.category_id, p.name, p.name_ar, p.name_fr, p.slug, 
                p.description, p.description_ar, p.logo_url, p.images, p.features,
                p.delivery_info, p.delivery_info_ar, p.requires_email, p.status, p.sort_order,
                c.name as category_name, c.name_ar as category_name_ar, c.slug as category_slug, c.type as category_type,
                MIN(o.price) as min_price,
                MAX(o.price) as max_price,
                COUNT(o.id) as offers_count
            FROM service_products p
            JOIN service_categories c ON p.category_id = c.id
            LEFT JOIN service_offers o ON p.id = o.product_id AND o.is_active = 1
            WHERE p.status = 'published' AND c.is_active = 1
        `;
        const params = [];

        if (category_slug) {
            query += ` AND c.slug = ?`;
            params.push(category_slug);
        } else if (category_id) {
            query += ` AND p.category_id = ?`;
            params.push(category_id);
        }

        if (search) {
            query += ` AND (p.name LIKE ? OR p.name_ar LIKE ? OR p.description LIKE ? OR p.description_ar LIKE ?)`;
            const s = `%${search}%`;
            params.push(s, s, s, s);
        }

        query += ` GROUP BY p.id ORDER BY p.sort_order ASC, p.created_at DESC LIMIT ? OFFSET ?`;
        params.push(Number(limit), Number(offset));

        const [products] = await db.query(query, params);

        // Parse features and images if stored as JSON
        const formatted = products.map(p => ({
            ...p,
            images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images || [],
            features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features || []
        }));

        res.json({ success: true, data: formatted });
    } catch (err) {
        console.error('Error in getProducts:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch products', error: err.message });
    }
};

// 3. Get single product by slug
exports.getProductBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const [productRows] = await db.query(`
            SELECT 
                p.*,
                c.name as category_name, c.name_ar as category_name_ar, c.slug as category_slug, c.type as category_type
            FROM service_products p
            JOIN service_categories c ON p.category_id = c.id
            WHERE p.slug = ? AND p.status = 'published'
            LIMIT 1
        `, [slug]);

        if (productRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const product = productRows[0];
        product.images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images || [];
        product.features = typeof product.features === 'string' ? JSON.parse(product.features) : product.features || [];

        // Fetch active offers
        const [offers] = await db.query(`
            SELECT id, product_id, label, label_ar, duration_months, price, currency, stock_quantity, sort_order
            FROM service_offers
            WHERE product_id = ? AND is_active = 1
            ORDER BY sort_order ASC, price ASC
        `, [product.id]);

        product.offers = offers;

        res.json({ success: true, data: product });
    } catch (err) {
        console.error('Error in getProductBySlug:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch product details', error: err.message });
    }
};

// 4. Public settings for Services (WhatsApp support, PayPal client ID, etc.)
exports.getPublicSettings = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT \`key\`, value 
            FROM platform_settings 
            WHERE \`key\` IN ('support_whatsapp_number', 'paypal_enabled', 'paypal_client_id', 'paypal_mode', 'service_commission_rate')
        `);

        const settings = {
            support_whatsapp_number: '+212600000000',
            paypal_enabled: true,
            paypal_client_id: '',
            paypal_mode: 'sandbox',
            service_commission_rate: 10
        };

        rows.forEach(r => {
            if (r.key === 'support_whatsapp_number') settings.support_whatsapp_number = r.value;
            if (r.key === 'paypal_enabled') settings.paypal_enabled = r.value !== '0';
            if (r.key === 'paypal_client_id') settings.paypal_client_id = r.value;
            if (r.key === 'paypal_mode') settings.paypal_mode = r.value;
            if (r.key === 'service_commission_rate') settings.service_commission_rate = Number(r.value || 10);
        });

        res.json({ success: true, data: settings });
    } catch (err) {
        console.error('Error in getPublicSettings:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch settings', error: err.message });
    }
};

// 5. Purchase via Wallet balance
exports.createWalletOrder = async (req, res) => {
    const userId = req.user.id;
    const { offerId, activationEmail } = req.body;

    if (!offerId) {
        return res.status(400).json({ success: false, message: 'Offer ID is required' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Fetch and validate Offer & Product
        const [offerRows] = await connection.query(`
            SELECT o.*, p.id as p_id, p.name as p_name, p.name_ar as p_name_ar, p.requires_email, p.status as p_status
            FROM service_offers o
            JOIN service_products p ON o.product_id = p.id
            WHERE o.id = ? AND o.is_active = 1
            LIMIT 1
            FOR UPDATE
        `, [offerId]);

        if (offerRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Offer not found or no longer active' });
        }

        const offer = offerRows[0];
        if (offer.p_status !== 'published') {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Product is currently not available' });
        }

        if (offer.requires_email && !activationEmail) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Activation email is required for this service' });
        }

        const price = Number(offer.price);

        // 2. Lock & check user wallet
        const [walletRows] = await connection.query(
            'SELECT id, balance FROM user_wallets WHERE user_id = ? FOR UPDATE',
            [userId]
        );

        if (walletRows.length === 0 || Number(walletRows[0].balance) < price) {
            await connection.rollback();
            const currentBal = walletRows.length > 0 ? Number(walletRows[0].balance) : 0;
            return res.status(400).json({ 
                success: false, 
                message: 'رصيد المحفظة غير كافٍ لإتمام عملية الشراء', 
                currentBalance: currentBal,
                requiredAmount: price 
            });
        }

        const balanceBefore = Number(walletRows[0].balance);
        const balanceAfter = balanceBefore - price;

        // 3. Deduct from wallet
        await connection.query(
            'UPDATE user_wallets SET balance = ?, updated_at = NOW() WHERE user_id = ?',
            [balanceAfter, userId]
        );

        // 4. Create Order
        const orderId = crypto.randomUUID();
        const orderNumber = generateOrderNumber();
        const transactionId = crypto.randomUUID();

        await connection.query(`
            INSERT INTO service_orders (
                id, order_number, user_id, product_id, offer_id,
                activation_email, price_at_purchase, currency, status,
                payment_method, payment_reference, transaction_id, commission_processed
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'USD', 'paid', 'wallet', 'Internal Wallet', ?, 0)
        `, [orderId, orderNumber, userId, offer.product_id, offer.id, activationEmail || null, price, transactionId]);

        // 5. Record wallet transaction
        const desc = `شراء خدمة: ${offer.p_name_ar || offer.p_name} (${offer.label_ar || offer.label}) - طلب #${orderNumber}`;
        await connection.query(`
            INSERT INTO transactions (
                id, user_id, type, amount, currency, balance_before, balance_after,
                status, reference_id, description, metadata
            ) VALUES (?, ?, 'service_purchase', ?, 'USD', ?, ?, 'completed', ?, ?, ?)
        `, [
            transactionId, 
            userId, 
            price, 
            balanceBefore, 
            balanceAfter, 
            orderId, 
            desc, 
            JSON.stringify({ order_id: orderId, order_number: orderNumber, offer_id: offer.id })
        ]);

        // 6. Record order log
        await connection.query(`
            INSERT INTO service_order_logs (id, order_id, changed_by, old_status, new_status, note)
            VALUES (?, ?, ?, 'pending_payment', 'paid', 'تم الدفع بنجاح عبر رصيد المحفظة')
        `, [crypto.randomUUID(), orderId, userId]);

        // 7. Process isolated 10% direct referrer commission
        await ServiceCommissionService.processDirectCommission(connection, {
            orderId,
            orderNumber,
            buyerId: userId,
            saleAmount: price,
            productName: offer.p_name_ar || offer.p_name
        });

        // 8. Send notification to buyer
        await connection.query(`
            INSERT INTO notifications (id, user_id, type, title, content, reference_id, reference_type, is_read)
            VALUES (?, ?, 'order', 'تم استلام طلبك بنجاح!', ?, ?, 'service_order', 0)
        `, [
            crypto.randomUUID(),
            userId,
            `تم استلام طلبك رقم #${orderNumber} لخدمة "${offer.p_name_ar || offer.p_name}". جاري مراجعة الطلب وتجهيز بيانات التسليم من قبل الإدارة.`,
            orderId
        ]);

        await connection.commit();

        res.json({
            success: true,
            message: 'تمت عملية الشراء بنجاح',
            data: {
                orderId,
                orderNumber,
                price,
                status: 'paid'
            }
        });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Error in createWalletOrder:', err);
        res.status(500).json({ success: false, message: 'Failed to process order', error: err.message });
    } finally {
        if (connection) connection.release();
    }
};

// 6. Create PayPal Order
exports.createPayPalOrder = async (req, res) => {
    const userId = req.user.id;
    const { offerId, activationEmail } = req.body;

    if (!offerId) {
        return res.status(400).json({ success: false, message: 'Offer ID is required' });
    }

    try {
        // Fetch offer & product
        const [offerRows] = await db.query(`
            SELECT o.*, p.name as p_name, p.name_ar as p_name_ar, p.requires_email, p.status as p_status
            FROM service_offers o
            JOIN service_products p ON o.product_id = p.id
            WHERE o.id = ? AND o.is_active = 1
            LIMIT 1
        `, [offerId]);

        if (offerRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Offer not found or no longer active' });
        }

        const offer = offerRows[0];
        if (offer.p_status !== 'published') {
            return res.status(400).json({ success: false, message: 'Product is currently not available' });
        }

        if (offer.requires_email && !activationEmail) {
            return res.status(400).json({ success: false, message: 'Activation email is required for this service' });
        }

        const price = Number(offer.price);

        // Check for existing pending order for this user and offer to avoid duplicate entries
        const [existingPending] = await db.query(`
            SELECT id, order_number 
            FROM service_orders 
            WHERE user_id = ? AND offer_id = ? AND status = 'pending_payment'
            ORDER BY created_at DESC 
            LIMIT 1
        `, [userId, offer.id]);

        let orderId;
        let orderNumber;

        if (existingPending.length > 0) {
            orderId = existingPending[0].id;
            orderNumber = existingPending[0].order_number;
        } else {
            orderId = crypto.randomUUID();
            orderNumber = generateOrderNumber();
        }

        // Determine public host URL for redirection
        const protocol = (req.get('x-forwarded-proto') || req.protocol || 'https');
        const host = req.get('x-forwarded-host') || req.get('host') || 'nexyvora.net';
        const clientOrigin = `${protocol}://${host}`;

        // Create PayPal order via API v2
        const paypalOrder = await PayPalService.createOrder({
            amount: price,
            currency: 'USD',
            orderNumber,
            description: `${offer.p_name} - ${offer.label}`,
            returnUrl: `${clientOrigin}/student/services/my-orders?paypal_success=1&orderId=${orderId}`,
            cancelUrl: `${clientOrigin}/student/services`
        });

        // Find approve link from PayPal response
        const approveUrl = paypalOrder.links?.find(l => l.rel === 'approve' || l.rel === 'payer-action')?.href;

        if (existingPending.length > 0) {
            // Update existing pending order with newest payment reference and activation email
            await db.query(`
                UPDATE service_orders 
                SET activation_email = ?, price_at_purchase = ?, payment_reference = ?, updated_at = NOW()
                WHERE id = ?
            `, [activationEmail || null, price, paypalOrder.id, orderId]);

            await db.query(`
                INSERT INTO service_order_logs (id, order_id, changed_by, old_status, new_status, note)
                VALUES (?, ?, ?, 'pending_payment', 'pending_payment', ?)
            `, [crypto.randomUUID(), orderId, userId, `تحديث جلسة دفع PayPal (ID: ${paypalOrder.id})`]);
        } else {
            // Insert pending order into database
            await db.query(`
                INSERT INTO service_orders (
                    id, order_number, user_id, product_id, offer_id,
                    activation_email, price_at_purchase, currency, status,
                    payment_method, payment_reference, commission_processed
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'USD', 'pending_payment', 'paypal', ?, 0)
            `, [orderId, orderNumber, userId, offer.product_id, offer.id, activationEmail || null, price, paypalOrder.id]);

            await db.query(`
                INSERT INTO service_order_logs (id, order_id, changed_by, old_status, new_status, note)
                VALUES (?, ?, ?, NULL, 'pending_payment', ?)
            `, [crypto.randomUUID(), orderId, userId, `إنشاء طلب دفع PayPal (ID: ${paypalOrder.id})`]);
        }

        res.json({
            success: true,
            data: {
                orderId,
                orderNumber,
                paypalOrderId: paypalOrder.id,
                approveUrl,
                price
            }
        });
    } catch (err) {
        console.error('Error in createPayPalOrder:', err);
        res.status(500).json({ success: false, message: 'Failed to create PayPal order', error: err.message });
    }
};

// 7. Capture PayPal Order upon client approval
exports.capturePayPalOrder = async (req, res) => {
    const userId = req.user.id;
    const { orderId, paypalOrderId } = req.body;

    if (!orderId || !paypalOrderId) {
        return res.status(400).json({ success: false, message: 'orderId and paypalOrderId are required' });
    }

    let connection;
    try {
        // Fetch order to verify ownership and pending status
        const [orderRows] = await db.query(`
            SELECT o.*, p.name as p_name, p.name_ar as p_name_ar
            FROM service_orders o
            JOIN service_products p ON o.product_id = p.id
            WHERE o.id = ? AND o.user_id = ?
            LIMIT 1
        `, [orderId, userId]);

        if (orderRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const order = orderRows[0];
        if (order.status === 'paid' || order.status === 'completed' || order.status === 'delivered') {
            return res.json({ success: true, message: 'Order is already paid', data: { orderNumber: order.order_number } });
        }

        // Call PayPal capture
        const captureData = await PayPalService.captureOrder(paypalOrderId);

        if (captureData.status !== 'COMPLETED') {
            return res.status(400).json({ 
                success: false, 
                message: `PayPal payment not completed. Status: ${captureData.status}` 
            });
        }

        const captureId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id || paypalOrderId;

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Update order status to paid
        await connection.query(`
            UPDATE service_orders 
            SET status = 'paid', 
                payment_reference = ?,
                updated_at = NOW()
            WHERE id = ?
        `, [captureId, orderId]);

        // Log status change
        await connection.query(`
            INSERT INTO service_order_logs (id, order_id, changed_by, old_status, new_status, note)
            VALUES (?, ?, ?, 'pending_payment', 'paid', ?)
        `, [crypto.randomUUID(), orderId, userId, `تم تأكيد دفع PayPal بنجاح (Capture ID: ${captureId})`]);

        // Process 10% direct commission
        await ServiceCommissionService.processDirectCommission(connection, {
            orderId,
            orderNumber: order.order_number,
            buyerId: userId,
            saleAmount: Number(order.price_at_purchase),
            productName: order.p_name_ar || order.p_name
        });

        // Notify user
        await connection.query(`
            INSERT INTO notifications (id, user_id, type, title, content, reference_id, reference_type, is_read)
            VALUES (?, ?, 'order', 'تم استلام الدفع بنجاح!', ?, ?, 'service_order', 0)
        `, [
            crypto.randomUUID(),
            userId,
            `تم تأكيد دفع طلبك رقم #${order.order_number} بنجاح عبر PayPal. جاري مراجعة الطلب من الإدارة لتسليم الخدمة يدوياً.`,
            orderId
        ]);

        await connection.commit();

        res.json({
            success: true,
            message: 'تم تأكيد الدفع واستلام الطلب بنجاح',
            data: {
                orderId,
                orderNumber: order.order_number,
                status: 'paid'
            }
        });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Error in capturePayPalOrder:', err);
        res.status(500).json({ success: false, message: 'Failed to capture PayPal payment', error: err.message });
    } finally {
        if (connection) connection.release();
    }
};

// 8. Get current user's service orders
exports.getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const [orders] = await db.query(`
            SELECT 
                o.id, o.order_number, o.price_at_purchase, o.currency, o.status,
                o.payment_method, o.activation_email, o.delivery_notes,
                o.created_at, o.updated_at,
                p.name as product_name, p.name_ar as product_name_ar, p.slug as product_slug, p.logo_url,
                off.label as offer_label, off.label_ar as offer_label_ar, off.duration_months
            FROM service_orders o
            JOIN service_products p ON o.product_id = p.id
            JOIN service_offers off ON o.offer_id = off.id
            WHERE o.user_id = ? AND o.status != 'pending_payment'
            ORDER BY o.created_at DESC
        `, [userId]);

        res.json({ success: true, data: orders });
    } catch (err) {
        console.error('Error in getMyOrders:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch user orders', error: err.message });
    }
};

// 9. Get details of a single order owned by user
exports.getMyOrderById = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const [orderRows] = await db.query(`
            SELECT 
                o.*,
                p.name as product_name, p.name_ar as product_name_ar, p.slug as product_slug, p.logo_url, p.delivery_info_ar,
                off.label as offer_label, off.label_ar as offer_label_ar, off.duration_months
            FROM service_orders o
            JOIN service_products p ON o.product_id = p.id
            JOIN service_offers off ON o.offer_id = off.id
            WHERE o.id = ? AND o.user_id = ?
            LIMIT 1
        `, [id, userId]);

        if (orderRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const order = orderRows[0];

        // Fetch logs
        const [logs] = await db.query(`
            SELECT old_status, new_status, note, created_at
            FROM service_order_logs
            WHERE order_id = ?
            ORDER BY created_at ASC
        `, [id]);

        order.logs = logs;

        res.json({ success: true, data: order });
    } catch (err) {
        console.error('Error in getMyOrderById:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch order details', error: err.message });
    }
};
