const db = require('../config/db');
const crypto = require('crypto');

function generateRequestNumber() {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `CPR-${dateStr}-${rand}`;
}

// User: Submit custom project request
exports.createRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            project_name, project_type, description,
            estimated_budget, estimated_duration,
            contact_email, contact_whatsapp, attachment_url
        } = req.body;

        if (!project_name || !project_type || !description || !contact_email) {
            return res.status(400).json({
                success: false,
                message: 'اسم المشروع، نوع المشروع، الوصف، والبريد الإلكتروني للتواصل حقول مطلوبة'
            });
        }

        const id = crypto.randomUUID();
        const requestNumber = generateRequestNumber();

        await db.query(`
            INSERT INTO custom_project_requests (
                id, request_number, user_id, project_name, project_type,
                description, estimated_budget, estimated_duration,
                contact_email, contact_whatsapp, attachment_url, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new_request')
        `, [
            id, requestNumber, userId, project_name, project_type,
            description, estimated_budget || null, estimated_duration || null,
            contact_email, contact_whatsapp || null, attachment_url || null
        ]);

        // Notify user
        await db.query(`
            INSERT INTO notifications (id, user_id, type, title, content, reference_id, reference_type, is_read)
            VALUES (?, ?, 'custom_project', 'تم استلام طلب مشروعك الخاص!', ?, ?, 'custom_project', 0)
        `, [
            crypto.randomUUID(),
            userId,
            `تم استلام طلب مشروعك "${project_name}" بنجاح برقم مرجعي #${requestNumber}. سيقوم فريقنا بمراجعة التفاصيل والتواصل معك عبر البريد أو واتساب قريباً.`,
            id
        ]);

        res.json({
            success: true,
            message: 'تم إرسال طلب المشروع الخاص بنجاح',
            data: { id, requestNumber }
        });
    } catch (err) {
        console.error('Error in createRequest:', err);
        res.status(500).json({ success: false, message: 'Failed to submit request', error: err.message });
    }
};

// User: Get my custom project requests
exports.getMyRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const [requests] = await db.query(`
            SELECT * FROM custom_project_requests
            WHERE user_id = ?
            ORDER BY created_at DESC
        `, [userId]);

        res.json({ success: true, data: requests });
    } catch (err) {
        console.error('Error in getMyRequests:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch requests', error: err.message });
    }
};

// User: Get single request details
exports.getMyRequestById = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const [requests] = await db.query(`
            SELECT * FROM custom_project_requests
            WHERE id = ? AND user_id = ?
            LIMIT 1
        `, [id, userId]);

        if (requests.length === 0) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        res.json({ success: true, data: requests[0] });
    } catch (err) {
        console.error('Error in getMyRequestById:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch request', error: err.message });
    }
};

// Admin: Get all custom requests
exports.adminGetRequests = async (req, res) => {
    try {
        const { status, project_type, search, limit = 50, offset = 0 } = req.query;

        let query = `
            SELECT r.*, u.username as user_name, u.email as user_email
            FROM custom_project_requests r
            JOIN users u ON r.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ` AND r.status = ?`;
            params.push(status);
        }
        if (project_type) {
            query += ` AND r.project_type = ?`;
            params.push(project_type);
        }
        if (search) {
            query += ` AND (r.request_number LIKE ? OR r.project_name LIKE ? OR r.contact_email LIKE ? OR u.email LIKE ?)`;
            const s = `%${search}%`;
            params.push(s, s, s, s);
        }

        query += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
        params.push(Number(limit), Number(offset));

        const [requests] = await db.query(query, params);
        res.json({ success: true, data: requests });
    } catch (err) {
        console.error('Error in adminGetRequests:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch requests', error: err.message });
    }
};

// Admin: Get single request details
exports.adminGetRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const [requests] = await db.query(`
            SELECT r.*, u.username as user_name, u.email as user_email
            FROM custom_project_requests r
            JOIN users u ON r.user_id = u.id
            WHERE r.id = ?
            LIMIT 1
        `, [id]);

        if (requests.length === 0) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        res.json({ success: true, data: requests[0] });
    } catch (err) {
        console.error('Error in adminGetRequestById:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch request', error: err.message });
    }
};

// Admin: Update custom project request status and notes
exports.adminUpdateRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_notes, meeting_date, meeting_notes } = req.body;

        const fields = [];
        const params = [];

        if (status !== undefined) { fields.push('status = ?'); params.push(status); }
        if (admin_notes !== undefined) { fields.push('admin_notes = ?'); params.push(admin_notes || null); }
        if (meeting_date !== undefined) { fields.push('meeting_date = ?'); params.push(meeting_date || null); }
        if (meeting_notes !== undefined) { fields.push('meeting_notes = ?'); params.push(meeting_notes || null); }

        fields.push('updated_at = NOW()');
        params.push(id);

        if (fields.length > 1) {
            await db.query(`UPDATE custom_project_requests SET ${fields.join(', ')} WHERE id = ?`, params);
        }

        // Notify user if status changed
        if (status) {
            const [reqRows] = await db.query('SELECT user_id, request_number, project_name FROM custom_project_requests WHERE id = ?', [id]);
            if (reqRows.length > 0) {
                const r = reqRows[0];
                await db.query(`
                    INSERT INTO notifications (id, user_id, type, title, content, reference_id, reference_type, is_read)
                    VALUES (?, ?, 'custom_project', 'تحديث في طلب مشروعك الخاص', ?, ?, 'custom_project', 0)
                `, [
                    crypto.randomUUID(),
                    r.user_id,
                    `تم تحديث حالة طلب مشروعك "${r.project_name}" (#${r.request_number}) إلى: ${status}`,
                    id
                ]);
            }
        }

        res.json({ success: true, message: 'Request updated successfully' });
    } catch (err) {
        console.error('Error in adminUpdateRequest:', err);
        res.status(500).json({ success: false, message: 'Failed to update request', error: err.message });
    }
};
