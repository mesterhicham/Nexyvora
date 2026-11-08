const axios = require('axios');

async function testRegister() {
    try {
        const response = await axios.post('http://localhost:5000/api/auth/register', {
            email: 'testuser' + Date.now() + '@academy.com',
            password: 'Password123!',
            fullName: 'Test User',
            city: 'Test City',
            country: 'Test Country',
            whatsappNumber: '+1234567890'
        });

        console.log('Registration Success:', response.data);
    } catch (error) {
        console.error('Registration Failed:', error.response ? error.response.data : error.message);
    }
}

testRegister();
