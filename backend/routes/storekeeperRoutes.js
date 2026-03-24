const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const storekeeperController = require('../controllers/storekeeperController');

// All routes require authentication and storekeeper role
router.use(protect);
router.use(authorize('storekeeper', 'administrator'));

// Requisition checking routes
router.get('/pending-checks', storekeeperController.getPendingChecks);
router.post('/check-availability/:id', storekeeperController.checkAvailability);

// Items receipt routes
router.get('/pending-receipts', storekeeperController.getPendingReceipts);
router.post('/receive-items/:id', storekeeperController.receiveItems);

// Inventory management routes (CRUD operations)
router.get('/inventory', storekeeperController.getInventory);
router.post('/inventory', storekeeperController.createInventoryItem);
router.get('/inventory/:id', storekeeperController.getInventoryItem);
router.put('/inventory/:id', storekeeperController.updateInventoryItem);
router.delete('/inventory/:id', storekeeperController.deleteInventoryItem);
router.post('/inventory/:id/adjust', storekeeperController.adjustInventory);

// Dashboard
router.get('/dashboard', storekeeperController.getDashboardStats);

module.exports = router;
