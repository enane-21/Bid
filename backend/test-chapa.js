const mongoose = require('mongoose');
const Payment = require('./models/Payment');
const User = require('./models/User');
const TenderFile = require('./models/TenderFile');
const Requisition = require('./models/Requisition');
const chapaService = require('./utils/chapaService');
require('dotenv').config();

const testChapaPayment = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Find the payment
        const payment = await Payment.findOne({ status: 'approved' })
            .populate('supplier', 'name email phone companyName')
            .populate('tender', 'title')
            .populate('requisition', 'title');

        if (!payment) {
            console.log('❌ No approved payment found!');
            console.log('Please approve the payment first in the Finance dashboard.\n');
            process.exit(0);
        }

        console.log('=== PAYMENT DETAILS ===');
        console.log(`Payment ID: ${payment._id}`);
        console.log(`Tender: ${payment.tender.title}`);
        console.log(`Supplier: ${payment.supplier.companyName || payment.supplier.name}`);
        console.log(`Email: ${payment.supplier.email}`);
        console.log(`Phone: ${payment.supplier.phone || 'Not provided'}`);
        console.log(`Amount: ${payment.amount} ${payment.currency}`);
        console.log(`Status: ${payment.status}\n`);

        // Check Chapa configuration
        console.log('=== CHAPA CONFIGURATION ===');
        console.log(`Base URL: ${process.env.CHAPA_BASE_URL}`);
        console.log(`Secret Key: ${process.env.CHAPA_SECRET_KEY ? '✓ Set' : '❌ Missing'}`);
        console.log(`Callback URL: ${process.env.CHAPA_CALLBACK_URL}`);
        console.log(`Return URL: ${process.env.CHAPA_RETURN_URL}\n`);

        // Generate transaction reference
        const txRef = chapaService.generateTxRef('EBID-PAY');
        console.log(`Generated TX Ref: ${txRef}\n`);

        // Prepare payment data
        const supplierName = payment.supplier.companyName || payment.supplier.name;
        const nameParts = supplierName.split(' ');

        const chapaPaymentData = {
            amount: payment.amount,
            currency: payment.currency || 'ETB',
            email: payment.supplier.email,
            firstName: nameParts[0] || 'Supplier',
            lastName: nameParts.slice(1).join(' ') || 'Account',
            phone: payment.supplier.phone || '0900000000',
            txRef: txRef,
            title: `Payment for ${payment.tender.title}`,
            description: `Payment to ${supplierName} for tender: ${payment.tender.title}`
        };

        console.log('=== CHAPA PAYMENT DATA ===');
        console.log(JSON.stringify(chapaPaymentData, null, 2));
        console.log('\n');

        // Try to initialize payment
        console.log('=== INITIALIZING CHAPA PAYMENT ===');
        const chapaResponse = await chapaService.initializePayment(chapaPaymentData);

        if (chapaResponse.success) {
            console.log('✅ Chapa payment initialized successfully!');
            console.log(`Checkout URL: ${chapaResponse.data.data.checkout_url}`);
            console.log(`TX Ref: ${chapaResponse.data.data.tx_ref}\n`);
        } else {
            console.log('❌ Chapa payment initialization failed!');
            console.log(`Error: ${chapaResponse.error}`);
            console.log('\nPossible causes:');
            console.log('1. Invalid Chapa API credentials');
            console.log('2. Chapa test mode restrictions');
            console.log('3. Invalid payment data format');
            console.log('4. Network connectivity issues');
            console.log('5. Chapa API service down\n');
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
};

testChapaPayment();
