const mongoose = require('mongoose');

const requisitionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    estimatedBudget: {
        type: Number,
        required: true,
        min: 0
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved_by_director', 'rejected', 'checked_by_storekeeper', 'budget_verified', 'arranged', 'items_ordered', 'items_received', 'completed'],
        default: 'pending'
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    storekeeperCheck: {
        checkedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        isAvailableInStore: Boolean,
        checkDate: Date,
        notes: String
    },
    budgetVerification: {
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        isApproved: Boolean,
        verificationDate: Date,
        allocatedAmount: Number,
        notes: String
    },
    arrangedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    itemsReceived: {
        receivedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        receivedDate: Date,
        quantityReceived: Number,
        notes: String,
        addedToInventory: {
            type: Boolean,
            default: false
        }
    },
    approvalDate: Date,
    rejectionReason: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Requisition', requisitionSchema);
