const axios = require('axios');

// Never hardcode credentials: this repository has been public.
const ADMIN_EMAIL = process.env.ADMIN_TEST_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_TEST_PASSWORD;
const API_URL = process.env.API_URL || 'http://localhost:5000';

async function testLogin() {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        console.error('Set ADMIN_TEST_EMAIL and ADMIN_TEST_PASSWORD in the environment before running this script.');
        process.exit(1);
    }

    try {
        const response = await axios.post(`${API_URL}/api/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });

        console.log('Login successful!');
        console.log('User Role:', response.data.user.role);
        console.log('Token received:', !!response.data.token);
        process.exit(0);
    } catch (err) {
        console.error('Login failed:');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        } else {
            console.error('Message:', err.message);
        }
        process.exit(1);
    }
}

testLogin();
