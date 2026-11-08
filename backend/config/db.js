const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'root',
  // Tests can target an isolated database: NODE_ENV=test DB_NAME_TEST=nexyvora_test npm test
  database: (process.env.NODE_ENV === 'test' && process.env.DB_NAME_TEST) || process.env.DB_NAME || 'nexyvora',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
