const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['administrator', 'purchasing_team', 'storekeeper', 'finance', 'department_head', 'supplier'],
        default: 'department_head'
    },
    phone: {
        type: String,
        unique: true,
        sparse: true,
        validate: {
            validator: function (v) {
                // +2519XXXXXXXX (9 digits after +251) or 09XXXXXXXX (8 digits after 09)
                return !v || /^(\+2519\d{8}|09\d{8})$/.test(v);
            },
            message: 'Phone must be +2519XXXXXXXX or 09XXXXXXXX (8 digits after prefix)'
        }
    },
    address: String,
    department: String, // For department heads
    companyName: String, // For suppliers
    tinNumber: {
        type: String,
        unique: true,
        sparse: true,
        validate: {
            validator: function (v) {
                return !v || /^\d{10}$/.test(v);
            },
            message: 'TIN number must be exactly 10 digits'
        }
    },
    fanNumber: {
        type: String,
        unique: true,
        sparse: true,
        validate: {
            validator: function (v) {
                return !v || /^\d{16}$/.test(v);
            },
            message: 'FAN number must be exactly 16 digits'
        }
    },
    finNumber: {
        type: String,
        unique: true,
        sparse: true,
        validate: {
            validator: function (v) {
                return !v || /^\d{12}$/.test(v);
            },
            message: 'FIN number must be exactly 12 digits'
        }
    },
    businessLicense: String,
    nationalIdPhoto: String, // Path to uploaded national ID photo
    selfiePhoto: String, // Path to uploaded selfie photo
    isVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    isApproved: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
