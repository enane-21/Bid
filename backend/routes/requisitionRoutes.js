const express = require('express');
const {
    createRequisition,
    getAllRequisitions,
    getRequisition,
    approveRequisition,
    rejectRequisition,
    storekeeperCheck,
    verifyBudget,
    arrangeRequisition
} = require('../controllers/requisitionController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
    .get(protect, getAllRequisitions)
    .post(protect, authorize('department_head', 'administrator'), createRequisition);

router.route('/:id')
    .get(protect, getRequisition);

router.put('/:id/approve', protect, authorize('department_head', 'administrator'), approveRequisition);
router.put('/:id/reject', protect, authorize('department_head', 'administrator'), rejectRequisition);
router.put('/:id/storekeeper-check', protect, authorize('storekeeper', 'administrator'), storekeeperCheck);
router.put('/:id/verify-budget', protect, authorize('finance', 'administrator'), verifyBudget);
router.put('/:id/arrange', protect, authorize('purchasing_team', 'administrator'), arrangeRequisition);

module.exports = router;
