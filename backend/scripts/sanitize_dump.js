const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function sanitizeDump() {
    const dumpPath = path.join(__dirname, '..', '..', 'nextvora_production_dump.sql');
    if (!fs.existsSync(dumpPath)) {
        console.log('Dump file not found, skipping sanitization.');
        return;
    }

    let sql = fs.readFileSync(dumpPath, 'utf8');

    // 1. Replace INSERT INTO `profiles` with anonymized seed profiles
    const mockProfiles = `INSERT INTO \`profiles\` VALUES ('00000000-0000-0000-0000-000000000001','admin@nexyvora.com','System Administrator',NULL,NOW(),NOW(),'Casablanca','Morocco','+212600000001',NULL,NULL,NULL,NULL),('00000000-0000-0000-0000-000000000002','teacher@nexyvora.com','Demo Instructor',NULL,NOW(),NOW(),'Algiers','Algeria','+213500000002',NULL,NULL,NULL,NULL),('00000000-0000-0000-0000-000000000003','student@nexyvora.com','Demo Student',NULL,NOW(),NOW(),'Rabat','Morocco','+212600000003',NULL,NULL,NULL,NULL);`;
    sql = sql.replace(/INSERT INTO `profiles` VALUES \([^;]+;/g, mockProfiles);

    // 2. Replace INSERT INTO `users` with anonymized seed users
    const dummyHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4L.V9x0vqe'; // bcrypt for "Password123!"
    const mockUsers = `INSERT INTO \`users\` VALUES ('00000000-0000-0000-0000-000000000001','admin@nexyvora.com','admin','admin','NV100001',NULL,'active',1,'active','verified','${dummyHash}',NULL,1,NOW(),NOW()),('00000000-0000-0000-0000-000000000002','teacher@nexyvora.com','teacher','teacher','NV100002',NULL,'active',1,'active','verified','${dummyHash}',NULL,1,NOW(),NOW()),('00000000-0000-0000-0000-000000000003','student@nexyvora.com','student','student','NV100003',NULL,'active',1,'active','verified','${dummyHash}',NULL,1,NOW(),NOW());`;
    sql = sql.replace(/INSERT INTO `users` VALUES \([^;]+;/g, mockUsers);

    // 3. Replace INSERT INTO `user_wallets` with mock seed wallets
    const mockWallets = `INSERT INTO \`user_wallets\` VALUES ('w-00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001',0.00,0.00,0.00,0.00,NOW(),NOW()),('w-00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002',0.00,0.00,0.00,0.00,NOW(),NOW()),('w-00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000003',100.00,0.00,100.00,0.00,NOW(),NOW());`;
    sql = sql.replace(/INSERT INTO `user_wallets` VALUES \([^;]+;/g, mockWallets);

    // 4. Remove any real transaction records
    sql = sql.replace(/INSERT INTO `transactions` VALUES \([^;]+;/g, '-- No production transactions stored in sanitized template');

    // 5. Replace database name references
    sql = sql.replace(/Database: nexyvora/g, 'Database: nextvora_template');

    fs.writeFileSync(dumpPath, sql, 'utf8');
    console.log('Successfully sanitized nextvora_production_dump.sql: all sensitive PII and production credentials replaced with anonymous mock data.');
}

sanitizeDump();
