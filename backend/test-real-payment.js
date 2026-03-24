const mongoose = require('mongoose');
const Payment = require('./models/Payment');
const User = require('./models/User');
const TenderFile = require('./models/TenderFile');
const Requisition = require('./models/Requisition');
const axios = require('axios');
require('dotenv').config();

const testRealPayment = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Find the approved payment
        const payment = await Payment.findOne({ status: 'approved' })
            .populate('supplier', 'name email phone companyName')
            .populate('tender', 'title')
            .populate('requisition', 'title');

        if (!payment) {
            console.log('❌ No approved payment found!');
            process.exit(0);
        }

        console.log('=== PAYMENT DETAILS ===');
        console.log(`Supplier Name: ${payment.supplier.companyName || payment.supplier.name}`);
        console.log(`Supplier Email: ${payment.supplier.email}`);
        console.log(`Supplier Phone: ${payment.supplier.phone || 'Not set'}`);
        console.log(`Amount: ${payment.amount} ${payment.currency}`);
        console.log('\n');

        // Prepare data exactly as the controller does
        const supplierName = payment.supplier.companyName || payment.supplier.name;
        const nameParts = supplierName.split(' ');

        const chapaPaymentData = {
            amount: payment.amount,
            currency: payment.currency || 'ETB',
            email: payment.supplier.email,
            first_name: nameParts[0] || 'Supplier',
            last_name: nameParts.slice(1).join(' ') || 'Account',
            phone_number: payment.supplier.phone || '0900000000',
            tx_ref: `EBID-PAY-${Date.now()}`,
            callback_url: process.env.CHAPA_CALLBACK_URL,
            return_url: process.env.CHAPA_RETURN_URL,
            customization: {
                title: `Payment for ${payment.tender.title}`,
                description: `Payment to ${supplierName} for tender: ${payment.tender.title}`
            }
        };

        console.log('=== CHAPA REQUEST DATA ===');
        console.log(JSON.stringify(chapaPaymentData, null, 2));
        console.log('\n');

        console.log('=== SENDING TO CHAPA ===');
        const response = await axios.post(
            `${process.env.CHAPA_BASE_URL}/transaction/initialize`,
            chapaPaymentData,
            {
                headers: {
                    Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ SUCCESS!');
        console.log('Checkout URL:', response.data.data.checkout_url);
        console.log('\nYou can open this URL in your browser to test the payment!');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.log('❌ FAILED!');
        console.log('\nError:', error.message);

        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Response:', JSON.stringify(error.response.data, null, 2));

            if (error.response.data.message) {
                console.log('\n=== VALIDATION ERRORS ===');
                Object.keys(error.response.data.message).forEach(field => {
                    console.log(`${field}: ${error.response.data.message[field]}`);
                });
            }
        }

        await mongoose.connection.close();
        process.exit(1);
    }
};

testRealPayment();
