require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const createAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@ebid.com' });
        if (existingAdmin) {
            console.log('Admin user already exists!');
            console.log('Email: admin@ebid.com');
            console.log('You can update the password if needed.');
            process.exit(0);
        }

        // Create admin user
        const adminUser = await User.create({
            name: 'System Administrator',
            email: 'admin@ebid.com',
            password: 'admin123', // Will be hashed by pre-save hook
            role: 'administrator',
            isApproved: true,
            isVerified: true
        });

        console.log('\n✅ Admin user created successfully!');
        console.log('==========================================');
        console.log('Email: admin@ebid.com');
        console.log('Password: admin123');
        console.log('Role: administrator');
        console.log('==========================================');
        console.log('\n⚠️  Please change the password after first login!');

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
