const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/emailService');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

exports.register = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role,
            phone,
            address,
            department,
            companyName,
            tinNumber,
            fanNumber,
            finNumber
        } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Validate supplier-specific fields
        if (role === 'supplier') {
            if (!companyName || !tinNumber || !fanNumber || !finNumber || !phone) {
                return res.status(400).json({
                    message: 'Company name, TIN, FAN, FIN, and phone number are required for suppliers'
                });
            }

            // Check for uploaded photos
            if (!req.files || !req.files.nationalIdPhoto || !req.files.selfiePhoto) {
                return res.status(400).json({
                    message: 'National ID photo and selfie photo are required for suppliers'
                });
            }

            // Check for duplicate TIN
            const existingTIN = await User.findOne({ tinNumber });
            if (existingTIN) {
                return res.status(400).json({ message: 'TIN number already registered' });
            }

            // Check for duplicate FAN
            const existingFAN = await User.findOne({ fanNumber });
            if (existingFAN) {
                return res.status(400).json({ message: 'FAN number already registered' });
            }

            // Check for duplicate FIN
            const existingFIN = await User.findOne({ finNumber });
            if (existingFIN) {
                return res.status(400).json({ message: 'FIN number already registered' });
            }

            // Check for duplicate phone
            const existingPhone = await User.findOne({ phone });
            if (existingPhone) {
                return res.status(400).json({ message: 'Phone number already registered' });
            }
        }

        // Create user object with all fields
        const userData = {
            name,
            email,
            password,
            role: role || 'department_head',
            phone,
            address
        };

        // Add role-specific fields
        if (role === 'department_head' && department) {
            userData.department = department;
        }

        let verificationToken;

        if (role === 'supplier') {
            userData.companyName = companyName;
            userData.tinNumber = tinNumber;
            userData.fanNumber = fanNumber;
            userData.finNumber = finNumber;

            // Store file paths
            if (req.files.nationalIdPhoto) {
                userData.nationalIdPhoto = req.files.nationalIdPhoto[0].path;
            }
            if (req.files.selfiePhoto) {
                userData.selfiePhoto = req.files.selfiePhoto[0].path;
            }

            // Generate email verification token
            verificationToken = crypto.randomBytes(32).toString('hex');
            userData.emailVerificationToken = verificationToken;
            userData.emailVerificationExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

            // Suppliers need email verification AND admin approval
            userData.isVerified = false;
            userData.isApproved = false;
        } else {
            // Non-supplier users are auto-approved and verified
            userData.isVerified = true;
            userData.isApproved = true;
        }

        const user = await User.create(userData);

        // Send verification email for suppliers
        if (role === 'supplier' && verificationToken) {
            await sendVerificationEmail(user, verificationToken);
        }

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isApproved: user.isApproved
            }
        });
    } catch (error) {
        console.error('Registration error:', error);

        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: messages.join(', ') });
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ message: `${field} already exists` });
        }

        res.status(500).json({
            message: error.message || 'Registration failed',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if supplier email is verified
        if (user.role === 'supplier' && !user.isVerified) {
            return res.status(403).json({
                message: 'Please verify your email address before logging in. Check your inbox for the verification link.'
            });
        }

        // Check if supplier is approved by admin
        if (user.role === 'supplier' && !user.isApproved) {
            return res.status(403).json({
                message: 'Your account is pending approval by an administrator. You will receive an email once approved.'
            });
        }

        // Check if supplier is active
        if (user.role === 'supplier' && !user.isActive) {
            return res.status(403).json({
                message: 'Your account has been deactivated. Please contact the administrator.'
            });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isApproved: user.isApproved,
                isVerified: user.isVerified,
                department: user.department,
                companyName: user.companyName
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                message: 'Invalid or expired verification token'
            });
        }

        user.isVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Email verified successfully! Your account is now pending administrator approval.'
        });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Email already verified' });
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.emailVerificationToken = verificationToken;
        user.emailVerificationExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
        await user.save();

        // Send verification email
        await sendVerificationEmail(user, verificationToken);

        res.json({
            success: true,
            message: 'Verification email sent successfully'
        });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ message: error.message });
    }
};
