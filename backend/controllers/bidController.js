const Bid = require('../models/Bid');
const TenderFile = require('../models/TenderFile');
const User = require('../models/User');

exports.submitBid = async (req, res) => {
    try {
        const { tenderFileId, financialProposal, technicalProposal } = req.body;

        // Check if supplier is approved
        const supplier = await User.findById(req.user.id);
        if (!supplier.isApproved) {
            return res.status(403).json({ message: 'Your supplier account is not approved yet' });
        }

        const tender = await TenderFile.findById(tenderFileId);
        if (!tender) {
            return res.status(404).json({ message: 'Tender not found' });
        }

        if (!['published', 'active'].includes(tender.status)) {
            return res.status(400).json({ message: 'Tender is not accepting bids' });
        }

        if (new Date() > tender.endDate) {
            return res.status(400).json({ message: 'Tender has ended' });
        }

        // Check if supplier already submitted a bid
        const existingBid = await Bid.findOne({
            tenderFile: tenderFileId,
            supplier: req.user.id
        });

        if (existingBid) {
            return res.status(400).json({ message: 'You have already submitted a bid for this tender' });
        }

        const bid = await Bid.create({
            tenderFile: tenderFileId,
            supplier: req.user.id,
            financialProposal,
            technicalProposal
        });

        const populatedBid = await Bid.findById(bid._id)
            .populate('supplier', 'name email companyName');

        res.status(201).json({ success: true, bid: populatedBid });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getBidsByTender = async (req, res) => {
    try {
        const bids = await Bid.find({ tenderFile: req.params.tenderId })
            .populate('supplier', 'name email companyName')
            .populate('evaluation.evaluatedBy', 'name')
            .sort({ timestamp: -1 });

        res.json({ success: true, count: bids.length, bids });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSupplierBids = async (req, res) => {
    try {
        const bids = await Bid.find({ supplier: req.user.id })
            .populate('tenderFile', 'title endDate status')
            .sort({ timestamp: -1 });

        res.json({ success: true, count: bids.length, bids });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.evaluateBid = async (req, res) => {
    try {
        const { technicalScore, financialScore, notes, recommendation, status } = req.body;

        const bid = await Bid.findById(req.params.id);
        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        const totalScore = (technicalScore || 0) + (financialScore || 0);

        bid.evaluation = {
            technicalScore,
            financialScore,
            totalScore,
            evaluatedBy: req.user.id,
            evaluationDate: new Date(),
            notes,
            recommendation
        };

        bid.status = status || 'under_evaluation';
        await bid.save();

        res.json({ success: true, bid });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.announceWinner = async (req, res) => {
    try {
        const Requisition = require('../models/Requisition');
        const Payment = require('../models/Payment');

        const bid = await Bid.findById(req.params.id)
            .populate('tenderFile')
            .populate('supplier', 'name email companyName');

        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        // Set all other bids for this tender as rejected
        await Bid.updateMany(
            { tenderFile: bid.tenderFile._id, _id: { $ne: bid._id } },
            { status: 'rejected' }
        );

        bid.status = 'winner';
        bid.isWinner = true;
        bid.winnerAnnouncedBy = req.user.id;
        bid.winnerAnnouncedDate = new Date();
        await bid.save();

        // Update tender status to closed
        await TenderFile.findByIdAndUpdate(bid.tenderFile._id, {
            status: 'closed',
            closedBy: req.user.id,
            closedDate: new Date()
        });

        // Update requisition status to items_ordered
        await Requisition.findByIdAndUpdate(bid.tenderFile.requisition, {
            status: 'items_ordered'
        });

        // Automatically create payment record
        const existingPayment = await Payment.findOne({
            requisition: bid.tenderFile.requisition
        });

        if (!existingPayment) {
            const supplierName = bid.supplier.companyName || bid.supplier.name;
            await Payment.create({
                requisition: bid.tenderFile.requisition,
                tender: bid.tenderFile._id,
                winningBid: bid._id,
                supplier: bid.supplier._id,
                amount: bid.financialProposal.proposedPrice,
                currency: bid.financialProposal.currency || 'ETB',
                paymentMethod: 'chapa',
                status: 'pending',
                notes: `Payment for ${bid.tenderFile.title} to ${supplierName}`
            });
            console.log('✅ Payment record created automatically');
        }

        // TODO: Send email notifications to winner and losers
        // This would require email service integration

        res.json({
            success: true,
            message: 'Winner announced successfully. Payment record created for Finance Department.',
            bid
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get winner for a tender
exports.getWinner = async (req, res) => {
    try {
        const winner = await Bid.findOne({
            tenderFile: req.params.tenderId,
            isWinner: true
        })
            .populate('supplier', 'name email companyName phone')
            .populate('tenderFile', 'title')
            .populate('winnerAnnouncedBy', 'name');

        if (!winner) {
            return res.status(404).json({ message: 'No winner announced yet' });
        }

        res.json({ success: true, winner });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get bid count for a tender
exports.getBidCount = async (req, res) => {
    try {
        const count = await Bid.countDocuments({ tenderFile: req.params.tenderId });
        res.json({ success: true, count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
