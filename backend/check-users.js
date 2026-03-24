const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Connected to MongoDB');

        const User = mongoose.model('User', new mongoose.Schema({
            name: String,
            email: String,
            password: String,
            role: String,
            isApproved: Boolean,
            isVerified: Boolean
        }));

        // Find all users with purchasing role
        const purchasingUsers = await User.find({ role: 'purchasing_team' });
        console.log('\n=== Purchasing Team Users ===');
        console.log('Found:', purchasingUsers.length, 'user(s)');

        purchasingUsers.forEach((user, index) => {
            console.log(`\nUser ${index + 1}:`);
            console.log('  Email:', user.email);
            console.log('  Name:', user.name);
            console.log('  Approved:', user.isApproved);
            console.log('  Verified:', user.isVerified);
            console.log('  Password hash:', user.password.substring(0, 20) + '...');
        });

        // Test the specific email
        const testEmail = 'purchasing@test.com';
        const user = await User.findOne({ email: testEmail });

        if (user) {
            console.log(`\n=== Testing ${testEmail} ===`);
            console.log('User found:', user.name);

            // Test password
            const testPassword = 'password123';
            const isMatch = await bcrypt.compare(testPassword, user.password);
            console.log('Password test (password123):', isMatch ? '✓ CORRECT' : '✗ WRONG');

            if (!isMatch) {
                console.log('\n⚠️  Password does not match!');
                console.log('Creating new user with correct password...');

                await User.deleteOne({ email: testEmail });
                const hashedPassword = await bcrypt.hash(testPassword, 10);

                await User.create({
                    name: 'Purchasing Officer',
                    email: testEmail,
                    password: hashedPassword,
                    role: 'purchasing_team',
                    isApproved: true,
                    isVerified: true
                });

                console.log('✓ New user created with correct password');
            }
        } else {
            console.log(`\n⚠️  User ${testEmail} not found!`);
            console.log('Creating user...');

            const hashedPassword = await bcrypt.hash('password123', 10);
            await User.create({
                name: 'Purchasing Officer',
                email: testEmail,
                password: hashedPassword,
                role: 'purchasing_team',
                isApproved: true,
                isVerified: true
            });

            console.log('✓ User created successfully');
        }

        console.log('\n=== FINAL CREDENTIALS ===');
        console.log('Email: purchasing@test.com');
        console.log('Password: password123');
        console.log('\n✅ Try logging in now!');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
};

checkUsers();
