const express = require('express');
const {
    createBudget,
    getAllBudgets,
    getBudget,
    checkBudget,
    allocateBudget,
    updateBudget,
    deleteBudget
} = require('../controllers/budgetController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
    .get(protect, authorize('finance', 'administrator'), getAllBudgets)
    .post(protect, authorize('finance', 'administrator'), createBudget);

router.route('/:id')
    .get(protect, authorize('finance', 'administrator'), getBudget)
    .put(protect, authorize('finance', 'administrator'), updateBudget)
    .delete(protect, authorize('finance', 'administrator'), deleteBudget);

router.post('/check', protect, authorize('finance', 'administrator'), checkBudget);
router.put('/:id/allocate', protect, authorize('finance', 'administrator'), allocateBudget);

module.exports = router;
