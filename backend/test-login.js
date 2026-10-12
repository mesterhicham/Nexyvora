const axios = require('axios');

async function testLogin() {
    try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@academy.com',
            password: 'Admin123!'
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
