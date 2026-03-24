const mongoose = require('mongoose');
require('dotenv').config();

const Requisition = require('./models/Requisition');
const Budget = require('./models/Budget');
const User = require('./models/User');

async function checkBudgetStatus() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        // Find CS department head
        const csDeptHead = await User.findOne({
            role: 'department_head',
            department: 'CS'
        });

        if (!csDeptHead) {
            console.log('No CS department head found.');
            process.exit(1);
        }

        console.log(`CS Department Head: ${csDeptHead.name}`);

        // Find CS requisitions
        const csRequisitions = await Requisition.find({
            requestedBy: csDeptHead._id
        })
            .populate('requestedBy', 'name department')
            .sort({ createdAt: -1 });

        console.log(`\nCS Department Requisitions (${csRequisitions.length} total):`);
        console.log('='.repeat(80));

        csRequisitions.forEach((req, i) => {
            console.log(`\n${i + 1}. ${req.title}`);
            console.log(`   Status: ${req.status}`);
            console.log(`   Estimated Budget: $${req.estimatedBudget}`);

            if (req.budgetVerification && req.budgetVerification.isApproved !== undefined) {
                console.log(`   Budget Verification:`);
                console.log(`     - Approved: ${req.budgetVerification.isApproved}`);
                console.log(`     - Allocated Amount: $${req.budgetVerification.allocatedAmount || 0}`);
                console.log(`     - Verification Date: ${req.budgetVerification.verificationDate}`);
            }
        });

        // Find CS budget
        const currentYear = new Date().getFullYear().toString();
        const csBudget = await Budget.findOne({
            department: 'CS',
            fiscalYear: currentYear
        });

        console.log('\n' + '='.repeat(80));
        console.log(`\nCS Budget for ${currentYear}:`);
        if (csBudget) {
            console.log(`  Total Budget: $${csBudget.totalBudget}`);
            console.log(`  Allocated Budget: $${csBudget.allocatedBudget}`);
            console.log(`  Remaining Budget: $${csBudget.remainingBudget}`);
        } else {
            console.log('  No budget found for CS department');
        }

        // Calculate what the allocated budget SHOULD be
        const approvedRequisitions = csRequisitions.filter(req =>
            req.budgetVerification &&
            req.budgetVerification.isApproved === true
        );

        if (approvedRequisitions.length > 0) {
            const totalAllocated = approvedRequisitions.reduce((sum, req) =>
                sum + (req.budgetVerification.allocatedAmount || 0), 0
            );

            console.log(`\n${'='.repeat(80)}`);
            console.log(`\nAPPROVED REQUISITIONS ANALYSIS:`);
            console.log(`  Number of approved requisitions: ${approvedRequisitions.length}`);
            console.log(`  Total that SHOULD be allocated: $${totalAllocated}`);
            console.log(`  Actual allocated in Budget: $${csBudget ? csBudget.allocatedBudget : 0}`);

            if (csBudget && csBudget.allocatedBudget !== totalAllocated) {
                console.log(`\n  ⚠️  MISMATCH DETECTED!`);
                console.log(`  Difference: $${totalAllocated - csBudget.allocatedBudget}`);
                console.log(`\n  This means the budget was NOT updated when requisitions were verified.`);
                console.log(`  The fix has been implemented - new verifications will work correctly.`);
                console.log(`\n  To fix existing data, you can either:`);
                console.log(`  1. Manually update the CS budget in Finance dashboard`);
                console.log(`  2. Run a data migration script to sync existing requisitions`);
            } else {
                console.log(`\n  ✓ Budget is correctly synchronized!`);
            }
        }

        await mongoose.connection.close();
        console.log('\n\nCheck completed successfully!');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkBudgetStatus();
