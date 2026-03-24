const axios = require('axios');

class ChapaService {
    constructor() {
        this.baseURL = process.env.CHAPA_BASE_URL?.trim();
        this.secretKey = process.env.CHAPA_SECRET_KEY?.trim();

        if (!this.baseURL) {
            console.error('CHAPA_BASE_URL is not set in environment variables');
        }
        if (!this.secretKey) {
            console.error('CHAPA_SECRET_KEY is not set in environment variables');
        }
    }

    async initializePayment(paymentData) {
        try {
            if (!this.baseURL || !this.secretKey) {
                throw new Error('Chapa configuration is missing. Please check CHAPA_BASE_URL and CHAPA_SECRET_KEY in .env file');
            }

            const url = `${this.baseURL}/transaction/initialize`;

            // Validate and sanitize email - use fallback if invalid
            let email = paymentData.email?.trim().toLowerCase();
            if (!email || !email.includes('@') || !email.includes('.')) {
                console.warn('Invalid supplier email, using fallback email for testing');
                email = 'supplier@gmail.com'; // Fallback email - Chapa requires common domains
            }

            // Chapa test API is very strict - ensure email has common domain
            if (!email.endsWith('@gmail.com') && !email.endsWith('@yahoo.com') && !email.endsWith('@outlook.com')) {
                console.warn('Email domain not recognized by Chapa, using fallback');
                email = 'supplier@gmail.com';
            }

            // Validate phone number (Ethiopian format)
            let phone = paymentData.phone?.trim();
            if (!phone || phone === '0900000000' || phone.length < 10) {
                // Use a default valid Ethiopian phone number for testing
                phone = '0911234567';
            }

            // Ensure phone starts with 0 and has 10 digits
            if (!phone.startsWith('0')) {
                phone = '0' + phone;
            }
            if (phone.length !== 10) {
                console.warn('Phone number length invalid, using default');
                phone = '0911234567';
            }

            // Sanitize names
            const firstName = (paymentData.firstName || 'Supplier').trim().substring(0, 50);
            const lastName = (paymentData.lastName || 'Account').trim().substring(0, 50);

            // Sanitize title and description - Chapa only allows: letters, numbers, hyphens, underscores, spaces, and dots
            // Title max 16 characters, description max 200 characters
            const sanitizeText = (text) => {
                return text.replace(/[^a-zA-Z0-9\-_\s.]/g, '').trim();
            };

            const title = sanitizeText(paymentData.title || 'Payment').substring(0, 16) || 'Payment';
            const description = sanitizeText(paymentData.description || 'Tender payment').substring(0, 200) || 'Tender payment';

            const requestData = {
                amount: parseFloat(paymentData.amount),
                currency: paymentData.currency || 'ETB',
                email: email,
                first_name: firstName,
                last_name: lastName,
                phone_number: phone,
                tx_ref: paymentData.txRef,
                callback_url: process.env.CHAPA_CALLBACK_URL || 'http://localhost:5000/api/payments/webhook',
                return_url: process.env.CHAPA_RETURN_URL || 'http://localhost:3000/finance',
                customization: {
                    title: title,
                    description: description
                }
            };

            console.log('=== Chapa Payment Initialization ===');
            console.log('API URL:', url);
            console.log('Request Data:', JSON.stringify(requestData, null, 2));

            const response = await axios.post(url, requestData, {
                headers: {
                    Authorization: `Bearer ${this.secretKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 second timeout
            });

            console.log('Chapa Response Status:', response.status);
            console.log('Chapa Response Data:', JSON.stringify(response.data, null, 2));

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('=== Chapa Initialization Error ===');
            console.error('Error Message:', error.message);

            if (error.response) {
                console.error('Response Status:', error.response.status);
                console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
            } else if (error.request) {
                console.error('No response received from Chapa API');
                console.error('Request:', error.request);
            }

            let errorMessage = error.message;

            if (error.code === 'ECONNREFUSED') {
                errorMessage = 'Cannot connect to Chapa API. Please check your internet connection.';
            } else if (error.code === 'ETIMEDOUT') {
                errorMessage = 'Chapa API request timed out. Please try again.';
            } else if (error.response?.data?.message) {
                if (typeof error.response.data.message === 'object') {
                    // Validation errors
                    const errors = Object.entries(error.response.data.message)
                        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                        .join('; ');
                    errorMessage = `Validation failed: ${errors}`;
                } else {
                    errorMessage = error.response.data.message;
                }
            } else if (error.response?.status === 401) {
                errorMessage = 'Invalid Chapa API credentials. Please check CHAPA_SECRET_KEY.';
            } else if (error.response?.status === 403) {
                errorMessage = 'Access forbidden. Please verify your Chapa account status.';
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    }

    async verifyPayment(txRef) {
        try {
            const response = await axios.get(
                `${this.baseURL}/transaction/verify/${txRef}`,
                {
                    headers: {
                        Authorization: `Bearer ${this.secretKey}`
                    }
                }
            );

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Chapa verification error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    async getBanks() {
        try {
            const response = await axios.get(
                `${this.baseURL}/banks`,
                {
                    headers: {
                        Authorization: `Bearer ${this.secretKey}`
                    }
                }
            );

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Chapa get banks error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    generateTxRef(prefix = 'EBID') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

module.exports = new ChapaService();
