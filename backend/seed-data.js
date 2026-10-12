const bcrypt = require('bcryptjs');
const pool = require('./config/db');
const crypto = require('crypto');

// Use crypto.randomUUID for Node 14.17+
const generateUUID = () => {
    return crypto.randomUUID();
};

async function seed() {
    try {
        console.log('Seeding initial data...');

        // 0. Clean up existing admin
        await pool.query('DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email = ?)', ['admin@academy.com']);
        await pool.query('DELETE FROM profiles WHERE email = ?', ['admin@academy.com']);
        await pool.query('DELETE FROM users WHERE email = ?', ['admin@academy.com']);

        // 1. Create Admin User
        const adminId = generateUUID();
        const hashedPassword = await bcrypt.hash('Admin123!', 10);

        await pool.query(
            'INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)',
            [adminId, 'admin@academy.com', hashedPassword, 'admin']
        );

        // 2. Create Admin Profile
        await pool.query(
            'INSERT IGNORE INTO profiles (id, email, full_name) VALUES (?, ?, ?)',
            [adminId, 'admin@academy.com', 'Admin User']
        );

        // 3. Assign Admin Role
        await pool.query(
            'INSERT IGNORE INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
            [generateUUID(), adminId, 'admin']
        );

        // 4. Default Platform Settings
        const settings = [
            ['platform_name', 'Academy Platform', 'text', 'branding'],
            ['logo_url', '', 'image', 'branding'],
            ['primary_color', '222 47% 11%', 'color', 'theme'],
            ['accent_color', '262 83% 58%', 'color', 'theme'],
            ['welcome_message', 'Welcome to our learning platform', 'text', 'ui_texts'],
            ['footer_text', 'All rights reserved', 'text', 'ui_texts']
        ];

        for (const [key, value, type, category] of settings) {
            await pool.query(
                'INSERT IGNORE INTO platform_settings (id, `key`, `value`, `type`, category) VALUES (?, ?, ?, ?, ?)',
                [generateUUID(), key, value, type, category]
            );
        }

        // 5. Default Email Templates
        const templates = [
            ['Welcome Email', 'welcome', 'Welcome to {{platform_name}}!', '<h1>Welcome {{user_name}}!</h1>', '["user_name", "platform_name"]'],
            ['Password Reset', 'password-reset', 'Reset Your Password', '<h1>Password Reset</h1>', '["user_name", "reset_link"]']
        ];

        for (const [name, slug, subject, body, vars] of templates) {
            await pool.query(
                'INSERT IGNORE INTO email_templates (id, name, slug, subject, body_html, variables) VALUES (?, ?, ?, ?, ?, ?)',
                [generateUUID(), name, slug, subject, body, vars]
            );
        }

        console.log('Seeding completed successfully.');
        console.log('Admin credentials: admin@academy.com / Admin123!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err.message);
        process.exit(1);
    }
}

seed();
