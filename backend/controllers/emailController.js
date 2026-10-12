const pool = require('../config/db');
const emailService = require('../services/emailService');
const defaultTemplates = require('../services/defaultTemplates');
const crypto = require('crypto');

/**
 * Get Email / SMTP Settings
 */
exports.getEmailSettings = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM email_settings ORDER BY id ASC LIMIT 1');
        if (rows.length === 0) {
            return res.json({
                smtp_host: '',
                smtp_port: 587,
                smtp_username: '',
                smtp_password: '',
                encryption: 'tls',
                from_email: '',
                from_name: 'Nexyvora Platform',
                is_active: 0,
            });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('[EmailController] getEmailSettings error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Save Email / SMTP Settings
 */
exports.saveEmailSettings = async (req, res) => {
    try {
        const {
            smtp_host,
            smtp_port,
            smtp_username,
            smtp_password,
            encryption,
            from_email,
            from_name,
            is_active
        } = req.body;

        const [existing] = await pool.query('SELECT id FROM email_settings LIMIT 1');

        if (existing.length > 0) {
            await pool.query(
                `UPDATE email_settings 
                 SET smtp_host = ?, smtp_port = ?, smtp_username = ?, smtp_password = ?, 
                     encryption = ?, from_email = ?, from_name = ?, is_active = ?, updated_at = NOW()
                 WHERE id = ?`,
                [
                    smtp_host || '',
                    Number(smtp_port) || 587,
                    smtp_username || '',
                    smtp_password || '',
                    encryption || 'tls',
                    from_email || '',
                    from_name || 'Nexyvora',
                    is_active ? 1 : 0,
                    existing[0].id
                ]
            );
        } else {
            const id = crypto.randomUUID();
            await pool.query(
                `INSERT INTO email_settings 
                 (id, smtp_host, smtp_port, smtp_username, smtp_password, encryption, from_email, from_name, is_active, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                    id,
                    smtp_host || '',
                    Number(smtp_port) || 587,
                    smtp_username || '',
                    smtp_password || '',
                    encryption || 'tls',
                    from_email || '',
                    from_name || 'Nexyvora',
                    is_active ? 1 : 0
                ]
            );
        }

        const [updated] = await pool.query('SELECT * FROM email_settings ORDER BY id ASC LIMIT 1');
        res.json({ success: true, settings: updated[0] });
    } catch (error) {
        console.error('[EmailController] saveEmailSettings error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Test SMTP Settings
 */
exports.testEmailSettings = async (req, res) => {
    try {
        const { test_email, smtp_host, smtp_port, smtp_username, smtp_password, encryption, from_email, from_name } = req.body;
        
        const dbSettings = await emailService.getSettings();

        let settings = {
            smtp_host: smtp_host || dbSettings?.smtp_host,
            smtp_port: Number(smtp_port || dbSettings?.smtp_port) || 587,
            smtp_username: smtp_username || dbSettings?.smtp_username,
            smtp_password: smtp_password || dbSettings?.smtp_password,
            encryption: encryption || dbSettings?.encryption || 'tls',
            from_email: from_email || dbSettings?.from_email || '',
            from_name: from_name || dbSettings?.from_name || 'Nexyvora Platform'
        };

        if (!settings.smtp_host) {
            return res.status(400).json({ 
                error: 'يرجى إدخال عنوان خادم SMTP (مثل smtp.gmail.com) أولاً وحفظ الإعدادات. / Please enter SMTP host settings first.' 
            });
        }

        if (!settings.smtp_username || !settings.smtp_password) {
            return res.status(400).json({ 
                error: 'يرجى إدخال اسم المستخدم وكلمة مرور خادم SMTP (كلمة مرور التطبيق). / Please enter SMTP username and app password.' 
            });
        }

        const targetEmail = test_email || req.user?.email;
        if (!targetEmail) {
            return res.status(400).json({ error: 'يرجى تحديد البريد الإلكتروني المستلم / A valid recipient email address is required.' });
        }

        const result = await emailService.testConnection(settings, targetEmail);
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }

        res.json({ success: true, message: `تم إرسال بريد الاختبار بنجاح إلى ${targetEmail}! / Test email sent successfully to ${targetEmail}!` });
    } catch (error) {
        console.error('[EmailController] testEmailSettings error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get all Email Templates
 */
exports.getEmailTemplates = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM email_templates ORDER BY created_at ASC');
        // Parse variables JSON if string
        const parsed = rows.map(t => {
            let vars = t.variables;
            if (typeof vars === 'string') {
                try { vars = JSON.parse(vars); } catch { vars = []; }
            }
            return { ...t, variables: Array.isArray(vars) ? vars : [] };
        });
        res.json(parsed);
    } catch (error) {
        console.error('[EmailController] getEmailTemplates error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Update Email Template
 */
exports.updateEmailTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { subject, body_html, body_text, is_active, name, variables } = req.body;

        const varsJson = variables ? JSON.stringify(variables) : null;

        await pool.query(
            `UPDATE email_templates 
             SET subject = COALESCE(?, subject),
                 body_html = COALESCE(?, body_html),
                 body_text = COALESCE(?, body_text),
                 name = COALESCE(?, name),
                 is_active = COALESCE(?, is_active),
                 variables = COALESCE(?, variables),
                 updated_at = NOW()
             WHERE id = ?`,
            [
                subject,
                body_html,
                body_text,
                name,
                is_active !== undefined ? (is_active ? 1 : 0) : null,
                varsJson,
                id
            ]
        );

        const [updated] = await pool.query('SELECT * FROM email_templates WHERE id = ?', [id]);
        res.json({ success: true, template: updated[0] });
    } catch (error) {
        console.error('[EmailController] updateEmailTemplate error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Create Email Template
 */
exports.createEmailTemplate = async (req, res) => {
    try {
        const { name, slug, subject, body_html, body_text, variables, is_active } = req.body;
        if (!name || !slug || !subject) {
            return res.status(400).json({ error: 'Name, slug, and subject are required.' });
        }

        const id = crypto.randomUUID();
        const varsJson = JSON.stringify(variables || []);

        await pool.query(
            `INSERT INTO email_templates (id, name, slug, subject, body_html, body_text, variables, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                id,
                name,
                slug,
                subject,
                body_html || '',
                body_text || '',
                varsJson,
                is_active ? 1 : 0
            ]
        );

        const [created] = await pool.query('SELECT * FROM email_templates WHERE id = ?', [id]);
        res.status(201).json(created[0]);
    } catch (error) {
        console.error('[EmailController] createEmailTemplate error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Delete Email Template
 */
exports.deleteEmailTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM email_templates WHERE id = ?', [id]);
        res.json({ success: true, message: 'Template deleted' });
    } catch (error) {
        console.error('[EmailController] deleteEmailTemplate error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Reset / Seed Default Nexyvora Templates
 */
exports.resetDefaultTemplates = async (req, res) => {
    try {
        for (const t of defaultTemplates) {
            const [exists] = await pool.query('SELECT id FROM email_templates WHERE slug = ?', [t.slug]);
            const varsJson = JSON.stringify(t.variables);

            if (exists.length > 0) {
                // Update with default content
                await pool.query(
                    `UPDATE email_templates 
                     SET name = ?, subject = ?, body_html = ?, body_text = ?, variables = ?, is_active = 1, updated_at = NOW()
                     WHERE id = ?`,
                    [t.name, t.subject, t.body_html.trim(), t.body_text, varsJson, exists[0].id]
                );
            } else {
                // Insert new
                const id = crypto.randomUUID();
                await pool.query(
                    `INSERT INTO email_templates (id, name, slug, subject, body_html, body_text, variables, is_active, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
                    [id, t.name, t.slug, t.subject, t.body_html.trim(), t.body_text, varsJson]
                );
            }
        }

        const [all] = await pool.query('SELECT * FROM email_templates ORDER BY created_at ASC');
        res.json({ success: true, count: all.length, templates: all });
    } catch (error) {
        console.error('[EmailController] resetDefaultTemplates error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get Email Logs
 */
exports.getEmailLogs = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT l.*, t.name as template_name 
             FROM email_logs l 
             LEFT JOIN email_templates t ON l.template_id = t.id 
             ORDER BY l.created_at DESC 
             LIMIT 100`
        );
        res.json(rows);
    } catch (error) {
        console.error('[EmailController] getEmailLogs error:', error);
        res.status(500).json({ error: error.message });
    }
};
