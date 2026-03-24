const express = require('express');
const {
    submitBid,
    getBidsByTender,
    getSupplierBids,
    evaluateBid,
    announceWinner,
    getWinner,
    getBidCount
} = require('../controllers/bidController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, authorize('supplier'), submitBid);
router.get('/', protect, authorize('purchasing_team', 'administrator'), async (req, res) => {
    try {
        const Bid = require('../models/Bid');
        const bids = await Bid.find()
            .populate('supplier', 'name email companyName')
            .populate('tenderFile', 'title status')
            .populate('evaluation.evaluatedBy', 'name')
            .sort({ timestamp: -1 });
        res.json({ success: true, count: bids.length, bids });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
router.get('/supplier', protect, authorize('supplier'), getSupplierBids);
router.get('/tender/:tenderId', protect, getBidsByTender);
router.get('/tender/:tenderId/count', protect, getBidCount);
router.get('/tender/:tenderId/winner', protect, getWinner);
router.put('/:id/evaluate', protect, authorize('purchasing_team', 'administrator'), evaluateBid);
router.put('/:id/announce-winner', protect, authorize('purchasing_team', 'administrator'), announceWinner);

module.exports = router;
