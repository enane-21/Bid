const express = require('express');
const multer = require('multer');
const path = require('path');
const {
    createTender,
    publishTender,
    activateTender,
    getAllTenders,
    getTender,
    disableTender,
    closeTender
} = require('../controllers/tenderController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Configure multer for tender documents
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/documents');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'tender-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document/.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
};

const uploadTenderDoc = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: fileFilter
});

router.route('/')
    .get(protect, getAllTenders)
    .post(protect, authorize('purchasing_team', 'administrator'), uploadTenderDoc.single('document'), createTender);

router.route('/:id')
    .get(protect, getTender);

router.put('/:id/publish', protect, authorize('purchasing_team', 'administrator'), publishTender);
router.put('/:id/activate', protect, authorize('purchasing_team', 'administrator'), activateTender);
router.put('/:id/disable', protect, authorize('administrator'), disableTender);
router.put('/:id/close', protect, authorize('purchasing_team', 'administrator'), closeTender);

module.exports = router;
