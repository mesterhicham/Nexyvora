const pool = require('./config/db');

async function verify() {
    try {
        console.log('Checking recent users...');
        const [users] = await pool.query('SELECT id, email, role FROM users ORDER BY created_at DESC LIMIT 5');
        console.log('Recent Users:', users);

        console.log('Checking recent teachers...');
        const [teachers] = await pool.query('SELECT * FROM teachers ORDER BY created_at DESC LIMIT 5');
        console.log('Recent Teachers:', teachers);

        console.log('Checking recent students...');
        const [students] = await pool.query('SELECT * FROM students ORDER BY created_at DESC LIMIT 5');
        console.log('Recent Students:', students);

        process.exit(0);
    } catch (err) {
        console.error('Verification failed:', err.message);
        process.exit(1);
    }
}

verify();
