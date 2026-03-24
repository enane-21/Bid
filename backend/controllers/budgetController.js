const Budget = require('../models/Budget');

exports.createBudget = async (req, res) => {
    try {
        const budget = await Budget.create({
            ...req.body,
            managedBy: req.user.id
        });
        res.status(201).json({ success: true, budget });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllBudgets = async (req, res) => {
    try {
        const budgets = await Budget.find()
            .populate('managedBy', 'name')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: budgets.length, budgets });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getBudget = async (req, res) => {
    try {
        const budget = await Budget.findById(req.params.id)
            .populate('managedBy', 'name email');

        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }

        res.json({ success: true, budget });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.checkBudget = async (req, res) => {
    try {
        const { department, amount } = req.body;

        const budget = await Budget.findOne({
            department,
            fiscalYear: new Date().getFullYear().toString()
        });

        if (!budget) {
            return res.status(404).json({ message: 'Budget not found for this department' });
        }

        const isAvailable = budget.remainingBudget >= amount;

        res.json({
            success: true,
            isAvailable,
            remainingBudget: budget.remainingBudget,
            requestedAmount: amount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.allocateBudget = async (req, res) => {
    try {
        const { amount } = req.body;
        const budget = await Budget.findById(req.params.id);

        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }

        if (budget.remainingBudget < amount) {
            return res.status(400).json({ message: 'Insufficient budget' });
        }

        budget.allocatedBudget += amount;
        budget.remainingBudget -= amount;
        await budget.save();

        res.json({ success: true, budget });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.updateBudget = async (req, res) => {
    try {
        const budget = await Budget.findById(req.params.id);

        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }

        const { department, fiscalYear, totalBudget, allocatedBudget } = req.body;

        if (department) budget.department = department;
        if (fiscalYear) budget.fiscalYear = fiscalYear;
        if (totalBudget !== undefined) budget.totalBudget = totalBudget;
        if (allocatedBudget !== undefined) budget.allocatedBudget = allocatedBudget;

        budget.remainingBudget = budget.totalBudget - budget.allocatedBudget;

        await budget.save();

        res.json({ success: true, budget });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteBudget = async (req, res) => {
    try {
        const budget = await Budget.findById(req.params.id);

        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }

        await budget.deleteOne();

        res.json({ success: true, message: 'Budget deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
