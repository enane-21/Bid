const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
    department: {
        type: String,
        required: true
    },
    fiscalYear: {
        type: String,
        required: true
    },
    totalBudget: {
        type: Number,
        required: true,
        min: 0
    },
    allocatedBudget: {
        type: Number,
        default: 0
    },
    remainingBudget: {
        type: Number,
        default: function () { return this.totalBudget; }
    },
    managedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Budget', budgetSchema);
