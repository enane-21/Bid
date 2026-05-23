require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/database');

const seedAdmin = async () => {
    try {
        await connectDB();
        
        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@ebid.com' });
        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        // Create admin user
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@ebid.com',
            password: 'admin123',
            role: 'administrator',
            isVerified: true,
            isApproved: true,
            isActive: true
        });

        console.log('Admin user created successfully:', admin.email);
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error.message);
        process.exit(1);
    }
};

seedAdmin();
