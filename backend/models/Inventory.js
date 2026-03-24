const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true
    },
    description: String,
    quantity: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    location: {
        type: String,
        default: 'Main Store'
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    history: [{
        action: {
            type: String,
            enum: ['added', 'removed', 'adjusted', 'received_from_supplier']
        },
        quantity: Number,
        previousQuantity: Number,
        newQuantity: Number,
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        relatedRequisition: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Requisition'
        },
        relatedTender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TenderFile'
        },
        notes: String,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
inventorySchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Inventory', inventorySchema);
