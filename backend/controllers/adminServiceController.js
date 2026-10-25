const db = require('../config/db');
const crypto = require('crypto');

// --- CATEGORIES MANAGEMENT ---

exports.adminGetCategories = async (req, res) => {
    try {
        const [categories] = await db.query(`
            SELECT c.*, COUNT(p.id) as products_count
            FROM service_categories c
            LEFT JOIN service_products p ON c.id = p.category_id
            GROUP BY c.id
            ORDER BY c.sort_order ASC, c.name ASC
        `);
        res.json({ success: true, data: categories });
    } catch (err) {
        console.error('Error in adminGetCategories:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch categories', error: err.message });
    }
};

exports.adminCreateCategory = async (req, res) => {
    try {
        const { name, name_ar, name_fr, slug, type, description, description_ar, icon_url, sort_order = 0, is_active = 1 } = req.body;

        if (!name || !name_ar || !slug || !type) {
            return res.status(400).json({ success: false, message: 'name, name_ar, slug, and type are required' });
        }

        const id = crypto.randomUUID();
        await db.query(`
            INSERT INTO service_categories 
            (id, name, name_ar, name_fr, slug, type, description, description_ar, icon_url, sort_order, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [id, name, name_ar, name_fr || null, slug, type, description || null, description_ar || null, icon_url || null, sort_order, is_active]);

        res.json({ success: true, message: 'Category created successfully', data: { id, slug } });
    } catch (err) {
        console.error('Error in adminCreateCategory:', err);
        res.status(500).json({ success: false, message: 'Failed to create category', error: err.message });
    }
};

exports.adminUpdateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, name_ar, name_fr, slug, type, description, description_ar, icon_url, sort_order, is_active } = req.body;

        await db.query(`
            UPDATE service_categories
            SET name = COALESCE(?, name),
                name_ar = COALESCE(?, name_ar),
                name_fr = COALESCE(?, name_fr),
                slug = COALESCE(?, slug),
                type = COALESCE(?, type),
                description = COALESCE(?, description),
                description_ar = COALESCE(?, description_ar),
                icon_url = COALESCE(?, icon_url),
                sort_order = COALESCE(?, sort_order),
                is_active = COALESCE(?, is_active),
                updated_at = NOW()
            WHERE id = ?
        `, [name, name_ar, name_fr, slug, type, description, description_ar, icon_url, sort_order, is_active, id]);

        res.json({ success: true, message: 'Category updated successfully' });
    } catch (err) {
        console.error('Error in adminUpdateCategory:', err);
        res.status(500).json({ success: false, message: 'Failed to update category', error: err.message });
    }
};

exports.adminDeleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const [products] = await db.query('SELECT id FROM service_products WHERE category_id = ? LIMIT 1', [id]);
        if (products.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'لا يمكن حذف الفئة لأنها تحتوي على منتجات مرتبطة بها. قم بنقل المنتجات أو حذفها أولاً.' 
            });
        }

        await db.query('DELETE FROM service_categories WHERE id = ?', [id]);
        res.json({ success: true, message: 'Category deleted successfully' });
    } catch (err) {
        console.error('Error in adminDeleteCategory:', err);
        res.status(500).json({ success: false, message: 'Failed to delete category', error: err.message });
    }
};

// --- PRODUCTS MANAGEMENT ---

exports.adminGetProducts = async (req, res) => {
    try {
        const { category_id, status, search } = req.query;

        let query = `
            SELECT 
                p.*,
                c.name as category_name, c.name_ar as category_name_ar, c.slug as category_slug,
                COUNT(DISTINCT o.id) as offers_count,
                COUNT(DISTINCT ord.id) as orders_count,
                COALESCE(SUM(CASE WHEN ord.status IN ('paid', 'delivered', 'completed') THEN ord.price_at_purchase ELSE 0 END), 0) as total_revenue
            FROM service_products p
            JOIN service_categories c ON p.category_id = c.id
            LEFT JOIN service_offers o ON p.id = o.product_id
            LEFT JOIN service_orders ord ON p.id = ord.product_id
            WHERE 1=1
        `;
        const params = [];

        if (category_id) {
            query += ` AND p.category_id = ?`;
            params.push(category_id);
        }
        if (status) {
            query += ` AND p.status = ?`;
            params.push(status);
        }
        if (search) {
            query += ` AND (p.name LIKE ? OR p.name_ar LIKE ? OR p.slug LIKE ?)`;
            const s = `%${search}%`;
            params.push(s, s, s);
        }

        query += ` GROUP BY p.id ORDER BY p.sort_order ASC, p.created_at DESC`;

        const [products] = await db.query(query, params);

        // Fetch offers for each product
        for (const prod of products) {
            prod.images = typeof prod.images === 'string' ? JSON.parse(prod.images) : prod.images || [];
            prod.features = typeof prod.features === 'string' ? JSON.parse(prod.features) : prod.features || [];
            const [offers] = await db.query(`
                SELECT * FROM service_offers WHERE product_id = ? ORDER BY sort_order ASC, price ASC
            `, [prod.id]);
            prod.offers = offers;
        }

        res.json({ success: true, data: products });
    } catch (err) {
        console.error('Error in adminGetProducts:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch products', error: err.message });
    }
};

exports.adminCreateProduct = async (req, res) => {
    const adminId = req.user.id;
    let connection;
    try {
        const {
            category_id, name, name_ar, name_fr, slug,
            description, description_ar, logo_url, images, features,
            delivery_info, delivery_info_ar, requires_email = 0,
            status = 'published', sort_order = 0,
            offers = []
        } = req.body;

        if (!category_id || !name || !name_ar || !slug) {
            return res.status(400).json({ success: false, message: 'category_id, name, name_ar, and slug are required' });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const productId = crypto.randomUUID();
        const jsonImages = JSON.stringify(images || []);
        const jsonFeatures = JSON.stringify(features || []);

        await connection.query(`
            INSERT INTO service_products (
                id, category_id, name, name_ar, name_fr, slug,
                description, description_ar, logo_url, images, features,
                delivery_info, delivery_info_ar, requires_email, status, sort_order, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            productId, category_id, name, name_ar, name_fr || null, slug,
            description || null, description_ar || null, logo_url || null, jsonImages, jsonFeatures,
            delivery_info || null, delivery_info_ar || null, requires_email ? 1 : 0, status, sort_order, adminId
        ]);

        // Insert offers if provided
        if (Array.isArray(offers) && offers.length > 0) {
            for (const off of offers) {
                const offerId = crypto.randomUUID();
                await connection.query(`
                    INSERT INTO service_offers (
                        id, product_id, label, label_ar, duration_months, price, cost_price, currency, is_active, sort_order
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'USD', ?, ?)
                `, [
                    offerId, productId, off.label || 'Standard', off.label_ar || 'قياسي',
                    off.duration_months || null, Number(off.price) || 0, off.cost_price ? Number(off.cost_price) : null,
                    off.is_active !== undefined ? (off.is_active ? 1 : 0) : 1, off.sort_order || 0
                ]);
            }
        }

        await connection.commit();
        res.json({ success: true, message: 'Product created successfully', data: { id: productId, slug } });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Error in adminCreateProduct:', err);
        res.status(500).json({ success: false, message: 'Failed to create product', error: err.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.adminUpdateProduct = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const {
            category_id, name, name_ar, name_fr, slug,
            description, description_ar, logo_url, images, features,
            delivery_info, delivery_info_ar, requires_email,
            status, sort_order, offers
        } = req.body;

        connection = await db.getConnection();
        await connection.beginTransaction();

        const jsonImages = images !== undefined ? JSON.stringify(images) : undefined;
        const jsonFeatures = features !== undefined ? JSON.stringify(features) : undefined;

        await connection.query(`
            UPDATE service_products
            SET category_id = COALESCE(?, category_id),
                name = COALESCE(?, name),
                name_ar = COALESCE(?, name_ar),
                name_fr = COALESCE(?, name_fr),
                slug = COALESCE(?, slug),
                description = COALESCE(?, description),
                description_ar = COALESCE(?, description_ar),
                logo_url = COALESCE(?, logo_url),
                images = COALESCE(?, images),
                features = COALESCE(?, features),
                delivery_info = COALESCE(?, delivery_info),
                delivery_info_ar = COALESCE(?, delivery_info_ar),
                requires_email = COALESCE(?, requires_email),
                status = COALESCE(?, status),
                sort_order = COALESCE(?, sort_order),
                updated_at = NOW()
            WHERE id = ?
        `, [
            category_id, name, name_ar, name_fr, slug,
            description, description_ar, logo_url, jsonImages, jsonFeatures,
            delivery_info, delivery_info_ar, requires_email, status, sort_order, id
        ]);

        // If offers array is provided, sync offers
        if (Array.isArray(offers)) {
            // Delete removed offers
            const existingOfferIds = offers.filter(o => o.id).map(o => o.id);
            if (existingOfferIds.length > 0) {
                await connection.query(`
                    DELETE FROM service_offers 
                    WHERE product_id = ? AND id NOT IN (?)
                `, [id, existingOfferIds]);
            } else {
                await connection.query('DELETE FROM service_offers WHERE product_id = ?', [id]);
            }

            for (const off of offers) {
                if (off.id) {
                    await connection.query(`
                        UPDATE service_offers
                        SET label = ?, label_ar = ?, duration_months = ?, price = ?, cost_price = ?,
                            is_active = ?, sort_order = ?, updated_at = NOW()
                        WHERE id = ? AND product_id = ?
                    `, [
                        off.label, off.label_ar, off.duration_months || null, Number(off.price) || 0,
                        off.cost_price ? Number(off.cost_price) : null, off.is_active ? 1 : 0, off.sort_order || 0,
                        off.id, id
                    ]);
                } else {
                    const newOfferId = crypto.randomUUID();
                    await connection.query(`
                        INSERT INTO service_offers (
                            id, product_id, label, label_ar, duration_months, price, cost_price, currency, is_active, sort_order
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'USD', ?, ?)
                    `, [
                        newOfferId, id, off.label, off.label_ar, off.duration_months || null,
                        Number(off.price) || 0, off.cost_price ? Number(off.cost_price) : null,
                        off.is_active ? 1 : 0, off.sort_order || 0
                    ]);
                }
            }
        }

        await connection.commit();
        res.json({ success: true, message: 'Product updated successfully' });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Error in adminUpdateProduct:', err);
        res.status(500).json({ success: false, message: 'Failed to update product', error: err.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.adminDeleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        // Soft delete / hide product to preserve order history
        await db.query(`UPDATE service_products SET status = 'hidden', updated_at = NOW() WHERE id = ?`, [id]);
        res.json({ success: true, message: 'Product hidden successfully' });
    } catch (err) {
        console.error('Error in adminDeleteProduct:', err);
        res.status(500).json({ success: false, message: 'Failed to delete product', error: err.message });
    }
};

// --- ORDERS & MANUAL DELIVERY MANAGEMENT ---

exports.adminGetOrders = async (req, res) => {
    try {
        const { status, search, product_id, limit = 50, offset = 0 } = req.query;

        let query = `
            SELECT 
                o.*,
                u.email as user_email, u.username as user_name,
                p.name as product_name, p.name_ar as product_name_ar, p.slug as product_slug, p.logo_url,
                off.label as offer_label, off.label_ar as offer_label_ar, off.duration_months,
                comm.commission_amount, comm.recipient_id as commission_recipient_id,
                ref.username as referrer_username, ref.email as referrer_email
            FROM service_orders o
            JOIN users u ON o.user_id = u.id
            JOIN service_products p ON o.product_id = p.id
            JOIN service_offers off ON o.offer_id = off.id
            LEFT JOIN service_commissions comm ON o.id = comm.order_id
            LEFT JOIN users ref ON comm.recipient_id = ref.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ` AND o.status = ?`;
            params.push(status);
        }
        if (product_id) {
            query += ` AND o.product_id = ?`;
            params.push(product_id);
        }
        if (search) {
            query += ` AND (o.order_number LIKE ? OR u.email LIKE ? OR u.username LIKE ? OR o.activation_email LIKE ?)`;
            const s = `%${search}%`;
            params.push(s, s, s, s);
        }

        query += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
        params.push(Number(limit), Number(offset));

        const [orders] = await db.query(query, params);

        res.json({ success: true, data: orders });
    } catch (err) {
        console.error('Error in adminGetOrders:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch orders', error: err.message });
    }
};

exports.adminGetOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const [orders] = await db.query(`
            SELECT 
                o.*,
                u.email as user_email, u.username as user_name,
                p.name as product_name, p.name_ar as product_name_ar, p.slug as product_slug, p.logo_url, p.delivery_info_ar,
                off.label as offer_label, off.label_ar as offer_label_ar, off.duration_months,
                comm.commission_amount, comm.rate_percentage, comm.status as commission_status,
                ref.username as referrer_username, ref.email as referrer_email
            FROM service_orders o
            JOIN users u ON o.user_id = u.id
            JOIN service_products p ON o.product_id = p.id
            JOIN service_offers off ON o.offer_id = off.id
            LEFT JOIN service_commissions comm ON o.id = comm.order_id
            LEFT JOIN users ref ON comm.recipient_id = ref.id
            WHERE o.id = ?
            LIMIT 1
        `, [id]);

        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const order = orders[0];

        // Fetch logs
        const [logs] = await db.query(`
            SELECT l.*, u.username as changed_by_name
            FROM service_order_logs l
            LEFT JOIN users u ON l.changed_by = u.id
            WHERE l.order_id = ?
            ORDER BY l.created_at ASC
        `, [id]);

        order.logs = logs;

        res.json({ success: true, data: order });
    } catch (err) {
        console.error('Error in adminGetOrderById:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch order', error: err.message });
    }
};

// ** MANUAL DELIVERY BY ADMIN **
exports.adminDeliverOrder = async (req, res) => {
    const adminId = req.user.id;
    const { id } = req.params;
    const { deliveryNotes, markCompleted = true, subscriptionStart, subscriptionEnd, adminNotes } = req.body;

    if (!deliveryNotes || deliveryNotes.trim() === '') {
        return res.status(400).json({ success: false, message: 'بيانات التسليم مطلوبة (الحساب، التعليمات، أو الروابط)' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [orderRows] = await connection.query(`
            SELECT o.*, p.name_ar as p_name_ar, p.name as p_name
            FROM service_orders o
            JOIN service_products p ON o.product_id = p.id
            WHERE o.id = ?
            FOR UPDATE
        `, [id]);

        if (orderRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const order = orderRows[0];
        const oldStatus = order.status;
        const newStatus = markCompleted ? 'completed' : 'delivered';

        await connection.query(`
            UPDATE service_orders
            SET delivery_notes = ?,
                admin_notes = COALESCE(?, admin_notes),
                status = ?,
                subscription_start = COALESCE(?, subscription_start),
                subscription_end = COALESCE(?, subscription_end),
                updated_at = NOW()
            WHERE id = ?
        `, [deliveryNotes, adminNotes || null, newStatus, subscriptionStart || null, subscriptionEnd || null, id]);

        // Audit Log
        await connection.query(`
            INSERT INTO service_order_logs (id, order_id, changed_by, old_status, new_status, note)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [crypto.randomUUID(), id, adminId, oldStatus, newStatus, 'تسليم يدوي للخدمة من قِبل الإدارة']);

        // Send delivery notification to student
        const notifContent = `تم تسليم طلبك رقم #${order.order_number} لخدمة "${order.p_name_ar || order.p_name}" بنجاح! تفضل بزيارة صفحة "طلباتي" للاطلاع على تفاصيل وبيانات الاشتراك.`;
        await connection.query(`
            INSERT INTO notifications (id, user_id, type, title, content, reference_id, reference_type, is_read)
            VALUES (?, ?, 'delivery', 'تم تسليم طلبك بنجاح!', ?, ?, 'service_order', 0)
        `, [crypto.randomUUID(), order.user_id, notifContent, id]);

        await connection.commit();

        res.json({
            success: true,
            message: 'تم تسليم الخدمة وإشعار العميل بنجاح',
            data: { id, status: newStatus }
        });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Error in adminDeliverOrder:', err);
        res.status(500).json({ success: false, message: 'Failed to deliver order', error: err.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.adminUpdateOrderStatus = async (req, res) => {
    const adminId = req.user.id;
    const { id } = req.params;
    const { status, note, adminNotes } = req.body;

    if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [orderRows] = await connection.query('SELECT * FROM service_orders WHERE id = ? FOR UPDATE', [id]);
        if (orderRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const oldStatus = orderRows[0].status;

        await connection.query(`
            UPDATE service_orders 
            SET status = ?, 
                admin_notes = COALESCE(?, admin_notes),
                updated_at = NOW() 
            WHERE id = ?
        `, [status, adminNotes || null, id]);

        await connection.query(`
            INSERT INTO service_order_logs (id, order_id, changed_by, old_status, new_status, note)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [crypto.randomUUID(), id, adminId, oldStatus, status, note || `تعديل الحالة من ${oldStatus} إلى ${status}`]);

        await connection.commit();
        res.json({ success: true, message: 'Order status updated successfully' });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Error in adminUpdateOrderStatus:', err);
        res.status(500).json({ success: false, message: 'Failed to update order status', error: err.message });
    } finally {
        if (connection) connection.release();
    }
};

// --- SERVICES STATS ---

exports.adminGetStats = async (req, res) => {
    try {
        const [counts] = await db.query(`
            SELECT 
                COUNT(*) as total_orders,
                SUM(CASE WHEN status = 'pending_payment' THEN 1 ELSE 0 END) as pending_payment_count,
                SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
                SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_count,
                SUM(CASE WHEN status IN ('delivered', 'completed') THEN 1 ELSE 0 END) as completed_count,
                SUM(CASE WHEN status IN ('paid', 'processing', 'delivered', 'completed') THEN price_at_purchase ELSE 0 END) as total_sales_volume
            FROM service_orders
        `);

        const [commissionStats] = await db.query(`
            SELECT 
                COUNT(*) as total_commissions_count,
                COALESCE(SUM(commission_amount), 0) as total_commissions_paid
            FROM service_commissions
            WHERE status = 'available'
        `);

        const [productsCount] = await db.query('SELECT COUNT(*) as total_products FROM service_products WHERE status != "hidden"');
        const [categoriesCount] = await db.query('SELECT COUNT(*) as total_categories FROM service_categories WHERE is_active = 1');
        const [customProjectsCount] = await db.query(`
            SELECT 
                COUNT(*) as total_requests,
                SUM(CASE WHEN status = 'new_request' THEN 1 ELSE 0 END) as new_requests_count
            FROM custom_project_requests
        `);

        res.json({
            success: true,
            data: {
                orders: counts[0],
                commissions: commissionStats[0],
                productsCount: productsCount[0].total_products,
                categoriesCount: categoriesCount[0].total_categories,
                customProjects: customProjectsCount[0]
            }
        });
    } catch (err) {
        console.error('Error in adminGetStats:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch services stats', error: err.message });
    }
};
