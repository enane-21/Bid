const mongoose = require('mongoose');
require('dotenv').config();

const Budget = require('./models/Budget');

async function fixCSBudget() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const currentYear = new Date().getFullYear().toString();

        // Find CS budget
        const csBudget = await Budget.findOne({
            department: 'CS',
            fiscalYear: currentYear
        });

        if (!csBudget) {
            console.log('CS budget not found');
            process.exit(1);
        }

        console.log('Current CS Budget:');
        console.log(`  Total: $${csBudget.totalBudget}`);
        console.log(`  Allocated: $${csBudget.allocatedBudget}`);
        console.log(`  Remaining: $${csBudget.remainingBudget}`);

        console.log('\nAllocated requisitions total: $30');
        console.log('  - Laptop: $20');
        console.log('  - Lab Equipment: $10');

        console.log('\nFIXING THE BUDGET:');
        console.log('  Setting Total Budget to $50 (to accommodate $30 allocated + buffer)');
        console.log('  Setting Allocated Budget to $30');
        console.log('  Setting Remaining Budget to $20');

        csBudget.totalBudget = 50;
        csBudget.allocatedBudget = 30;
        csBudget.remainingBudget = 20;

        await csBudget.save();

        console.log('\n✓ CS Budget updated successfully!');
        console.log('\nNew CS Budget:');
        console.log(`  Total: $${csBudget.totalBudget}`);
        console.log(`  Allocated: $${csBudget.allocatedBudget}`);
        console.log(`  Remaining: $${csBudget.remainingBudget}`);

        console.log('\nPlease refresh the Finance dashboard to see the updated values.');
        console.log('The "Total Allocated" should now show $30 instead of $0.');

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixCSBudget();
