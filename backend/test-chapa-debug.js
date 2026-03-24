require('dotenv').config();
const axios = require('axios');

// Test Chapa API connection and configuration
async function testChapaAPI() {
    console.log('=== Chapa API Configuration Test ===\n');

    // Check environment variables
    console.log('1. Environment Variables:');
    console.log('   CHAPA_BASE_URL:', process.env.CHAPA_BASE_URL || 'NOT SET');
    console.log('   CHAPA_SECRET_KEY:', process.env.CHAPA_SECRET_KEY ? 'SET (hidden)' : 'NOT SET');
    console.log('   CHAPA_CALLBACK_URL:', process.env.CHAPA_CALLBACK_URL || 'NOT SET');
    console.log('   CHAPA_RETURN_URL:', process.env.CHAPA_RETURN_URL || 'NOT SET');
    console.log('');

    if (!process.env.CHAPA_BASE_URL || !process.env.CHAPA_SECRET_KEY) {
        console.error('ERROR: Missing required Chapa configuration!');
        process.exit(1);
    }

    // Test API connectivity
    console.log('2. Testing Chapa API Connectivity...');
    try {
        const testPaymentData = {
            amount: 100,
            currency: 'ETB',
            email: 'test@gmail.com', // Chapa requires common email domains
            first_name: 'Test',
            last_name: 'User',
            phone_number: '0911234567',
            tx_ref: `TEST-${Date.now()}`,
            callback_url: process.env.CHAPA_CALLBACK_URL || 'http://localhost:5000/api/payments/webhook',
            return_url: process.env.CHAPA_RETURN_URL || 'http://localhost:3000/finance',
            customization: {
                title: 'Test Payment',
                description: 'Testing Chapa API connection'
            }
        };

        console.log('   Request Data:', JSON.stringify(testPaymentData, null, 2));
        console.log('');

        const response = await axios.post(
            `${process.env.CHAPA_BASE_URL}/transaction/initialize`,
            testPaymentData,
            {
                headers: {
                    Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        console.log('   ✓ SUCCESS! Chapa API is working correctly');
        console.log('   Response Status:', response.status);
        console.log('   Response Data:', JSON.stringify(response.data, null, 2));
        console.log('');
        console.log('   Checkout URL:', response.data.data?.checkout_url);
        console.log('');
        console.log('=== Test Completed Successfully ===');

    } catch (error) {
        console.error('   ✗ FAILED! Chapa API test failed');
        console.error('');

        if (error.response) {
            console.error('   Response Status:', error.response.status);
            console.error('   Response Data:', JSON.stringify(error.response.data, null, 2));
            console.error('');

            if (error.response.status === 401) {
                console.error('   ERROR: Invalid API credentials (401 Unauthorized)');
                console.error('   Please check your CHAPA_SECRET_KEY in .env file');
            } else if (error.response.status === 403) {
                console.error('   ERROR: Access forbidden (403 Forbidden)');
                console.error('   Your Chapa account may not be activated or has restrictions');
            } else if (error.response.status === 400) {
                console.error('   ERROR: Bad request (400)');
                console.error('   The request data may be invalid');
            }
        } else if (error.request) {
            console.error('   ERROR: No response from Chapa API');
            console.error('   Please check:');
            console.error('   - Your internet connection');
            console.error('   - The CHAPA_BASE_URL is correct');
            console.error('   - Chapa API service is available');
        } else {
            console.error('   ERROR:', error.message);
        }

        console.error('');
        console.error('=== Test Failed ===');
        process.exit(1);
    }
}

// Run the test
testChapaAPI();
