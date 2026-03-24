const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { sendApprovalNotification } = require('../utils/emailService');

exports.getAllUsers = async (req, res) => {
    try {
        const { role, isApproved, search } = req.query;
        const query = {};

        if (role) query.role = role;
        if (isApproved !== undefined) query.isApproved = isApproved === 'true';

        // Search by name or email
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: users.length, users });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update fields
        const { password, ...otherFields } = req.body;

        Object.keys(otherFields).forEach(key => {
            user[key] = otherFields[key];
        });

        // Only update password if provided
        if (password && password.trim() !== '') {
            user.password = password; // Will be hashed by pre-save hook
        }

        await user.save();

        // Return user without password
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({ success: true, message: 'User updated successfully', user: userResponse });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.deleteOne();
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Administrator approves supplier registration
exports.approveUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'supplier') {
            return res.status(400).json({ message: 'Only suppliers need approval' });
        }

        if (!user.isVerified) {
            return res.status(400).json({ message: 'Supplier must verify their email first' });
        }

        user.isApproved = true;
        user.approvedBy = req.user.id;
        await user.save();

        // Send approval notification email
        await sendApprovalNotification(user);

        res.json({ success: true, message: 'Supplier approved successfully', user: user.toObject({ getters: true, virtuals: false }) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Administrator manually verifies supplier email
exports.verifyUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'supplier') {
            return res.status(400).json({ message: 'Only suppliers need email verification' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Supplier email is already verified' });
        }

        user.isVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        res.json({ success: true, message: 'Supplier email verified successfully', user: user.toObject({ getters: true, virtuals: false }) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Administrator toggles supplier active status
exports.toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'supplier') {
            return res.status(400).json({ message: 'Only suppliers can be activated/deactivated' });
        }

        // Toggle active status
        user.isActive = !user.isActive;
        await user.save();

        const status = user.isActive ? 'activated' : 'deactivated';
        res.json({
            success: true,
            message: `Supplier ${status} successfully`,
            user: user.toObject({ getters: true, virtuals: false })
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get pending supplier approvals
exports.getPendingSuppliers = async (req, res) => {
    try {
        const suppliers = await User.find({
            role: 'supplier',
            $or: [
                { isVerified: false },
                { isApproved: false }
            ]
        }).select('-password').sort({ createdAt: -1 });

        res.json({ success: true, count: suppliers.length, suppliers });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin creates a new user account
exports.createUser = async (req, res) => {
    try {
        const { name, email, password, role, department, phone, address } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Validate role
        const validRoles = ['department_head', 'storekeeper', 'purchasing_team', 'finance', 'administrator'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role specified' });
        }

        // Create user (password will be hashed by pre-save hook)
        const user = await User.create({
            name,
            email,
            password, // Don't hash here - let the model's pre-save hook handle it
            role,
            department: role === 'department_head' ? department : undefined,
            phone,
            address,
            isApproved: true, // Admin-created users are auto-approved
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'User account created successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department
            }
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get user statistics for admin dashboard
exports.getUserStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isApproved: true });
        const pendingSuppliers = await User.countDocuments({ role: 'supplier', isApproved: false });

        const usersByRole = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            stats: {
                totalUsers,
                activeUsers,
                pendingSuppliers,
                usersByRole
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
