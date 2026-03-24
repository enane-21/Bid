const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createPurchasingUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Connected to MongoDB');

        const User = mongoose.model('User', new mongoose.Schema({
            name: String,
            email: String,
            password: String,
            role: String,
            isApproved: Boolean,
            isVerified: Boolean,
            createdAt: Date
        }));

        // Delete existing user if any
        await User.deleteOne({ email: 'purchasing@test.com' });
        console.log('✓ Cleaned up existing user');

        // Hash password
        const hashedPassword = await bcrypt.hash('password123', 10);
        console.log('✓ Password hashed');

        // Create user directly
        const user = await User.create({
            name: 'Purchasing Officer',
            email: 'purchasing@test.com',
            password: hashedPassword,
            role: 'purchasing_team',
            isApproved: true,
            isVerified: true,
            createdAt: new Date()
        });

        console.log('✓ User created successfully!');
        console.log('\n=== LOGIN CREDENTIALS ===');
        console.log('Email: purchasing@test.com');
        console.log('Password: password123');
        console.log('\n=== User Details ===');
        console.log('ID:', user._id);
        console.log('Name:', user.name);
        console.log('Role:', user.role);
        console.log('Approved:', user.isApproved);
        console.log('Verified:', user.isVerified);

        // Test password comparison
        const isMatch = await bcrypt.compare('password123', user.password);
        console.log('\n✓ Password verification test:', isMatch ? 'PASSED' : 'FAILED');

        await mongoose.connection.close();
        console.log('\n✅ Done! Try logging in now.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

createPurchasingUser();
