const Payment = require('../models/Payment');
const Bid = require('../models/Bid');
const chapaService = require('../utils/chapaService');

exports.createPayment = async (req, res) => {
    try {
        const { requisition, tender, winningBid, amount, paymentMethod, notes } = req.body;

        // Verify the bid is a winner
        const bid = await Bid.findById(winningBid);
        if (!bid || !bid.isWinner) {
            return res.status(400).json({ message: 'Invalid winning bid' });
        }

        const payment = await Payment.create({
            requisition,
            tender,
            winningBid,
            supplier: bid.supplier,
            amount,
            paymentMethod,
            notes,
            status: 'pending'
        });

        res.status(201).json({ success: true, payment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllPayments = async (req, res) => {
    try {
        const { status } = req.query;
        const query = {};

        if (status) query.status = status;

        const payments = await Payment.find(query)
            .populate('requisition', 'title')
            .populate('tender', 'title')
            .populate('supplier', 'name companyName')
            .populate('approvedBy', 'name')
            .populate('processedBy', 'name')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: payments.length, payments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('requisition', 'title')
            .populate('tender', 'title')
            .populate('winningBid')
            .populate('supplier', 'name companyName email phone')
            .populate('approvedBy', 'name')
            .populate('processedBy', 'name');

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        res.json({ success: true, payment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.approvePayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        if (payment.status !== 'pending') {
            return res.status(400).json({ message: 'Payment is not in pending status' });
        }

        payment.status = 'approved';
        payment.approvedBy = req.user.id;
        await payment.save();

        res.json({ success: true, payment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.processPayment = async (req, res) => {
    try {
        const { referenceNumber, paymentDate, notes } = req.body;
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        if (payment.status !== 'approved') {
            return res.status(400).json({ message: 'Payment must be approved first' });
        }

        payment.status = 'processed';
        payment.processedBy = req.user.id;
        payment.referenceNumber = referenceNumber;
        payment.paymentDate = paymentDate || new Date();
        if (notes) payment.notes = notes;
        await payment.save();

        res.json({ success: true, payment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.completePayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        if (payment.status !== 'processed') {
            return res.status(400).json({ message: 'Payment must be processed first' });
        }

        payment.status = 'completed';
        await payment.save();

        res.json({ success: true, payment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mark payment as completed (for testing without Chapa)
exports.markAsPaid = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        if (payment.status !== 'approved' && payment.status !== 'processing') {
            return res.status(400).json({ message: 'Payment must be approved or processing to mark as paid' });
        }

        payment.status = 'completed';
        payment.paymentDate = new Date();
        payment.referenceNumber = payment.referenceNumber || `MANUAL-${Date.now()}`;
        payment.processedBy = req.user.id;
        payment.notes = (payment.notes || '') + '\n[Marked as paid manually for testing]';

        // Update Chapa data if it exists
        if (payment.chapaData) {
            payment.chapaData.chapaStatus = 'completed';
            payment.chapaData.verifiedAt = new Date();
        }

        await payment.save();

        res.json({
            success: true,
            message: 'Payment marked as completed',
            payment
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Initialize Chapa payment
exports.initializeChapaPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;

        const payment = await Payment.findById(paymentId)
            .populate('supplier', 'name email phone companyName')
            .populate('tender', 'title')
            .populate('requisition', 'title');

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        if (payment.status !== 'approved') {
            return res.status(400).json({ message: 'Payment must be approved before processing with Chapa' });
        }

        // Check if supplier data exists
        if (!payment.supplier) {
            return res.status(400).json({ message: 'Supplier information is missing' });
        }

        // Generate transaction reference
        const txRef = chapaService.generateTxRef('EBID-PAY');

        // Prepare payment data for Chapa with fallbacks
        const supplierName = payment.supplier.companyName || payment.supplier.name || 'Supplier';
        const nameParts = supplierName.split(' ');

        // Use fallback email if supplier email is missing or invalid
        let supplierEmail = payment.supplier.email;
        if (!supplierEmail || !supplierEmail.includes('@')) {
            console.warn('Supplier email missing or invalid, using fallback');
            supplierEmail = 'supplier@gmail.com'; // Chapa requires common email domains
        }

        // Chapa test API is very strict about email domains
        if (!supplierEmail.endsWith('@gmail.com') && !supplierEmail.endsWith('@yahoo.com') && !supplierEmail.endsWith('@outlook.com')) {
            console.warn('Email domain not recognized by Chapa, using fallback');
            supplierEmail = 'supplier@gmail.com';
        }

        // Use fallback phone if supplier phone is missing
        let supplierPhone = payment.supplier.phone;
        if (!supplierPhone || supplierPhone.length < 10) {
            console.warn('Supplier phone missing or invalid, using fallback');
            supplierPhone = '0911234567';
        }

        const chapaPaymentData = {
            amount: payment.amount,
            currency: payment.currency || 'ETB',
            email: supplierEmail,
            firstName: nameParts[0] || 'Supplier',
            lastName: nameParts.slice(1).join(' ') || 'Account',
            phone: supplierPhone,
            txRef: txRef,
            title: `Payment for ${payment.tender?.title || 'Tender'}`,
            description: `Payment to ${supplierName} for tender: ${payment.tender?.title || 'N/A'}`
        };

        console.log('Initializing Chapa payment with data:', {
            paymentId: payment._id,
            amount: chapaPaymentData.amount,
            email: chapaPaymentData.email,
            phone: chapaPaymentData.phone,
            txRef: txRef
        });

        // Initialize payment with Chapa
        const chapaResponse = await chapaService.initializePayment(chapaPaymentData);

        if (!chapaResponse.success) {
            console.error('Chapa initialization failed:', chapaResponse.error);
            return res.status(400).json({
                message: 'Failed to initialize Chapa payment',
                error: chapaResponse.error,
                details: 'Please check the server logs for more information or use "Mark as Paid" for testing'
            });
        }

        // Update payment with Chapa data
        payment.paymentMethod = 'chapa';
        payment.status = 'processing';
        payment.chapaData = {
            txRef: txRef,
            checkoutUrl: chapaResponse.data.data.checkout_url,
            chapaStatus: 'pending'
        };
        await payment.save();

        console.log('Chapa payment initialized successfully:', {
            txRef: txRef,
            checkoutUrl: chapaResponse.data.data.checkout_url
        });

        res.json({
            success: true,
            message: 'Chapa payment initialized successfully',
            checkoutUrl: chapaResponse.data.data.checkout_url,
            txRef: txRef,
            payment
        });
    } catch (error) {
        console.error('Initialize Chapa payment error:', error);
        res.status(500).json({
            message: error.message,
            details: 'An unexpected error occurred. Please try again or use "Mark as Paid" for testing'
        });
    }
};

// Verify Chapa payment
exports.verifyChapaPayment = async (req, res) => {
    try {
        const { txRef } = req.params;

        // Find payment by transaction reference
        const payment = await Payment.findOne({ 'chapaData.txRef': txRef });

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        // Verify with Chapa
        const verificationResponse = await chapaService.verifyPayment(txRef);

        if (!verificationResponse.success) {
            return res.status(400).json({
                message: 'Failed to verify payment',
                error: verificationResponse.error
            });
        }

        const chapaData = verificationResponse.data;

        // Update payment based on Chapa response
        if (chapaData.status === 'success') {
            payment.status = 'completed';
            payment.chapaData.chapaStatus = 'success';
            payment.chapaData.chapaReference = chapaData.data.reference;
            payment.chapaData.verifiedAt = new Date();
            payment.paymentDate = new Date();
            payment.referenceNumber = chapaData.data.reference;
            payment.processedBy = req.user?.id;
        } else {
            payment.status = 'failed';
            payment.chapaData.chapaStatus = chapaData.status;
        }

        await payment.save();

        res.json({
            success: true,
            message: `Payment ${chapaData.status}`,
            payment,
            chapaData
        });
    } catch (error) {
        console.error('Verify Chapa payment error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Webhook handler for Chapa
exports.chapaWebhook = async (req, res) => {
    try {
        const webhookData = req.body;

        console.log('Chapa webhook received:', webhookData);

        // Verify webhook signature if needed
        const webhookSecret = process.env.CHAPA_WEBHOOK_SECRET;
        const signature = req.headers['chapa-signature'];

        // Find payment by transaction reference
        const payment = await Payment.findOne({ 'chapaData.txRef': webhookData.tx_ref });

        if (!payment) {
            console.log('Payment not found for tx_ref:', webhookData.tx_ref);
            return res.status(404).json({ message: 'Payment not found' });
        }

        // Update payment status based on webhook
        if (webhookData.status === 'success') {
            payment.status = 'completed';
            payment.chapaData.chapaStatus = 'success';
            payment.chapaData.chapaReference = webhookData.reference;
            payment.chapaData.verifiedAt = new Date();
            payment.paymentDate = new Date();
            payment.referenceNumber = webhookData.reference;
        } else if (webhookData.status === 'failed') {
            payment.status = 'failed';
            payment.chapaData.chapaStatus = 'failed';
        }

        await payment.save();

        res.json({ success: true, message: 'Webhook processed' });
    } catch (error) {
        console.error('Chapa webhook error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get Chapa payment status
exports.getChapaPaymentStatus = async (req, res) => {
    try {
        const { paymentId } = req.params;

        const payment = await Payment.findById(paymentId)
            .populate('supplier', 'name email companyName')
            .populate('tender', 'title')
            .populate('requisition', 'title');

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        if (!payment.chapaData || !payment.chapaData.txRef) {
            return res.status(400).json({ message: 'This is not a Chapa payment' });
        }

        // Verify current status with Chapa
        const verificationResponse = await chapaService.verifyPayment(payment.chapaData.txRef);

        res.json({
            success: true,
            payment,
            chapaStatus: verificationResponse.success ? verificationResponse.data : null
        });
    } catch (error) {
        console.error('Get Chapa payment status error:', error);
        res.status(500).json({ message: error.message });
    }
};
