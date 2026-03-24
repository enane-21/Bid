const express = require('express');
const {
    createPayment,
    getAllPayments,
    getPayment,
    approvePayment,
    processPayment,
    completePayment,
    markAsPaid,
    initializeChapaPayment,
    verifyChapaPayment,
    chapaWebhook,
    getChapaPaymentStatus
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
    .get(protect, authorize('finance', 'administrator'), getAllPayments)
    .post(protect, authorize('finance', 'administrator'), createPayment);

router.route('/:id')
    .get(protect, authorize('finance', 'administrator'), getPayment);

router.put('/:id/approve', protect, authorize('finance', 'administrator'), approvePayment);
router.put('/:id/process', protect, authorize('finance', 'administrator'), processPayment);
router.put('/:id/complete', protect, authorize('finance', 'administrator'), completePayment);
router.put('/:id/mark-paid', protect, authorize('finance', 'administrator'), markAsPaid);

// Chapa payment routes
router.post('/:paymentId/chapa/initialize', protect, authorize('finance', 'administrator'), initializeChapaPayment);
router.get('/chapa/verify/:txRef', verifyChapaPayment);
router.post('/webhook', chapaWebhook); // Public endpoint for Chapa webhooks
router.get('/:paymentId/chapa/status', protect, authorize('finance', 'administrator'), getChapaPaymentStatus);

module.exports = router;
