const express = require('express');
const {
    sendMessage,
    getAllMessages,
    getReceivedMessages,
    getSentMessages,
    markAsRead,
    deleteMessage
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getAllMessages);
router.post('/', protect, sendMessage);
router.get('/received', protect, getReceivedMessages);
router.get('/sent', protect, getSentMessages);
router.put('/:id/read', protect, markAsRead);
router.delete('/:id', protect, deleteMessage);

module.exports = router;
