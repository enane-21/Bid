require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkSupplierEmails() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const suppliers = await User.find({ role: 'supplier' });

        console.log(`Found ${suppliers.length} suppliers:\n`);

        suppliers.forEach((supplier, index) => {
            console.log(`${index + 1}. ${supplier.name || supplier.companyName}`);
            console.log(`   Email: ${supplier.email || 'NOT SET'}`);
            console.log(`   Phone: ${supplier.phone || 'NOT SET'}`);
            console.log(`   Company: ${supplier.companyName || 'N/A'}`);

            // Check if email is Chapa-compatible
            if (supplier.email) {
                const isCompatible = supplier.email.endsWith('@gmail.com') ||
                    supplier.email.endsWith('@yahoo.com') ||
                    supplier.email.endsWith('@outlook.com');
                console.log(`   Chapa Compatible: ${isCompatible ? '✓ YES' : '✗ NO (will use fallback)'}`);
            } else {
                console.log(`   Chapa Compatible: ✗ NO (will use fallback)`);
            }
            console.log('');
        });

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkSupplierEmails();
