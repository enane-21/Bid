const express = require('express');
const {
    createProduct,
    getAllProducts,
    getProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
    .get(getAllProducts)
    .post(protect, authorize('seller', 'admin'), createProduct);

router.route('/:id')
    .get(getProduct)
    .put(protect, authorize('seller', 'admin'), updateProduct)
    .delete(protect, authorize('seller', 'admin'), deleteProduct);

module.exports = router;
