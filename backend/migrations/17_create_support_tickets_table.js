const db = require('../config/db');

async function up() {
    console.log('--- Migration 17: Creating support_tickets and support_messages tables ---');
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Table: support_tickets
        console.log('1. Creating support_tickets table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS support_tickets (
                id VARCHAR(36) PRIMARY KEY,
                ticket_number VARCHAR(20) NOT NULL UNIQUE,
                user_id VARCHAR(36) NOT NULL,
                subject VARCHAR(255) NOT NULL,
                category VARCHAR(50) NOT NULL DEFAULT 'general',
                priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
                status ENUM('open', 'in_progress', 'waiting_for_info', 'resolved', 'closed') NOT NULL DEFAULT 'open',
                last_reply_by ENUM('user', 'admin') NOT NULL DEFAULT 'user',
                last_reply_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                closed_at DATETIME NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_tickets_user_status (user_id, status),
                INDEX idx_tickets_status (status),
                INDEX idx_tickets_priority (priority),
                INDEX idx_tickets_created_at (created_at),
                CONSTRAINT fk_support_tickets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
        `);

        // 2. Table: support_messages
        console.log('2. Creating support_messages table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS support_messages (
                id VARCHAR(36) PRIMARY KEY,
                ticket_id VARCHAR(36) NOT NULL,
                sender_id VARCHAR(36) NOT NULL,
                sender_role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
                message TEXT NOT NULL,
                attachment_url VARCHAR(1000) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_ticket_messages (ticket_id, created_at),
                CONSTRAINT fk_support_messages_ticket FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
                CONSTRAINT fk_support_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
        `);

        await connection.commit();
        console.log('--- Migration 17 completed successfully ---');
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Migration 17 failed:', err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

if (require.main === module) {
    up().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { up };
