const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    requisition: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Requisition',
        required: true
    },
    tender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TenderFile',
        required: true
    },
    winningBid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bid',
        required: true
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'ETB'
    },
    paymentMethod: {
        type: String,
        enum: ['bank_transfer', 'check', 'cash', 'letter_of_credit', 'chapa'],
        default: 'bank_transfer'
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'processing', 'processed', 'completed', 'rejected', 'failed'],
        default: 'pending'
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    paymentDate: Date,
    referenceNumber: String,
    notes: String,
    // Chapa-specific fields
    chapaData: {
        txRef: String,
        checkoutUrl: String,
        chapaReference: String,
        chapaStatus: String,
        verifiedAt: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Payment', paymentSchema);
