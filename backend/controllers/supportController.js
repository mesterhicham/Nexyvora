const crypto = require('crypto');
const db = require('../config/db');
const AISupportService = require('../services/aiSupportService');

const VALID_CATEGORIES = ['general', 'technical', 'billing', 'academy', 'wallet', 'kyc'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_STATUSES = ['open', 'in_progress', 'waiting_for_info', 'resolved', 'closed'];

// ─── USER / MEMBER CONTROLLERS ──────────────────────────────────────────────

/**
 * Get all tickets for the authenticated user
 */
exports.getUserTickets = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, category } = req.query;

        let query = `
            SELECT st.*, 
                   (SELECT COUNT(*) FROM support_messages sm WHERE sm.ticket_id = st.id) as message_count
            FROM support_tickets st
            WHERE st.user_id = ?
        `;
        const params = [userId];

        if (status && VALID_STATUSES.includes(status)) {
            query += ` AND st.status = ?`;
            params.push(status);
        }

        if (category && VALID_CATEGORIES.includes(category)) {
            query += ` AND st.category = ?`;
            params.push(category);
        }

        query += ` ORDER BY st.updated_at DESC`;

        const [tickets] = await db.execute(query, params);
        res.json({ tickets });
    } catch (err) {
        console.error('[getUserTickets]', err);
        res.status(500).json({ error: 'Failed to retrieve support tickets.' });
    }
};

/**
 * Create a new support ticket
 */
exports.createTicket = async (req, res) => {
    const userId = req.user.id;
    const { subject, category = 'general', priority = 'medium', message } = req.body;

    if (!subject || subject.trim().length < 3) {
        return res.status(400).json({ error: 'Subject is required and must be at least 3 characters.' });
    }

    if (!message || message.trim().length < 5) {
        return res.status(400).json({ error: 'Message description is required and must be at least 5 characters.' });
    }

    const safeCategory = VALID_CATEGORIES.includes(category) ? category : 'general';
    const safePriority = VALID_PRIORITIES.includes(priority) ? priority : 'medium';

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const ticketId = crypto.randomUUID();
        const messageId = crypto.randomUUID();
        const ticketNumber = `TK-${Math.floor(100000 + Math.random() * 900000)}`;

        // 1. Insert Ticket
        await connection.execute(`
            INSERT INTO support_tickets 
            (id, ticket_number, user_id, subject, category, priority, status, last_reply_by, last_reply_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'open', 'user', NOW(), NOW(), NOW())
        `, [ticketId, ticketNumber, userId, subject.trim(), safeCategory, safePriority]);

        // 2. Insert initial message
        await connection.execute(`
            INSERT INTO support_messages 
            (id, ticket_id, sender_id, sender_role, message, created_at)
            VALUES (?, ?, ?, 'user', ?, NOW())
        `, [messageId, ticketId, userId, message.trim()]);

        await connection.commit();

        res.status(201).json({
            message: 'Support ticket created successfully.',
            ticket: {
                id: ticketId,
                ticket_number: ticketNumber,
                subject: subject.trim(),
                category: safeCategory,
                priority: safePriority,
                status: 'open'
            }
        });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('[createTicket]', err);
        res.status(500).json({ error: 'Failed to create support ticket.' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Get ticket details with full messages thread
 */
exports.getTicketDetails = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        // Fetch ticket
        const [ticketRows] = await db.execute(`
            SELECT st.*, 
                   p.full_name as user_name, 
                   p.email as user_email, 
                   p.avatar_url as user_avatar,
                   u.role as user_role
            FROM support_tickets st
            LEFT JOIN users u ON st.user_id = u.id
            LEFT JOIN profiles p ON st.user_id = p.id
            WHERE st.id = ?
        `, [id]);

        if (ticketRows.length === 0) {
            return res.status(404).json({ error: 'Ticket not found.' });
        }

        const ticket = ticketRows[0];

        // Privacy check: User can ONLY view their own ticket, unless they are admin
        if (userRole !== 'admin' && ticket.user_id !== userId) {
            return res.status(403).json({ error: 'Access denied: You cannot view this ticket.' });
        }

        // Fetch all messages in the thread
        const [messages] = await db.execute(`
            SELECT sm.*, 
                   p.full_name as sender_name, 
                   p.avatar_url as sender_avatar,
                   u.role as sender_user_role
            FROM support_messages sm
            LEFT JOIN users u ON sm.sender_id = u.id
            LEFT JOIN profiles p ON sm.sender_id = p.id
            WHERE sm.ticket_id = ?
            ORDER BY sm.created_at ASC
        `, [id]);

        res.json({ ticket, messages });
    } catch (err) {
        console.error('[getTicketDetails]', err);
        res.status(500).json({ error: 'Failed to retrieve ticket details.' });
    }
};

/**
 * Send a reply message in an existing ticket
 */
exports.addMessage = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { message, status } = req.body;

    if (!message || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message content cannot be empty.' });
    }

    try {
        // Check ticket existence and permissions
        const [tickets] = await db.execute('SELECT * FROM support_tickets WHERE id = ?', [id]);
        if (tickets.length === 0) {
            return res.status(404).json({ error: 'Ticket not found.' });
        }

        const ticket = tickets[0];
        if (userRole !== 'admin' && ticket.user_id !== userId) {
            return res.status(403).json({ error: 'Access denied: You cannot reply to this ticket.' });
        }

        const isSenderAdmin = userRole === 'admin';
        const senderRole = isSenderAdmin ? 'admin' : 'user';
        const messageId = crypto.randomUUID();

        // Determine new status
        let newStatus = ticket.status;
        if (isSenderAdmin) {
            if (status && VALID_STATUSES.includes(status)) {
                newStatus = status;
            } else if (ticket.status === 'open') {
                newStatus = 'in_progress';
            }
        } else {
            // Member reply
            if (ticket.status === 'waiting_for_info' || ticket.status === 'resolved') {
                newStatus = 'in_progress';
            }
        }

        const closedAt = newStatus === 'closed' ? new Date() : (newStatus === 'open' || newStatus === 'in_progress' ? null : ticket.closed_at);

        // Insert message
        await db.execute(`
            INSERT INTO support_messages (id, ticket_id, sender_id, sender_role, message, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        `, [messageId, id, userId, senderRole, message.trim()]);

        // Update ticket
        await db.execute(`
            UPDATE support_tickets 
            SET status = ?, 
                last_reply_by = ?, 
                last_reply_at = NOW(), 
                closed_at = ?, 
                updated_at = NOW()
            WHERE id = ?
        `, [newStatus, senderRole, closedAt, id]);

        // Fetch inserted message with sender info
        const [insertedRows] = await db.execute(`
            SELECT sm.*, 
                   p.full_name as sender_name, 
                   p.avatar_url as sender_avatar,
                   u.role as sender_user_role
            FROM support_messages sm
            LEFT JOIN users u ON sm.sender_id = u.id
            LEFT JOIN profiles p ON sm.sender_id = p.id
            WHERE sm.id = ?
        `, [messageId]);

        res.status(201).json({
            message: 'Reply sent successfully.',
            newMessage: insertedRows[0],
            newStatus
        });
    } catch (err) {
        console.error('[addMessage]', err);
        res.status(500).json({ error: 'Failed to send message.' });
    }
};

/**
 * Close a ticket
 */
exports.closeTicket = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        const [tickets] = await db.execute('SELECT * FROM support_tickets WHERE id = ?', [id]);
        if (tickets.length === 0) {
            return res.status(404).json({ error: 'Ticket not found.' });
        }

        const ticket = tickets[0];
        if (userRole !== 'admin' && ticket.user_id !== userId) {
            return res.status(403).json({ error: 'Access denied: You cannot close this ticket.' });
        }

        await db.execute(`
            UPDATE support_tickets 
            SET status = 'closed', closed_at = NOW(), updated_at = NOW()
            WHERE id = ?
        `, [id]);

        res.json({ message: 'Ticket closed successfully.' });
    } catch (err) {
        console.error('[closeTicket]', err);
        res.status(500).json({ error: 'Failed to close ticket.' });
    }
};

/**
 * AI Assistant Chat
 */
exports.aiChat = async (req, res) => {
    const { message, history } = req.body;

    if (!message || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    try {
        const response = await AISupportService.handleQuery({
            message: message.trim(),
            history: Array.isArray(history) ? history : []
        });

        res.json(response);
    } catch (err) {
        console.error('[aiChat]', err);
        res.status(500).json({ error: 'AI Assistant temporarily unavailable.' });
    }
};

// ─── ADMIN CONTROLLERS ──────────────────────────────────────────────────────

/**
 * Admin: Get all tickets with filtering & search
 */
exports.adminGetTickets = async (req, res) => {
    try {
        const { status, priority, category, search, page = 1, limit = 50 } = req.query;

        let query = `
            SELECT st.*, 
                   p.full_name as user_name, 
                   p.email as user_email, 
                   p.avatar_url as user_avatar,
                   u.role as user_role,
                   (SELECT COUNT(*) FROM support_messages sm WHERE sm.ticket_id = st.id) as message_count
            FROM support_tickets st
            LEFT JOIN users u ON st.user_id = u.id
            LEFT JOIN profiles p ON st.user_id = p.id
            WHERE 1=1
        `;
        const params = [];

        if (status && VALID_STATUSES.includes(status)) {
            query += ` AND st.status = ?`;
            params.push(status);
        }

        if (priority && VALID_PRIORITIES.includes(priority)) {
            query += ` AND st.priority = ?`;
            params.push(priority);
        }

        if (category && VALID_CATEGORIES.includes(category)) {
            query += ` AND st.category = ?`;
            params.push(category);
        }

        if (search && search.trim()) {
            const term = `%${search.trim()}%`;
            query += ` AND (st.ticket_number LIKE ? OR st.subject LIKE ? OR p.full_name LIKE ? OR p.email LIKE ?)`;
            params.push(term, term, term, term);
        }

        // Priority sort: urgent first, then latest updated
        query += `
            ORDER BY 
                CASE 
                    WHEN st.priority = 'urgent' AND st.status != 'closed' THEN 1
                    WHEN st.priority = 'high' AND st.status != 'closed' THEN 2
                    WHEN st.priority = 'medium' AND st.status != 'closed' THEN 3
                    ELSE 4 
                END,
                st.updated_at DESC
        `;

        const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
        const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
        const offset = (parsedPage - 1) * parsedLimit;

        query += ` LIMIT ${parsedLimit} OFFSET ${offset}`;

        const [tickets] = await db.execute(query, params);

        // Total count for pagination
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM support_tickets st
            LEFT JOIN profiles p ON st.user_id = p.id
            WHERE 1=1
        `;
        const countParams = [];

        if (status && VALID_STATUSES.includes(status)) {
            countQuery += ` AND st.status = ?`;
            countParams.push(status);
        }
        if (priority && VALID_PRIORITIES.includes(priority)) {
            countQuery += ` AND st.priority = ?`;
            countParams.push(priority);
        }
        if (category && VALID_CATEGORIES.includes(category)) {
            countQuery += ` AND st.category = ?`;
            countParams.push(category);
        }
        if (search && search.trim()) {
            const term = `%${search.trim()}%`;
            countQuery += ` AND (st.ticket_number LIKE ? OR st.subject LIKE ? OR p.full_name LIKE ? OR p.email LIKE ?)`;
            countParams.push(term, term, term, term);
        }

        const [countRows] = await db.execute(countQuery, countParams);

        res.json({
            tickets,
            total: countRows[0].total,
            page: parsedPage,
            limit: parsedLimit
        });
    } catch (err) {
        console.error('[adminGetTickets]', err);
        res.status(500).json({ error: 'Failed to retrieve tickets.' });
    }
};

/**
 * Admin: Get support statistics
 */
exports.adminGetStats = async (req, res) => {
    try {
        const [statsRows] = await db.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_count,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,
                SUM(CASE WHEN status = 'waiting_for_info' THEN 1 ELSE 0 END) as waiting_count,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
                SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_count,
                SUM(CASE WHEN priority IN ('urgent', 'high') AND status != 'closed' THEN 1 ELSE 0 END) as urgent_count
            FROM support_tickets
        `);

        const stats = statsRows[0];
        res.json({
            total: Number(stats.total || 0),
            open: Number(stats.open_count || 0),
            in_progress: Number(stats.in_progress_count || 0),
            waiting_for_info: Number(stats.waiting_count || 0),
            resolved: Number(stats.resolved_count || 0),
            closed: Number(stats.closed_count || 0),
            urgent: Number(stats.urgent_count || 0)
        });
    } catch (err) {
        console.error('[adminGetStats]', err);
        res.status(500).json({ error: 'Failed to retrieve support statistics.' });
    }
};

/**
 * Admin: Update ticket status
 */
exports.adminUpdateStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    try {
        const closedAt = status === 'closed' ? new Date() : null;
        await db.execute(`
            UPDATE support_tickets 
            SET status = ?, 
                closed_at = ?, 
                updated_at = NOW()
            WHERE id = ?
        `, [status, closedAt, id]);

        res.json({ message: 'Ticket status updated successfully.', status });
    } catch (err) {
        console.error('[adminUpdateStatus]', err);
        res.status(500).json({ error: 'Failed to update ticket status.' });
    }
};

/**
 * Admin: Update ticket priority
 */
exports.adminUpdatePriority = async (req, res) => {
    const { id } = req.params;
    const { priority } = req.body;

    if (!VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({ error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` });
    }

    try {
        await db.execute(`
            UPDATE support_tickets 
            SET priority = ?, updated_at = NOW()
            WHERE id = ?
        `, [priority, id]);

        res.json({ message: 'Ticket priority updated successfully.', priority });
    } catch (err) {
        console.error('[adminUpdatePriority]', err);
        res.status(500).json({ error: 'Failed to update ticket priority.' });
    }
};
