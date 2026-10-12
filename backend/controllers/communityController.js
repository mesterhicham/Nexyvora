const db = require('../config/db');
const crypto = require('crypto');

function genUuid() {
    return crypto.randomUUID();
}

/**
 * Get community posts feed
 */
exports.getPosts = async (req, res) => {
    const userId = req.user?.id;
    const { channel, sort = 'latest', page = 1, limit = 20 } = req.query;
    const offset = (Math.max(1, Number(page)) - 1) * Number(limit);

    try {
        let query = `
            SELECT 
                p.id, 
                p.user_id, 
                p.channel, 
                p.title, 
                p.content, 
                p.likes_count, 
                p.comments_count, 
                p.is_pinned, 
                p.created_at,
                COALESCE(pr.full_name, u.email) AS author_name,
                pr.avatar_url AS author_avatar,
                u.role AS author_role,
                pkg.name_ar AS author_package,
                pkg.level AS author_package_level,
                r.name_ar AS author_rank,
                r.color_hex AS author_rank_color,
                (SELECT COUNT(*) FROM community_likes cl WHERE cl.post_id = p.id AND cl.user_id = ?) AS user_liked
            FROM community_posts p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN profiles pr ON u.id = pr.id
            LEFT JOIN user_packages up ON (u.id = up.user_id AND up.status = 'active' AND up.is_current = 1)
            LEFT JOIN packages pkg ON up.package_id = pkg.id
            LEFT JOIN (
                SELECT la.user_id, rk.name_ar, rk.color_hex
                FROM leader_achievers la
                JOIN ranks rk ON la.rank_id = rk.id
                WHERE la.id IN (SELECT MAX(id) FROM leader_achievers GROUP BY user_id)
            ) r ON u.id = r.user_id
        `;

        const params = [userId || ''];

        if (channel && channel !== 'all') {
            query += ` WHERE p.channel = ?`;
            params.push(channel);
        }

        if (sort === 'popular') {
            query += ` ORDER BY p.is_pinned DESC, (p.likes_count * 2 + p.comments_count * 3) DESC, p.created_at DESC`;
        } else {
            query += ` ORDER BY p.is_pinned DESC, p.created_at DESC`;
        }

        query += ` LIMIT ? OFFSET ?`;
        params.push(Number(limit), Number(offset));

        const [posts] = await db.query(query, params);

        const formatted = posts.map(p => ({
            ...p,
            user_liked: Number(p.user_liked) > 0,
            is_pinned: Number(p.is_pinned) === 1
        }));

        res.json({ posts: formatted });
    } catch (err) {
        console.error('[getPosts]', err);
        res.status(500).json({ error: 'Failed to fetch community posts' });
    }
};

/**
 * Create a new community post
 */
exports.createPost = async (req, res) => {
    const userId = req.user.id;
    const { channel = 'general', title, content } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Post title is required' });
    }
    if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Post content is required' });
    }

    try {
        const postId = genUuid();
        const isAdmin = req.user.role === 'admin';

        await db.query(`
            INSERT INTO community_posts (id, user_id, channel, title, content, likes_count, comments_count, is_pinned, created_at)
            VALUES (?, ?, ?, ?, ?, 0, 0, 0, NOW())
        `, [postId, userId, channel, title.trim(), content.trim()]);

        const [newPostRows] = await db.query(`
            SELECT 
                p.*,
                COALESCE(pr.full_name, u.email) AS author_name,
                pr.avatar_url AS author_avatar,
                u.role AS author_role
            FROM community_posts p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN profiles pr ON u.id = pr.id
            WHERE p.id = ?
        `, [postId]);

        res.status(201).json({
            message: 'Post created successfully',
            post: { ...newPostRows[0], user_liked: false, is_pinned: false }
        });
    } catch (err) {
        console.error('[createPost]', err);
        res.status(500).json({ error: 'Failed to create community post' });
    }
};

/**
 * Get comments for a post
 */
exports.getComments = async (req, res) => {
    const { id } = req.params;

    try {
        const [comments] = await db.query(`
            SELECT 
                c.id, 
                c.post_id, 
                c.user_id, 
                c.content, 
                c.created_at,
                COALESCE(pr.full_name, u.email) AS author_name,
                pr.avatar_url AS author_avatar,
                u.role AS author_role,
                pkg.name_ar AS author_package,
                r.name_ar AS author_rank,
                r.color_hex AS author_rank_color
            FROM community_comments c
            JOIN users u ON c.user_id = u.id
            LEFT JOIN profiles pr ON u.id = pr.id
            LEFT JOIN user_packages up ON (u.id = up.user_id AND up.status = 'active' AND up.is_current = 1)
            LEFT JOIN packages pkg ON up.package_id = pkg.id
            LEFT JOIN (
                SELECT la.user_id, rk.name_ar, rk.color_hex
                FROM leader_achievers la
                JOIN ranks rk ON la.rank_id = rk.id
                WHERE la.id IN (SELECT MAX(id) FROM leader_achievers GROUP BY user_id)
            ) r ON u.id = r.user_id
            WHERE c.post_id = ?
            ORDER BY c.created_at ASC
        `, [id]);

        res.json({ comments });
    } catch (err) {
        console.error('[getComments]', err);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
};

/**
 * Add a comment to a post
 */
exports.addComment = async (req, res) => {
    const userId = req.user.id;
    const { id: postId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Comment content cannot be empty' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [postRows] = await connection.query('SELECT * FROM community_posts WHERE id = ?', [postId]);
        if (postRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Post not found' });
        }

        const commentId = genUuid();
        await connection.query(`
            INSERT INTO community_comments (id, post_id, user_id, content, created_at)
            VALUES (?, ?, ?, ?, NOW())
        `, [commentId, postId, userId, content.trim()]);

        await connection.query(`
            UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = ?
        `, [postId]);

        // Fetch inserted comment with author details
        const [commentData] = await connection.query(`
            SELECT 
                c.*,
                COALESCE(pr.full_name, u.email) AS author_name,
                pr.avatar_url AS author_avatar,
                u.role AS author_role
            FROM community_comments c
            JOIN users u ON c.user_id = u.id
            LEFT JOIN profiles pr ON u.id = pr.id
            WHERE c.id = ?
        `, [commentId]);

        await connection.commit();
        res.status(201).json({ message: 'Comment added successfully', comment: commentData[0] });
    } catch (err) {
        await connection.rollback();
        console.error('[addComment]', err);
        res.status(500).json({ error: 'Failed to add comment' });
    } finally {
        connection.release();
    }
};

/**
 * Toggle like on a post
 */
exports.toggleLike = async (req, res) => {
    const userId = req.user.id;
    const { id: postId } = req.params;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [existing] = await connection.query(
            'SELECT id FROM community_likes WHERE post_id = ? AND user_id = ?',
            [postId, userId]
        );

        let liked = false;
        if (existing.length > 0) {
            // Unlike
            await connection.query('DELETE FROM community_likes WHERE post_id = ? AND user_id = ?', [postId, userId]);
            await connection.query('UPDATE community_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ?', [postId]);
            liked = false;
        } else {
            // Like
            await connection.query('INSERT INTO community_likes (id, post_id, user_id, created_at) VALUES (?, ?, ?, NOW())', [genUuid(), postId, userId]);
            await connection.query('UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = ?', [postId]);
            liked = true;
        }

        const [updatedPost] = await connection.query('SELECT likes_count FROM community_posts WHERE id = ?', [postId]);

        await connection.commit();
        res.json({ liked, likesCount: updatedPost[0]?.likes_count || 0 });
    } catch (err) {
        await connection.rollback();
        console.error('[toggleLike]', err);
        res.status(500).json({ error: 'Failed to toggle like' });
    } finally {
        connection.release();
    }
};

/**
 * Delete a post (owner or admin)
 */
exports.deletePost = async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { id: postId } = req.params;

    try {
        const [posts] = await db.query('SELECT user_id FROM community_posts WHERE id = ?', [postId]);
        if (posts.length === 0) return res.status(404).json({ error: 'Post not found' });

        if (posts[0].user_id !== userId && userRole !== 'admin') {
            return res.status(403).json({ error: 'You are not authorized to delete this post' });
        }

        await db.query('DELETE FROM community_posts WHERE id = ?', [postId]);
        res.json({ message: 'Post deleted successfully' });
    } catch (err) {
        console.error('[deletePost]', err);
        res.status(500).json({ error: 'Failed to delete post' });
    }
};
