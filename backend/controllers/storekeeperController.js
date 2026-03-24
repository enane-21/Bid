const Requisition = require('../models/Requisition');
const Inventory = require('../models/Inventory');
const TenderFile = require('../models/TenderFile');

// Get all requisitions pending storekeeper check
exports.getPendingChecks = async (req, res) => {
    try {
        const requisitions = await Requisition.find({
            status: 'approved_by_director'
        })
            .populate('requestedBy', 'name email department')
            .populate('approvedBy', 'name')
            .sort({ approvalDate: 1 });

        res.json({
            success: true,
            count: requisitions.length,
            requisitions
        });
    } catch (error) {
        console.error('Get pending checks error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Check if item is available in store
exports.checkAvailability = async (req, res) => {
    try {
        const { isAvailableInStore, notes } = req.body;
        const requisition = await Requisition.findById(req.params.id)
            .populate('requestedBy', 'name email department');

        if (!requisition) {
            return res.status(404).json({ message: 'Requisition not found' });
        }

        if (requisition.status !== 'approved_by_director') {
            return res.status(400).json({
                message: 'Requisition must be approved by Department Head first'
            });
        }

        // Record storekeeper check
        requisition.storekeeperCheck = {
            checkedBy: req.user.id,
            isAvailableInStore,
            checkDate: new Date(),
            notes: notes || ''
        };

        // Scenario A: Item found in store
        if (isAvailableInStore) {
            requisition.status = 'completed';

            // Update inventory - remove items from stock
            const inventoryItem = await Inventory.findOne({
                itemName: { $regex: new RegExp(requisition.title, 'i') },
                category: requisition.category
            });

            if (inventoryItem && inventoryItem.quantity >= requisition.quantity) {
                const previousQty = inventoryItem.quantity;
                inventoryItem.quantity -= requisition.quantity;
                inventoryItem.lastUpdatedBy = req.user.id;

                // Add to history
                inventoryItem.history.push({
                    action: 'removed',
                    quantity: requisition.quantity,
                    previousQuantity: previousQty,
                    newQuantity: inventoryItem.quantity,
                    performedBy: req.user.id,
                    relatedRequisition: requisition._id,
                    notes: `Items issued to ${requisition.requestedBy.department || 'department'} - ${requisition.requestedBy.name}`,
                    date: new Date()
                });

                await inventoryItem.save();
            }

            await requisition.save();

            return res.json({
                success: true,
                message: 'Items available in store. Requisition completed. Department can collect items.',
                requisition
            });
        }

        // Scenario B: Item not in store - proceed to finance
        requisition.status = 'checked_by_storekeeper';
        await requisition.save();

        res.json({
            success: true,
            message: 'Items not in store. Requisition forwarded to Finance Department for budget verification.',
            requisition
        });
    } catch (error) {
        console.error('Check availability error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get all requisitions waiting for items to be received
exports.getPendingReceipts = async (req, res) => {
    try {
        // Find requisitions that have been arranged and items ordered
        const requisitions = await Requisition.find({
            status: { $in: ['items_ordered'] }
        })
            .populate('requestedBy', 'name email department')
            .populate('approvedBy', 'name')
            .populate('arrangedBy', 'name')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: requisitions.length,
            requisitions
        });
    } catch (error) {
        console.error('Get pending receipts error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Mark items as received from supplier
exports.receiveItems = async (req, res) => {
    try {
        const { quantityReceived, notes } = req.body;
        const requisition = await Requisition.findById(req.params.id)
            .populate('requestedBy', 'name email department');

        if (!requisition) {
            return res.status(404).json({ message: 'Requisition not found' });
        }

        if (requisition.status !== 'items_ordered') {
            return res.status(400).json({
                message: 'Items must be ordered before they can be received'
            });
        }

        if (!quantityReceived || quantityReceived <= 0) {
            return res.status(400).json({
                message: 'Please specify the quantity received'
            });
        }

        // Record items received
        requisition.itemsReceived = {
            receivedBy: req.user.id,
            receivedDate: new Date(),
            quantityReceived,
            notes: notes || '',
            addedToInventory: true
        };

        requisition.status = 'items_received';

        // Update inventory - add items to stock
        let inventoryItem = await Inventory.findOne({
            itemName: { $regex: new RegExp(requisition.title, 'i') },
            category: requisition.category
        });

        if (!inventoryItem) {
            // Create new inventory item if it doesn't exist
            inventoryItem = await Inventory.create({
                itemName: requisition.title,
                category: requisition.category,
                description: requisition.description,
                quantity: quantityReceived,
                lastUpdatedBy: req.user.id,
                history: [{
                    action: 'received_from_supplier',
                    quantity: quantityReceived,
                    previousQuantity: 0,
                    newQuantity: quantityReceived,
                    performedBy: req.user.id,
                    relatedRequisition: requisition._id,
                    notes: notes || 'Initial stock from supplier',
                    date: new Date()
                }]
            });
        } else {
            // Update existing inventory item
            const previousQty = inventoryItem.quantity;
            inventoryItem.quantity += quantityReceived;
            inventoryItem.lastUpdatedBy = req.user.id;

            // Add to history
            inventoryItem.history.push({
                action: 'received_from_supplier',
                quantity: quantityReceived,
                previousQuantity: previousQty,
                newQuantity: inventoryItem.quantity,
                performedBy: req.user.id,
                relatedRequisition: requisition._id,
                notes: notes || 'Stock received from supplier',
                date: new Date()
            });

            await inventoryItem.save();
        }

        await requisition.save();

        res.json({
            success: true,
            message: `${quantityReceived} items received and added to inventory successfully.`,
            requisition,
            inventory: inventoryItem
        });
    } catch (error) {
        console.error('Receive items error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get all inventory items
exports.getInventory = async (req, res) => {
    try {
        const { category, search } = req.query;
        const query = {};

        if (category) {
            query.category = category;
        }

        if (search) {
            query.itemName = { $regex: search, $options: 'i' };
        }

        const inventory = await Inventory.find(query)
            .populate('lastUpdatedBy', 'name')
            .populate('history.performedBy', 'name')
            .sort({ updatedAt: -1 });

        res.json({
            success: true,
            count: inventory.length,
            inventory
        });
    } catch (error) {
        console.error('Get inventory error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Create new inventory item (Register Available Data)
exports.createInventoryItem = async (req, res) => {
    try {
        const { itemName, category, description, quantity, location } = req.body;

        // Parse quantity to ensure it's a number
        const parsedQuantity = parseInt(quantity) || 0;

        // Check if item already exists
        const existingItem = await Inventory.findOne({
            itemName: { $regex: new RegExp(`^${itemName}$`, 'i') },
            category
        });

        if (existingItem) {
            return res.status(400).json({
                message: 'An item with this name and category already exists. Please update the existing item instead.'
            });
        }

        const inventoryItem = await Inventory.create({
            itemName,
            category,
            description,
            quantity: parsedQuantity,
            location: location || 'Main Store',
            lastUpdatedBy: req.user.id,
            history: [{
                action: 'added',
                quantity: parsedQuantity,
                previousQuantity: 0,
                newQuantity: parsedQuantity,
                performedBy: req.user.id,
                notes: 'Initial registration',
                date: new Date()
            }]
        });

        res.status(201).json({
            success: true,
            message: 'Inventory item registered successfully',
            item: inventoryItem
        });
    } catch (error) {
        console.error('Create inventory item error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update inventory item (Update Data)
exports.updateInventoryItem = async (req, res) => {
    try {
        const { itemName, category, description, quantity, location } = req.body;
        const item = await Inventory.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }

        const previousQty = item.quantity;
        const parsedQuantity = quantity !== undefined ? parseInt(quantity) : undefined;
        const quantityChanged = parsedQuantity !== undefined && parsedQuantity !== previousQty;

        // Update fields
        if (itemName) item.itemName = itemName;
        if (category) item.category = category;
        if (description !== undefined) item.description = description;
        if (parsedQuantity !== undefined) item.quantity = parsedQuantity;
        if (location) item.location = location;
        item.lastUpdatedBy = req.user.id;

        // Add to history if quantity changed
        if (quantityChanged) {
            item.history.push({
                action: 'adjusted',
                quantity: Math.abs(parsedQuantity - previousQty),
                previousQuantity: previousQty,
                newQuantity: parsedQuantity,
                performedBy: req.user.id,
                notes: 'Inventory update',
                date: new Date()
            });
        }

        await item.save();

        res.json({
            success: true,
            message: 'Inventory item updated successfully',
            item
        });
    } catch (error) {
        console.error('Update inventory item error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete inventory item (Delete Data)
exports.deleteInventoryItem = async (req, res) => {
    try {
        const item = await Inventory.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }

        await item.deleteOne();

        res.json({
            success: true,
            message: 'Inventory item deleted successfully'
        });
    } catch (error) {
        console.error('Delete inventory item error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get single inventory item with full history
exports.getInventoryItem = async (req, res) => {
    try {
        const item = await Inventory.findById(req.params.id)
            .populate('lastUpdatedBy', 'name')
            .populate('history.performedBy', 'name')
            .populate('history.relatedRequisition')
            .populate('history.relatedTender');

        if (!item) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }

        res.json({ success: true, item });
    } catch (error) {
        console.error('Get inventory item error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Manually adjust inventory (for corrections, damages, etc.)
exports.adjustInventory = async (req, res) => {
    try {
        const { adjustment, notes } = req.body;
        const item = await Inventory.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }

        if (!adjustment || adjustment === 0) {
            return res.status(400).json({
                message: 'Please specify adjustment amount (positive to add, negative to remove)'
            });
        }

        const previousQty = item.quantity;
        const newQty = previousQty + adjustment;

        if (newQty < 0) {
            return res.status(400).json({
                message: 'Adjustment would result in negative inventory'
            });
        }

        item.quantity = newQty;
        item.lastUpdatedBy = req.user.id;

        // Add to history
        item.history.push({
            action: 'adjusted',
            quantity: Math.abs(adjustment),
            previousQuantity: previousQty,
            newQuantity: newQty,
            performedBy: req.user.id,
            notes: notes || 'Manual adjustment',
            date: new Date()
        });

        await item.save();

        res.json({
            success: true,
            message: 'Inventory adjusted successfully',
            item
        });
    } catch (error) {
        console.error('Adjust inventory error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get storekeeper dashboard statistics
exports.getDashboardStats = async (req, res) => {
    try {
        const pendingChecks = await Requisition.countDocuments({
            status: 'approved_by_director'
        });

        const pendingReceipts = await Requisition.countDocuments({
            status: 'items_ordered'
        });

        const totalInventoryItems = await Inventory.countDocuments();

        const lowStockItems = await Inventory.countDocuments({
            quantity: { $lt: 10 }
        });

        const recentActivity = await Inventory.find()
            .sort({ updatedAt: -1 })
            .limit(5)
            .populate('lastUpdatedBy', 'name');

        res.json({
            success: true,
            stats: {
                pendingChecks,
                pendingReceipts,
                totalInventoryItems,
                lowStockItems,
                recentActivity
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = exports;
