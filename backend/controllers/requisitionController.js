const Requisition = require('../models/Requisition');
const Budget = require('../models/Budget');

// Department Head creates requisition
exports.createRequisition = async (req, res) => {
    try {
        const requisition = await Requisition.create({
            ...req.body,
            requestedBy: req.user.id
        });
        res.status(201).json({ success: true, requisition });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all requisitions (filtered by role)
exports.getAllRequisitions = async (req, res) => {
    try {
        const { status } = req.query;
        const query = {};

        if (status) query.status = status;

        // Department heads can see all requisitions (they approve/reject them)
        // Other roles see all requisitions too

        const requisitions = await Requisition.find(query)
            .populate('requestedBy', 'name email department')
            .populate('approvedBy', 'name')
            .populate('storekeeperCheck.checkedBy', 'name')
            .populate('budgetVerification.verifiedBy', 'name')
            .populate('arrangedBy', 'name')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: requisitions.length, requisitions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single requisition
exports.getRequisition = async (req, res) => {
    try {
        const requisition = await Requisition.findById(req.params.id)
            .populate('requestedBy', 'name email department')
            .populate('approvedBy', 'name')
            .populate('storekeeperCheck.checkedBy', 'name')
            .populate('budgetVerification.verifiedBy', 'name')
            .populate('arrangedBy', 'name');

        if (!requisition) {
            return res.status(404).json({ message: 'Requisition not found' });
        }

        res.json({ success: true, requisition });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Department Head approves requisition — sets status to approved_by_director
exports.approveRequisition = async (req, res) => {
    try {
        const requisition = await Requisition.findById(req.params.id);

        if (!requisition) {
            return res.status(404).json({ message: 'Requisition not found' });
        }

        if (requisition.status !== 'pending') {
            return res.status(400).json({ message: 'Requisition is not in pending status' });
        }

        requisition.status = 'approved_by_director';
        requisition.approvedBy = req.user.id;
        requisition.approvalDate = new Date();
        await requisition.save();

        res.json({ success: true, requisition });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Department Head rejects requisition
exports.rejectRequisition = async (req, res) => {
    try {
        const { reason } = req.body;
        const requisition = await Requisition.findById(req.params.id);

        if (!requisition) {
            return res.status(404).json({ message: 'Requisition not found' });
        }

        requisition.status = 'rejected';
        requisition.rejectionReason = reason;
        requisition.approvedBy = req.user.id;
        await requisition.save();

        res.json({ success: true, requisition });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Storekeeper checks if item is available in store
exports.storekeeperCheck = async (req, res) => {
    try {
        const { isAvailableInStore, notes } = req.body;
        const requisition = await Requisition.findById(req.params.id);

        if (!requisition) {
            return res.status(404).json({ message: 'Requisition not found' });
        }

        if (requisition.status !== 'approved_by_director') {
            return res.status(400).json({ message: 'Requisition must be approved first' });
        }

        requisition.storekeeperCheck = {
            checkedBy: req.user.id,
            isAvailableInStore,
            checkDate: new Date(),
            notes
        };

        // If available in store, mark as completed
        if (isAvailableInStore) {
            requisition.status = 'completed';
        } else {
            requisition.status = 'checked_by_storekeeper';
        }

        await requisition.save();

        res.json({ success: true, requisition });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Finance verifies budget
exports.verifyBudget = async (req, res) => {
    try {
        const { isApproved, allocatedAmount, notes } = req.body;
        const requisition = await Requisition.findById(req.params.id)
            .populate('requestedBy', 'name email department');

        if (!requisition) {
            return res.status(404).json({ message: 'Requisition not found' });
        }

        if (requisition.status !== 'checked_by_storekeeper') {
            return res.status(400).json({ message: 'Requisition must be checked by storekeeper first' });
        }

        requisition.budgetVerification = {
            verifiedBy: req.user.id,
            isApproved,
            verificationDate: new Date(),
            allocatedAmount,
            notes
        };

        if (isApproved) {
            // Update the department's Budget document
            const department = requisition.requestedBy.department;
            const currentYear = new Date().getFullYear().toString();

            const budget = await Budget.findOne({
                department,
                fiscalYear: currentYear
            });

            if (!budget) {
                return res.status(404).json({
                    message: `Budget not found for department ${department} in fiscal year ${currentYear}`
                });
            }

            if (budget.remainingBudget < allocatedAmount) {
                return res.status(400).json({
                    message: 'Insufficient budget remaining',
                    remainingBudget: budget.remainingBudget,
                    requestedAmount: allocatedAmount
                });
            }

            // Update budget allocation
            budget.allocatedBudget += allocatedAmount;
            budget.remainingBudget -= allocatedAmount;
            await budget.save();

            requisition.status = 'budget_verified';
        } else {
            requisition.status = 'rejected';
            requisition.rejectionReason = 'Budget not available';
        }

        await requisition.save();

        res.json({ success: true, requisition });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Purchasing team arranges requisition (creates tender)
exports.arrangeRequisition = async (req, res) => {
    try {
        const requisition = await Requisition.findById(req.params.id);

        if (!requisition) {
            return res.status(404).json({ message: 'Requisition not found' });
        }

        if (requisition.status !== 'budget_verified') {
            return res.status(400).json({ message: 'Budget must be verified first' });
        }

        requisition.status = 'arranged';
        requisition.arrangedBy = req.user.id;
        await requisition.save();

        res.json({ success: true, requisition });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
