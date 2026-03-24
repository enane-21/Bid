const mongoose = require('mongoose');
const TenderFile = require('./models/TenderFile');
const Bid = require('./models/Bid');
const Requisition = require('./models/Requisition');
require('dotenv').config();

const checkTenderStatus = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Find the Laptop requisition
        const laptopReq = await Requisition.findOne({ title: 'Laptop' });

        if (!laptopReq) {
            console.log('❌ Laptop requisition not found!');
            process.exit(0);
        }

        console.log('=== LAPTOP REQUISITION ===');
        console.log(`Title: ${laptopReq.title}`);
        console.log(`Status: ${laptopReq.status}`);
        console.log(`ID: ${laptopReq._id}\n`);

        // Find tender for this requisition
        const tender = await TenderFile.findOne({ requisition: laptopReq._id });

        if (!tender) {
            console.log('❌ No tender found for Laptop requisition!');
            process.exit(0);
        }

        console.log('=== TENDER DETAILS ===');
        console.log(`Title: ${tender.title}`);
        console.log(`Status: ${tender.status}`);
        console.log(`ID: ${tender._id}\n`);

        // Find all bids for this tender
        const bids = await Bid.find({ tenderFile: tender._id })
            .populate('supplier', 'name email companyName');

        console.log(`=== BIDS (${bids.length} total) ===`);

        if (bids.length === 0) {
            console.log('⚠️  No bids submitted for this tender!\n');
        } else {
            bids.forEach((bid, index) => {
                console.log(`\nBid ${index + 1}:`);
                console.log(`  Supplier: ${bid.supplier.companyName || bid.supplier.name}`);
                console.log(`  Email: ${bid.supplier.email}`);
                console.log(`  Price: ${bid.financialProposal.proposedPrice} ${bid.financialProposal.currency || 'ETB'}`);
                console.log(`  Status: ${bid.status}`);
                console.log(`  Is Winner: ${bid.isWinner ? '🏆 YES' : 'No'}`);
                console.log(`  Evaluated: ${bid.evaluation ? 'Yes' : 'No'}`);
                if (bid.evaluation) {
                    console.log(`    - Technical Score: ${bid.evaluation.technicalScore}/100`);
                    console.log(`    - Financial Score: ${bid.evaluation.financialScore}/100`);
                    console.log(`    - Total Score: ${bid.evaluation.totalScore}/200`);
                }
            });
        }

        console.log('\n=== NEXT STEPS ===');

        const winningBid = bids.find(b => b.isWinner);

        if (!winningBid) {
            console.log('⚠️  NO WINNER ANNOUNCED YET!\n');
            console.log('To proceed with payment:');
            console.log('1. Login as Purchasing Team');
            console.log('2. Go to "Tenders" tab');
            console.log('3. Find "Laptop" tender');
            console.log('4. Click "View Bids" button');
            console.log('5. Evaluate each bid (give scores)');
            console.log('6. Click "Announce Winner" on the best bid');
            console.log('7. This will update requisition status to "items_ordered"');
            console.log('8. Then run: node backend/create-payment.js\n');
        } else {
            console.log('✅ Winner has been announced!');
            console.log(`   Winner: ${winningBid.supplier.companyName || winningBid.supplier.name}`);
            console.log(`   Amount: ${winningBid.financialProposal.proposedPrice} ${winningBid.financialProposal.currency || 'ETB'}\n`);
            console.log('Next step: Run payment creation script');
            console.log('   Command: node backend/create-payment.js\n');
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
};

checkTenderStatus();
