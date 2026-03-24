const mongoose = require('mongoose');
const Payment = require('./models/Payment');
const Bid = require('./models/Bid');
const TenderFile = require('./models/TenderFile');
const Requisition = require('./models/Requisition');
const User = require('./models/User');
require('dotenv').config();

const createPaymentForWinner = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // First, let's see ALL requisitions and their statuses
        console.log('=== Checking All Requisitions ===');
        const allReqs = await Requisition.find({}).select('title status').populate('requestedBy', 'name');

        if (allReqs.length === 0) {
            console.log('No requisitions found in database!');
            process.exit(0);
        }

        console.log(`Found ${allReqs.length} total requisition(s):\n`);
        allReqs.forEach((req, index) => {
            console.log(`${index + 1}. ${req.title}`);
            console.log(`   Status: ${req.status}`);
            console.log(`   ID: ${req._id}\n`);
        });

        // Now find requisitions ready for payment
        console.log('=== Looking for Requisitions Ready for Payment ===');
        const requisitions = await Requisition.find({
            status: { $in: ['items_ordered', 'completed', 'items_received'] }
        }).populate('requestedBy');

        if (requisitions.length === 0) {
            console.log('⚠️  No requisitions with status "items_ordered" or "completed" found.\n');
            console.log('To create a payment, the requisition must be:');
            console.log('1. Winner announced by Purchasing Team (status → items_ordered)');
            console.log('2. OR Items received by Storekeeper (status → completed)\n');
            console.log('Current workflow status:');
            const statusCounts = {};
            allReqs.forEach(req => {
                statusCounts[req.status] = (statusCounts[req.status] || 0) + 1;
            });
            Object.keys(statusCounts).forEach(status => {
                console.log(`  - ${status}: ${statusCounts[status]}`);
            });
            process.exit(0);
        }

        console.log(`Found ${requisitions.length} requisition(s) ready for payment!\n`);

        for (const req of requisitions) {
            console.log(`Processing: ${req.title}`);
            console.log(`  Status: ${req.status}`);
            console.log(`  ID: ${req._id}`);

            // Find tender for this requisition (prioritize closed tenders with winners)
            let tender = await TenderFile.findOne({
                requisition: req._id,
                status: 'closed'
            });

            // If no closed tender, try any tender
            if (!tender) {
                tender = await TenderFile.findOne({ requisition: req._id });
            }

            if (!tender) {
                console.log(`  ⚠️  No tender found for this requisition\n`);
                continue;
            }
            console.log(`  ✓ Tender found: ${tender.title} (Status: ${tender.status})`);

            // Find winning bid
            const winningBid = await Bid.findOne({
                tenderFile: tender._id,
                isWinner: true
            }).populate('supplier', 'name email companyName');

            if (!winningBid) {
                console.log(`  ⚠️  No winning bid found for this tender\n`);
                continue;
            }
            console.log(`  ✓ Winning bid found`);
            console.log(`    Supplier: ${winningBid.supplier.companyName || winningBid.supplier.name}`);
            console.log(`    Amount: ${winningBid.financialProposal.proposedPrice} ${winningBid.financialProposal.currency || 'ETB'}`);

            // Check if payment already exists
            const existingPayment = await Payment.findOne({ requisition: req._id });
            if (existingPayment) {
                console.log(`  ℹ️  Payment already exists!`);
                console.log(`    Status: ${existingPayment.status}`);
                console.log(`    Payment ID: ${existingPayment._id}\n`);
                continue;
            }

            // Create payment
            const payment = await Payment.create({
                requisition: req._id,
                tender: tender._id,
                winningBid: winningBid._id,
                supplier: winningBid.supplier._id,
                amount: winningBid.financialProposal.proposedPrice,
                currency: winningBid.financialProposal.currency || 'ETB',
                paymentMethod: 'chapa',
                status: 'pending',
                notes: `Payment for ${tender.title} to ${winningBid.supplier.companyName || winningBid.supplier.name}`
            });

            console.log(`  ✅ Payment Created Successfully!`);
            console.log(`    Payment ID: ${payment._id}`);
            console.log(`    Amount: ${payment.amount} ${payment.currency}`);
            console.log(`    Status: ${payment.status}\n`);
        }

        console.log('=== Summary ===');
        console.log('✅ Payment creation complete!\n');
        console.log('Next Steps:');
        console.log('1. Go to Finance Department dashboard');
        console.log('2. Click on "Payments" tab');
        console.log('3. You should see the payment with status "PENDING"');
        console.log('4. Click "Approve" button');
        console.log('5. Click "Pay with Chapa" button');
        console.log('6. Complete payment in Chapa checkout\n');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
};

createPaymentForWinner();
