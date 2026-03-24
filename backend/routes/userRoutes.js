const express = require('express');
const {
    getAllUsers,
    getUser,
    updateUser,
    deleteUser,
    approveUser,
    verifyUser,
    toggleUserStatus,
    getPendingSuppliers,
    createUser,
    getUserStats
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, authorize('administrator'), getAllUsers);
router.post('/create', protect, authorize('administrator'), createUser);
router.get('/stats', protect, authorize('administrator'), getUserStats);
router.get('/pending-suppliers', protect, authorize('administrator'), getPendingSuppliers);
router.route('/:id')
    .get(protect, getUser)
    .put(protect, authorize('administrator'), updateUser)
    .delete(protect, authorize('administrator'), deleteUser);

router.put('/:id/approve', protect, authorize('administrator'), approveUser);
router.put('/:id/verify', protect, authorize('administrator'), verifyUser);
router.put('/:id/toggle-status', protect, authorize('administrator'), toggleUserStatus);

module.exports = router;
