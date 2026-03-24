const mongoose = require('mongoose');
require('dotenv').config();

const fixPaymentIndex = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const collection = db.collection('payments');

        // List all indexes
        console.log('=== Current Indexes ===');
        const indexes = await collection.indexes();
        indexes.forEach(index => {
            console.log(`Index: ${index.name}`);
            console.log(`  Keys:`, index.key);
            console.log(`  Unique:`, index.unique || false);
            console.log('');
        });

        // Drop the problematic index if it exists
        try {
            await collection.dropIndex('chapaReference_1');
            console.log('✅ Dropped chapaReference_1 index successfully\n');
        } catch (error) {
            if (error.code === 27) {
                console.log('ℹ️  Index chapaReference_1 does not exist (already dropped)\n');
            } else {
                throw error;
            }
        }

        // List indexes after dropping
        console.log('=== Indexes After Fix ===');
        const indexesAfter = await collection.indexes();
        indexesAfter.forEach(index => {
            console.log(`Index: ${index.name}`);
            console.log(`  Keys:`, index.key);
            console.log('');
        });

        console.log('✅ Payment index fixed! You can now create payments.\n');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
};

fixPaymentIndex();
