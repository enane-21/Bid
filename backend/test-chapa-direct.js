const axios = require('axios');
require('dotenv').config();

const testChapaDirect = async () => {
    try {
        console.log('=== TESTING CHAPA API DIRECTLY ===\n');

        const baseURL = process.env.CHAPA_BASE_URL;
        const secretKey = process.env.CHAPA_SECRET_KEY;

        console.log('Base URL:', baseURL);
        console.log('Secret Key:', secretKey ? `${secretKey.substring(0, 20)}...` : 'NOT SET');
        console.log('\n');

        const testData = {
            amount: 100,
            currency: 'ETB',
            email: 'customer@gmail.com',
            first_name: 'Test',
            last_name: 'User',
            phone_number: '0911234567',
            tx_ref: `TEST-${Date.now()}`,
            callback_url: 'http://localhost:5000/api/payments/verify',
            return_url: 'http://localhost:3000/payment/success',
            customization: {
                title: 'Test Payment',
                description: 'Testing Chapa integration'
            }
        };

        console.log('Request Data:');
        console.log(JSON.stringify(testData, null, 2));
        console.log('\n');

        console.log('Making request to Chapa...\n');

        const response = await axios.post(
            `${baseURL}/transaction/initialize`,
            testData,
            {
                headers: {
                    Authorization: `Bearer ${secretKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ SUCCESS!');
        console.log('Response:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.log('❌ FAILED!');
        console.log('\nError Message:', error.message);

        if (error.response) {
            console.log('\nHTTP Status:', error.response.status);
            console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
            console.log('\nResponse Headers:', error.response.headers);
        } else if (error.request) {
            console.log('\nNo response received from server');
            console.log('Request:', error.request);
        } else {
            console.log('\nError setting up request:', error.message);
        }

        console.log('\n=== DIAGNOSIS ===');

        if (error.response?.status === 400) {
            console.log('400 Bad Request - Possible causes:');
            console.log('1. Invalid phone number format (must be Ethiopian format)');
            console.log('2. Invalid email format');
            console.log('3. Missing required fields');
            console.log('4. Invalid amount (must be positive number)');
            console.log('5. Invalid currency code');
        } else if (error.response?.status === 401) {
            console.log('401 Unauthorized - Invalid API key');
        } else if (error.response?.status === 403) {
            console.log('403 Forbidden - API key not authorized for this operation');
        } else if (!error.response) {
            console.log('Network error - Cannot reach Chapa API');
            console.log('Check internet connection');
        }
    }
};

testChapaDirect();
