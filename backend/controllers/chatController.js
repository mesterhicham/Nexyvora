const db = require('../config/db');
const crypto = require('crypto');

// --- GET CONVERSATIONS ---
exports.getConversations = async (req, res) => {
    const userId = req.user.id;
    try {
        const [convRows] = await db.execute(`
            SELECT c.*, cp.last_read_at
            FROM conversations c
            JOIN conversation_participants cp ON c.id = cp.conversation_id
            WHERE cp.user_id = ?
            ORDER BY c.updated_at DESC
        `, [userId]);

        const conversations = [];

        for (const conv of convRows) {
            // Fetch participants
            const [partRows] = await db.execute(`
                SELECT cp.id, cp.conversation_id, cp.user_id, cp.joined_at, cp.last_read_at,
                       p.full_name, p.email, p.avatar_url
                FROM conversation_participants cp
                LEFT JOIN profiles p ON cp.user_id = p.id
                WHERE cp.conversation_id = ?
            `, [conv.id]);

            const participants = partRows.map(p => ({
                id: p.id,
                conversation_id: p.conversation_id,
                user_id: p.user_id,
                joined_at: p.joined_at,
                last_read_at: p.last_read_at,
                profile: {
                    full_name: p.full_name,
                    email: p.email,
                    avatar_url: p.avatar_url
                }
            }));

            // Fetch last message
            const [msgRows] = await db.execute(`
                SELECT m.*, p.full_name as sender_name, p.email as sender_email, p.avatar_url as sender_avatar
                FROM messages m
                LEFT JOIN profiles p ON m.sender_id = p.id
                WHERE m.conversation_id = ?
                ORDER BY m.created_at DESC
                LIMIT 1
            `, [conv.id]);

            let lastMessage = null;
            if (msgRows.length > 0) {
                const m = msgRows[0];
                lastMessage = {
                    ...m,
                    sender: {
                        full_name: m.sender_name,
                        email: m.sender_email,
                        avatar_url: m.sender_avatar
                    }
                };
            }

            // Calculate unread count
            const lastRead = conv.last_read_at ? new Date(conv.last_read_at) : new Date(0);
            const [unreadRows] = await db.execute(`
                SELECT COUNT(*) as unread_count
                FROM messages
                WHERE conversation_id = ? AND sender_id != ? AND created_at > ?
            `, [conv.id, userId, lastRead]);

            conversations.push({
                id: conv.id,
                type: conv.type,
                name: conv.name,
                cohort_id: conv.cohort_id,
                created_at: conv.created_at,
                updated_at: conv.updated_at,
                participants,
                last_message: lastMessage,
                unread_count: unreadRows[0]?.unread_count || 0
            });
        }

        res.json(conversations);
    } catch (err) {
        console.error('[getConversations]', err);
        res.status(500).json({ error: err.message });
    }
};

// --- GET OR CREATE DIRECT CONVERSATION ---
exports.getOrCreateDirectConversation = async (req, res) => {
    const userId = req.user.id;
    const { other_user_id } = req.body;

    if (!other_user_id) {
        return res.status(400).json({ error: 'other_user_id is required' });
    }

    try {
        // Search for existing direct conversation between these two
        const [existing] = await db.execute(`
            SELECT c.id
            FROM conversations c
            JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = ?
            JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = ?
            WHERE c.type = 'direct'
            LIMIT 1
        `, [userId, other_user_id]);

        if (existing.length > 0) {
            return res.json({ id: existing[0].id });
        }

        // Create new direct conversation
        const conversationId = crypto.randomUUID();
        await db.execute(`
            INSERT INTO conversations (id, type, name, created_at, updated_at)
            VALUES (?, 'direct', NULL, NOW(), NOW())
        `, [conversationId]);

        await db.execute(`
            INSERT INTO conversation_participants (id, conversation_id, user_id, joined_at, last_read_at)
            VALUES (?, ?, ?, NOW(), NOW()), (?, ?, ?, NOW(), NULL)
        `, [crypto.randomUUID(), conversationId, userId, crypto.randomUUID(), conversationId, other_user_id]);

        res.status(201).json({ id: conversationId });
    } catch (err) {
        console.error('[getOrCreateDirectConversation]', err);
        res.status(500).json({ error: err.message });
    }
};

// --- GET OR CREATE COHORT GROUP CONVERSATION ---
exports.getOrCreateCohortConversation = async (req, res) => {
    const { cohort_id, name } = req.body;
    if (!cohort_id) return res.status(400).json({ error: 'cohort_id is required' });

    try {
        const [existing] = await db.execute(`
            SELECT id FROM conversations WHERE cohort_id = ? AND type = 'group' LIMIT 1
        `, [cohort_id]);

        if (existing.length > 0) {
            return res.json({ id: existing[0].id });
        }

        const convId = crypto.randomUUID();
        await db.execute(`
            INSERT INTO conversations (id, type, name, cohort_id, created_at, updated_at)
            VALUES (?, 'group', ?, ?, NOW(), NOW())
        `, [convId, name || 'Cohort Group', cohort_id]);

        // Add all students of this cohort to conversation
        const [students] = await db.execute('SELECT user_id FROM students WHERE cohort_id = ? AND user_id IS NOT NULL', [cohort_id]);
        for (const st of students) {
            await db.execute(`
                INSERT IGNORE INTO conversation_participants (id, conversation_id, user_id, joined_at)
                VALUES (?, ?, ?, NOW())
            `, [crypto.randomUUID(), convId, st.user_id]);
        }

        res.status(201).json({ id: convId });
    } catch (err) {
        console.error('[getCohortConversation]', err);
        res.status(500).json({ error: err.message });
    }
};

// --- GET MESSAGES ---
exports.getMessages = async (req, res) => {
    const { id: conversationId } = req.params;
    const userId = req.user.id;

    try {
        const [messages] = await db.execute(`
            SELECT m.*,
                   p.full_name as sender_name, p.email as sender_email, p.avatar_url as sender_avatar,
                   rm.content as reply_content, rm.sender_id as reply_sender_id, rp.full_name as reply_sender_name
            FROM messages m
            LEFT JOIN profiles p ON m.sender_id = p.id
            LEFT JOIN messages rm ON m.reply_to_id = rm.id
            LEFT JOIN profiles rp ON rm.sender_id = rp.id
            WHERE m.conversation_id = ?
            ORDER BY m.created_at ASC
        `, [conversationId]);

        // Fetch all reactions for these messages
        const [reactions] = await db.execute(`
            SELECT r.*
            FROM message_reactions r
            JOIN messages m ON r.message_id = m.id
            WHERE m.conversation_id = ?
        `, [conversationId]);

        const reactionsByMsg = {};
        for (const r of reactions) {
            if (!reactionsByMsg[r.message_id]) reactionsByMsg[r.message_id] = [];
            reactionsByMsg[r.message_id].push(r);
        }

        const formatted = messages.map(m => ({
            id: m.id,
            conversation_id: m.conversation_id,
            sender_id: m.sender_id,
            content: m.content,
            attachment_url: m.attachment_url,
            attachment_type: m.attachment_type,
            reply_to_id: m.reply_to_id,
            created_at: m.created_at,
            updated_at: m.updated_at,
            sender: {
                full_name: m.sender_name,
                email: m.sender_email,
                avatar_url: m.sender_avatar
            },
            reply_to: m.reply_to_id ? {
                id: m.reply_to_id,
                content: m.reply_content,
                sender_id: m.reply_sender_id,
                sender: { full_name: m.reply_sender_name }
            } : null,
            reactions: reactionsByMsg[m.id] || []
        }));

        res.json(formatted);
    } catch (err) {
        console.error('[getMessages]', err);
        res.status(500).json({ error: err.message });
    }
};

// --- SEND MESSAGE ---
exports.sendMessage = async (req, res) => {
    const { id: conversationId } = req.params;
    const senderId = req.user.id;
    const { content, attachment_url, attachment_type, reply_to_id } = req.body;

    if (!content && !attachment_url) {
        return res.status(400).json({ error: 'Message content or attachment is required' });
    }

    try {
        const messageId = crypto.randomUUID();
        await db.execute(`
            INSERT INTO messages (id, conversation_id, sender_id, content, attachment_url, attachment_type, reply_to_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [messageId, conversationId, senderId, content || '', attachment_url || null, attachment_type || null, reply_to_id || null]);

        await db.execute(`
            UPDATE conversations SET updated_at = NOW() WHERE id = ?
        `, [conversationId]);

        // Also update sender last_read_at
        await db.execute(`
            UPDATE conversation_participants SET last_read_at = NOW() WHERE conversation_id = ? AND user_id = ?
        `, [conversationId, senderId]);

        const [profileRows] = await db.execute('SELECT full_name, email, avatar_url FROM profiles WHERE id = ?', [senderId]);
        const sender = profileRows[0] || {};

        res.status(201).json({
            id: messageId,
            conversation_id: conversationId,
            sender_id: senderId,
            content: content || '',
            attachment_url: attachment_url || null,
            attachment_type: attachment_type || null,
            reply_to_id: reply_to_id || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            sender: {
                full_name: sender.full_name,
                email: sender.email,
                avatar_url: sender.avatar_url
            },
            reactions: []
        });
    } catch (err) {
        console.error('[sendMessage]', err);
        res.status(500).json({ error: err.message });
    }
};

// --- MARK AS READ ---
exports.markAsRead = async (req, res) => {
    const { id: conversationId } = req.params;
    const userId = req.user.id;

    try {
        await db.execute(`
            UPDATE conversation_participants 
            SET last_read_at = NOW() 
            WHERE conversation_id = ? AND user_id = ?
        `, [conversationId, userId]);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- TOGGLE REACTION ---
exports.toggleReaction = async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user.id;
    const { emoji } = req.body;

    if (!emoji) return res.status(400).json({ error: 'Emoji is required' });

    try {
        const [existing] = await db.execute(`
            SELECT id FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?
        `, [messageId, userId, emoji]);

        if (existing.length > 0) {
            await db.execute('DELETE FROM message_reactions WHERE id = ?', [existing[0].id]);
            return res.json({ action: 'removed' });
        } else {
            const id = crypto.randomUUID();
            await db.execute(`
                INSERT INTO message_reactions (id, message_id, user_id, emoji, created_at)
                VALUES (?, ?, ?, ?, NOW())
            `, [id, messageId, userId, emoji]);
            return res.status(201).json({ action: 'added', id });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- TYPING INDICATORS ---
exports.setTyping = async (req, res) => {
    const { id: conversationId } = req.params;
    const userId = req.user.id;
    const { isTyping } = req.body;

    try {
        if (isTyping) {
            await db.execute(`
                INSERT INTO typing_indicators (id, conversation_id, user_id, started_at)
                VALUES (?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE started_at = NOW()
            `, [crypto.randomUUID(), conversationId, userId]);
        } else {
            await db.execute(`
                DELETE FROM typing_indicators WHERE conversation_id = ? AND user_id = ?
            `, [conversationId, userId]);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getTyping = async (req, res) => {
    const { id: conversationId } = req.params;
    const userId = req.user.id;

    try {
        // Active in last 6 seconds
        const [rows] = await db.execute(`
            SELECT t.*, p.full_name
            FROM typing_indicators t
            LEFT JOIN profiles p ON t.user_id = p.id
            WHERE t.conversation_id = ? AND t.user_id != ? AND t.started_at >= NOW() - INTERVAL 6 SECOND
        `, [conversationId, userId]);

        res.json(rows.map(r => ({
            user_id: r.user_id,
            full_name: r.full_name
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
