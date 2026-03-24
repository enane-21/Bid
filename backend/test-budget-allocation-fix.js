const mongoose = require('mongoose');
require('dotenv').config();

const Requisition = require('./models/Requisition');
const Budget = require('./models/Budget');
const User = require('./models/User');

async function testBudgetAllocationFix() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find a department head user
        const deptHead = await User.findOne({ role: 'department_head' });
        if (!deptHead) {
            console.log('No department head found. Please create one first.');
            process.exit(1);
        }

        console.log(`\nUsing department head: ${deptHead.name} (${deptHead.department})`);

        // Check if budget exists for this department
        const currentYear = new Date().getFullYear().toString();
        let budget = await Budget.findOne({
            department: deptHead.department,
            fiscalYear: currentYear
        });

        if (!budget) {
            console.log(`\nNo budget found for ${deptHead.department} in ${currentYear}`);
            console.log('Please create a budget in the Finance Department first.');
            process.exit(1);
        }

        console.log(`\nBudget BEFORE verification:`);
        console.log(`  Total Budget: $${budget.totalBudget}`);
        console.log(`  Allocated: $${budget.allocatedBudget}`);
        console.log(`  Remaining: $${budget.remainingBudget}`);

        // Find requisitions that are ready for budget verification
        const requisitions = await Requisition.find({
            status: 'checked_by_storekeeper',
            requestedBy: deptHead._id
        }).populate('requestedBy', 'name email department');

        if (requisitions.length === 0) {
            console.log('\nNo requisitions found in "checked_by_storekeeper" status.');
            console.log('The fix is working correctly - Budget allocation only happens when requisitions are verified.');

            // Show current allocations
            const allBudgets = await Budget.find({ fiscalYear: currentYear });
            console.log(`\nAll department budgets for ${currentYear}:`);
            let totalAllocated = 0;
            for (const b of allBudgets) {
                console.log(`  ${b.department}: Total=$${b.totalBudget}, Allocated=$${b.allocatedBudget}, Remaining=$${b.remainingBudget}`);
                totalAllocated += b.allocatedBudget;
            }
            console.log(`\nTotal Allocated across all departments: $${totalAllocated}`);
            console.log('This should match the "Total Allocated" shown in the Finance dashboard.');
        } else {
            console.log(`\nFound ${requisitions.length} requisition(s) ready for verification:`);
            requisitions.forEach((req, i) => {
                console.log(`  ${i + 1}. ${req.title} - $${req.estimatedBudget}`);
            });
            console.log('\nTo test the fix:');
            console.log('1. Go to Finance Department dashboard');
            console.log('2. Verify one of these requisitions');
            console.log('3. Run this script again to see the Budget.allocatedBudget update');
            console.log('4. Check that "Total Allocated" in the dashboard shows the correct amount');
        }

        await mongoose.connection.close();
        console.log('\nTest completed successfully!');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testBudgetAllocationFix();
