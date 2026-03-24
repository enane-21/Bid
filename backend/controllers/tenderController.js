const TenderFile = require('../models/TenderFile');
const Requisition = require('../models/Requisition');
const Bid = require('../models/Bid');

exports.createTender = async (req, res) => {
    try {
        const requisition = await Requisition.findById(req.body.requisition);

        if (!requisition) {
            return res.status(404).json({ message: 'Requisition not found' });
        }

        if (requisition.status !== 'arranged') {
            return res.status(400).json({ message: 'Only arranged requisitions can have tenders' });
        }

        const tenderData = {
            ...req.body,
            uploadedBy: req.user.id,
            status: 'draft'
        };

        // Handle file upload if present
        if (req.file) {
            tenderData.documents = [{
                filename: req.file.filename,
                path: req.file.path,
                uploadedAt: new Date(),
                documentType: 'tender_document'
            }];
        }

        const tender = await TenderFile.create(tenderData);

        res.status(201).json({ success: true, tender });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Publish tender announcement
exports.publishTender = async (req, res) => {
    try {
        const tender = await TenderFile.findById(req.params.id);

        if (!tender) {
            return res.status(404).json({ message: 'Tender not found' });
        }

        if (tender.status !== 'draft') {
            return res.status(400).json({ message: 'Only draft tenders can be published' });
        }

        tender.status = 'published';
        tender.publishedBy = req.user.id;
        tender.publishedDate = new Date();
        await tender.save();

        res.json({ success: true, tender });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Activate tender (open for bidding)
exports.activateTender = async (req, res) => {
    try {
        const tender = await TenderFile.findById(req.params.id);

        if (!tender) {
            return res.status(404).json({ message: 'Tender not found' });
        }

        if (tender.status !== 'published') {
            return res.status(400).json({ message: 'Only published tenders can be activated' });
        }

        tender.status = 'active';
        await tender.save();

        res.json({ success: true, tender });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllTenders = async (req, res) => {
    try {
        const { status } = req.query;
        const query = {};

        if (status) query.status = status;

        // Suppliers can only see published and active tenders
        if (req.user.role === 'supplier') {
            query.status = { $in: ['published', 'active'] };
        }

        const tenders = await TenderFile.find(query)
            .populate('requisition')
            .populate('uploadedBy', 'name')
            .populate('publishedBy', 'name')
            .sort({ createdAt: -1 });

        // Get bid counts for each tender
        const tendersWithBidCount = await Promise.all(
            tenders.map(async (tender) => {
                const bidCount = await Bid.countDocuments({ tenderFile: tender._id });
                return {
                    ...tender.toObject(),
                    bidCount
                };
            })
        );

        res.json({ success: true, count: tendersWithBidCount.length, tenders: tendersWithBidCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getTender = async (req, res) => {
    try {
        const tender = await TenderFile.findById(req.params.id)
            .populate('requisition')
            .populate('uploadedBy', 'name')
            .populate('publishedBy', 'name')
            .populate('disabledBy', 'name')
            .populate('closedBy', 'name');

        if (!tender) {
            return res.status(404).json({ message: 'Tender not found' });
        }

        res.json({ success: true, tender });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.disableTender = async (req, res) => {
    try {
        const tender = await TenderFile.findById(req.params.id);

        if (!tender) {
            return res.status(404).json({ message: 'Tender not found' });
        }

        tender.status = 'disabled';
        tender.disabledBy = req.user.id;
        await tender.save();

        res.json({ success: true, tender });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.closeTender = async (req, res) => {
    try {
        const tender = await TenderFile.findById(req.params.id);

        if (!tender) {
            return res.status(404).json({ message: 'Tender not found' });
        }

        tender.status = 'closed';
        tender.closedBy = req.user.id;
        tender.closedDate = new Date();
        await tender.save();

        res.json({ success: true, tender });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
