const mongoose = require('mongoose');

const tenderFileSchema = new mongoose.Schema({
    requisition: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Requisition',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    announcementDetails: {
        announcementNumber: String,
        publicationDate: Date,
        closingDate: Date,
        openingDate: Date,
        venue: String
    },
    documents: [{
        filename: String,
        path: String,
        uploadedAt: Date,
        documentType: String // 'bid_document', 'technical_specification', 'terms_conditions'
    }],
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'active', 'closed', 'disabled', 'evaluated', 'completed'],
        default: 'draft'
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    publishedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    publishedDate: Date,
    disabledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    closedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    closedDate: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('TenderFile', tenderFileSchema);
