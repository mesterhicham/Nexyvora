const pool = require('./config/db');
const axios = require('axios');
const bcrypt = require('bcryptjs');

async function main() {
    try {
        console.log('--- 1. Querying users with admin role ---');
        const [users] = await pool.query("SELECT u.id, u.email, u.password, u.role, p.full_name FROM users u LEFT JOIN profiles p ON u.id = p.id WHERE u.role = 'admin' OR u.email LIKE '%admin%'");
        console.log('Found users:', users.map(u => ({ id: u.id, email: u.email, role: u.role, full_name: u.full_name })));

        if (users.length === 0) {
            console.log('No admin user found. We need to create one or run seed.');
            process.exit(1);
        }

        const admin = users[0];
        console.log('\n--- 2. Checking password against Admin123! ---');
        const match = await bcrypt.compare('Admin123!', admin.password);
        console.log('Password "Admin123!" matches hash:', match);

        console.log('\n--- 3. Testing login API endpoint ---');
        try {
            const res = await axios.post('http://localhost:5001/api/auth/login', {
                email: admin.email,
                password: 'Admin123!'
            });
            console.log('Login API status:', res.status);
            console.log('Login API user:', res.data.user);
            console.log('Login API token received:', !!res.data.token);
        } catch (apiErr) {
            console.error('Login API error:', apiErr.response ? apiErr.response.data : apiErr.message);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

main();
