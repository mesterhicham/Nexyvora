const nodemailer = require('nodemailer');
const pool = require('../config/db');
const crypto = require('crypto');
const defaultTemplates = require('./defaultTemplates');

class EmailService {
    /**
     * Get active email settings from database
     */
    async getSettings() {
        try {
            const [rows] = await pool.query('SELECT * FROM email_settings ORDER BY id ASC LIMIT 1');
            const dbSettings = rows.length > 0 ? rows[0] : null;

            // If active and has smtp_host configured in database, use it
            if (dbSettings && dbSettings.is_active && dbSettings.smtp_host) {
                return dbSettings;
            }

            // Fallback to environment variables if configured
            const envHost = process.env.SMTP_HOST || process.env.EMAIL_HOST;
            const envUser = process.env.SMTP_USER || process.env.SMTP_USERNAME || process.env.EMAIL_USER;
            const envPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_PASS;
            if (envHost && envUser && envPass) {
                const envPort = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT) || 587;
                return {
                    id: dbSettings ? dbSettings.id : null,
                    is_active: 1,
                    smtp_host: envHost,
                    smtp_port: envPort,
                    smtp_username: envUser,
                    smtp_password: envPass,
                    encryption: (envPort === 465 || process.env.SMTP_SECURE === 'true') ? 'ssl' : 'tls',
                    from_email: process.env.FROM_EMAIL || envUser,
                    from_name: process.env.FROM_NAME || 'Nexyvora Platform'
                };
            }

            return dbSettings;
        } catch (err) {
            console.error('[EmailService] Error fetching settings:', err.message);
            return null;
        }
    }

    /**
     * Create nodemailer transporter based on settings
     */
    createTransporter(settings) {
        if (!settings || !settings.smtp_host) {
            return null;
        }

        const isSecure = Number(settings.smtp_port) === 465 || settings.encryption === 'ssl';
        return nodemailer.createTransport({
            host: settings.smtp_host,
            port: Number(settings.smtp_port) || 587,
            secure: isSecure,
            auth: {
                user: settings.smtp_username,
                pass: settings.smtp_password,
            },
            tls: {
                rejectUnauthorized: false // Allow self-signed or internal certs if needed
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000
        });
    }

    /**
     * Log email dispatch to email_logs table
     */
    async logEmail({ templateId = null, recipientEmail, recipientName = null, recipientType = 'member', subject, bodyHtml, status, errorMessage = null }) {
        try {
            const id = crypto.randomUUID();
            await pool.query(
                `INSERT INTO email_logs (id, template_id, recipient_email, recipient_name, recipient_type, subject, body_html, status, error_message, sent_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id,
                    templateId,
                    recipientEmail,
                    recipientName,
                    recipientType,
                    subject,
                    bodyHtml,
                    status,
                    errorMessage,
                    status === 'sent' ? new Date() : null
                ]
            );
        } catch (err) {
            console.error('[EmailService] Failed to log email:', err.message);
        }
    }

    /**
     * Send email with SMTP or fallback to logging if disabled
     */
    async sendEmail({ to, toName = null, subject, html, text = null, templateId = null, recipientType = 'member' }) {
        const settings = await this.getSettings();

        if (!settings || !settings.is_active || !settings.smtp_host) {
            console.log(`[EmailService] SMTP inactive/not configured. Simulating delivery to ${to} for "${subject}"`);
            await this.logEmail({
                templateId,
                recipientEmail: to,
                recipientName: toName,
                recipientType,
                subject,
                bodyHtml: html,
                status: 'simulated',
                errorMessage: 'SMTP is not configured or inactive. Email simulated in dev mode.'
            });
            return { success: true, simulated: true };
        }

        try {
            const transporter = this.createTransporter(settings);
            const fromAddress = settings.from_name 
                ? `"${settings.from_name}" <${settings.from_email || settings.smtp_username}>`
                : (settings.from_email || settings.smtp_username);

            const info = await transporter.sendMail({
                from: fromAddress,
                to: toName ? `"${toName}" <${to}>` : to,
                subject,
                text: text || html.replace(/<[^>]*>?/gm, ''),
                html
            });

            await this.logEmail({
                templateId,
                recipientEmail: to,
                recipientName: toName,
                recipientType,
                subject,
                bodyHtml: html,
                status: 'sent'
            });

            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('[EmailService] Failed to send email via SMTP:', error.message);
            await this.logEmail({
                templateId,
                recipientEmail: to,
                recipientName: toName,
                recipientType,
                subject,
                bodyHtml: html,
                status: 'failed',
                errorMessage: error.message
            });
            return { success: false, error: error.message };
        }
    }

    /**
     * Send templated email by template slug
     */
    async sendTemplate(slug, { to, toName = null, variables = {}, recipientType = 'member' }) {
        try {
            let template = null;
            const [templates] = await pool.query('SELECT * FROM email_templates WHERE slug = ? AND is_active = 1 LIMIT 1', [slug]);
            if (templates.length > 0) {
                template = templates[0];
            } else {
                // Fallback to builtin default templates
                const def = defaultTemplates.find(t => t.slug === slug);
                if (def) {
                    template = { id: null, ...def };
                }
            }

            if (!template) {
                console.warn(`[EmailService] Template with slug "${slug}" not found or inactive.`);
                return { success: false, error: `Template "${slug}" not found or inactive` };
            }

            let subject = template.subject || 'Notification';
            let html = template.body_html || '';

            // Replace {{variable}} tokens
            for (const [key, val] of Object.entries(variables)) {
                const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
                subject = subject.replace(regex, String(val ?? ''));
                html = html.replace(regex, String(val ?? ''));
            }

            return await this.sendEmail({
                to,
                toName,
                subject,
                html,
                templateId: template.id,
                recipientType
            });
        } catch (err) {
            console.error(`[EmailService] Error processing template "${slug}":`, err.message);
            return { success: false, error: err.message };
        }
    }

    /**
     * Test SMTP Connection and send a test message
     */
    async testConnection(settings, testEmail) {
        try {
            const transporter = this.createTransporter(settings);
            if (!transporter) {
                return { success: false, error: 'Incomplete SMTP settings provided.' };
            }

            await transporter.verify();

            if (testEmail) {
                const fromAddress = settings.from_name 
                    ? `"${settings.from_name}" <${settings.from_email || settings.smtp_username}>`
                    : (settings.from_email || settings.smtp_username);

                await transporter.sendMail({
                    from: fromAddress,
                    to: testEmail,
                    subject: 'Nexyvora - Test Email Notification',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                            <h2 style="color: #7c3aed;">Nexyvora Platform</h2>
                            <p style="font-size: 16px; color: #334155;">Hello,</p>
                            <p style="font-size: 14px; color: #475569;">
                                This is a test email sent from your <strong>Nexyvora</strong> platform to verify your SMTP server configuration.
                            </p>
                            <div style="background-color: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 13px; color: #0f172a; margin: 15px 0;">
                                <strong>Host:</strong> ${settings.smtp_host}<br/>
                                <strong>Port:</strong> ${settings.smtp_port}<br/>
                                <strong>From:</strong> ${fromAddress}<br/>
                                <strong>Timestamp:</strong> ${new Date().toLocaleString()}
                            </div>
                            <p style="font-size: 13px; color: #16a34a; font-weight: bold;">
                                ✔ Your email settings are working properly!
                            </p>
                        </div>
                    `
                });
            }

            return { success: true, message: 'SMTP connection verified successfully and test email sent.' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = new EmailService();
