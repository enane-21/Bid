const mongoose = require('mongoose');
require('dotenv').config();

const Requisition = require('./models/Requisition');
const Budget = require('./models/Budget');
const User = require('./models/User');

async function migrateExistingAllocations() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        // Find all approved requisitions that have budget verification
        const approvedRequisitions = await Requisition.find({
            'budgetVerification.isApproved': true,
            'budgetVerification.allocatedAmount': { $exists: true, $gt: 0 }
        }).populate('requestedBy', 'name department');

        console.log(`Found ${approvedRequisitions.length} approved requisitions with budget allocations\n`);

        if (approvedRequisitions.length === 0) {
            console.log('No requisitions to migrate.');
            await mongoose.connection.close();
            return;
        }

        // Group by department
        const departmentAllocations = {};

        approvedRequisitions.forEach(req => {
            const dept = req.requestedBy.department;
            if (!departmentAllocations[dept]) {
                departmentAllocations[dept] = {
                    requisitions: [],
                    totalAllocated: 0
                };
            }
            departmentAllocations[dept].requisitions.push({
                title: req.title,
                amount: req.budgetVerification.allocatedAmount
            });
            departmentAllocations[dept].totalAllocated += req.budgetVerification.allocatedAmount;
        });

        console.log('Allocations by Department:');
        console.log('='.repeat(80));

        const currentYear = new Date().getFullYear().toString();

        for (const [dept, data] of Object.entries(departmentAllocations)) {
            console.log(`\n${dept} Department:`);
            data.requisitions.forEach(req => {
                console.log(`  - ${req.title}: $${req.amount}`);
            });
            console.log(`  Total to allocate: $${data.totalAllocated}`);

            // Find the budget for this department
            const budget = await Budget.findOne({
                department: dept,
                fiscalYear: currentYear
            });

            if (!budget) {
                console.log(`  ⚠️  No budget found for ${dept} in ${currentYear} - skipping`);
                continue;
            }

            console.log(`\n  Current Budget State:`);
            console.log(`    Total: $${budget.totalBudget}`);
            console.log(`    Allocated: $${budget.allocatedBudget}`);
            console.log(`    Remaining: $${budget.remainingBudget}`);

            // Update the budget
            const newAllocated = budget.allocatedBudget + data.totalAllocated;
            const newRemaining = budget.totalBudget - newAllocated;

            if (newRemaining < 0) {
                console.log(`\n  ⚠️  WARNING: This would result in negative remaining budget!`);
                console.log(`    New Allocated would be: $${newAllocated}`);
                console.log(`    New Remaining would be: $${newRemaining}`);
                console.log(`    Skipping this department - please review manually.`);
                continue;
            }

            budget.allocatedBudget = newAllocated;
            budget.remainingBudget = newRemaining;
            await budget.save();

            console.log(`\n  ✓ Updated Budget:`);
            console.log(`    Total: $${budget.totalBudget}`);
            console.log(`    Allocated: $${budget.allocatedBudget}`);
            console.log(`    Remaining: $${budget.remainingBudget}`);
        }

        console.log('\n' + '='.repeat(80));
        console.log('\nMigration completed successfully!');
        console.log('\nPlease refresh the Finance dashboard to see updated allocations.');

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

migrateExistingAllocations();
