const axios = require('axios');

async function testRegistration() {
    try {
        const response = await axios.post('http://localhost:5000/api/auth/register', {
            email: 'test_teacher_v2@example.com',
            password: 'Password123!',
            fullName: 'API Teacher',
            city: 'Test City',
            country: 'Algeria',
            whatsappNumber: '123456789',
            role: 'teacher',
            specialty: 'Computer Science',
            experience: '5 years'
        });
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testRegistration();
