const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
    tenderFile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TenderFile',
        required: true
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    financialProposal: {
        proposedPrice: {
            type: Number,
            required: true,
            min: 0
        },
        currency: {
            type: String,
            default: 'ETB'
        },
        paymentTerms: String,
        validityPeriod: String
    },
    technicalProposal: {
        specifications: String,
        deliveryTime: String,
        warranty: String,
        afterSalesService: String
    },
    documents: [{
        filename: String,
        path: String,
        uploadedAt: Date,
        documentType: String // 'financial', 'technical', 'company_profile', 'license'
    }],
    status: {
        type: String,
        enum: ['submitted', 'under_evaluation', 'technically_qualified', 'financially_qualified', 'approved', 'rejected', 'winner'],
        default: 'submitted'
    },
    evaluation: {
        technicalScore: Number,
        financialScore: Number,
        totalScore: Number,
        evaluatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        evaluationDate: Date,
        notes: String,
        recommendation: String
    },
    isWinner: {
        type: Boolean,
        default: false
    },
    winnerAnnouncedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    winnerAnnouncedDate: Date,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

bidSchema.index({ tenderFile: 1, timestamp: -1 });

module.exports = mongoose.model('Bid', bidSchema);
