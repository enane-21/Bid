const Product = require('../models/Product');
const Bid = require('../models/Bid');

exports.createProduct = async (req, res) => {
    try {
        const product = await Product.create({
            ...req.body,
            seller: req.user.id
        });
        res.status(201).json({ success: true, product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllProducts = async (req, res) => {
    try {
        const { category, status, search } = req.query;
        const query = {};

        if (category) query.category = category;
        if (status) query.status = status;
        if (search) query.title = { $regex: search, $options: 'i' };

        const products = await Product.find(query)
            .populate('seller', 'name email')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: products.length, products });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('seller', 'name email phone');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const bids = await Bid.find({ product: product._id })
            .populate('bidder', 'name')
            .sort({ timestamp: -1 })
            .limit(10);

        res.json({ success: true, product, bids });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({ success: true, product: updatedProduct });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await product.deleteOne();
        res.json({ success: true, message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
