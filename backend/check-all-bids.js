const mongoose = require('mongoose');
const Bid = require('./models/Bid');
const TenderFile = require('./models/TenderFile');
const User = require('./models/User');
const Requisition = require('./models/Requisition');
require('dotenv').config();

const checkAllBids = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Find all bids
        const allBids = await Bid.find({})
            .populate('supplier', 'name email companyName')
            .populate('tenderFile', 'title status');

        console.log(`=== ALL BIDS IN SYSTEM (${allBids.length} total) ===\n`);

        if (allBids.length === 0) {
            console.log('⚠️  No bids found in the database!\n');
            console.log('This means suppliers have NOT submitted any bids yet.\n');
            console.log('To submit bids:');
            console.log('1. Login as a Supplier');
            console.log('2. Go to "Active Tenders" section');
            console.log('3. Find the tender you want to bid on');
            console.log('4. Click "Submit Bid" button');
            console.log('5. Fill in the bid form with:');
            console.log('   - Proposed Price');
            console.log('   - Currency (ETB, USD, etc.)');
            console.log('   - Payment Terms');
            console.log('   - Delivery Time');
            console.log('   - Technical Specifications');
            console.log('   - Warranty details');
            console.log('6. Submit the bid\n');
        } else {
            allBids.forEach((bid, index) => {
                console.log(`Bid ${index + 1}:`);
                console.log(`  Tender: ${bid.tenderFile?.title || 'Unknown'}`);
                console.log(`  Tender Status: ${bid.tenderFile?.status || 'Unknown'}`);
                console.log(`  Supplier: ${bid.supplier?.companyName || bid.supplier?.name || 'Unknown'}`);
                console.log(`  Price: ${bid.financialProposal?.proposedPrice || 'N/A'} ${bid.financialProposal?.currency || 'ETB'}`);
                console.log(`  Bid Status: ${bid.status}`);
                console.log(`  Is Winner: ${bid.isWinner ? '🏆 YES' : 'No'}`);
                console.log(`  Submitted: ${new Date(bid.timestamp).toLocaleString()}\n`);
            });
        }

        // Also check all tenders
        const allTenders = await TenderFile.find({}).populate('requisition', 'title');
        console.log(`=== ALL TENDERS (${allTenders.length} total) ===\n`);

        allTenders.forEach((tender, index) => {
            console.log(`Tender ${index + 1}:`);
            console.log(`  Title: ${tender.title}`);
            console.log(`  Status: ${tender.status}`);
            console.log(`  Requisition: ${tender.requisition?.title || 'Unknown'}`);
            console.log(`  Start: ${new Date(tender.startDate).toLocaleDateString()}`);
            console.log(`  End: ${new Date(tender.endDate).toLocaleDateString()}\n`);
        });

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
};

checkAllBids();
