require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Inventory = require('./models/Inventory');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const fixQuantities = async () => {
    try {
        await connectDB();

        // Fix Desk chair: 659 -> 660
        const deskResult = await Inventory.updateOne(
            { itemName: /desk chair/i, quantity: 659 },
            {
                $set: { quantity: 660 },
                $push: {
                    history: {
                        action: 'adjusted',
                        quantity: 1,
                        previousQuantity: 659,
                        newQuantity: 660,
                        notes: 'Quantity correction - fixed registration error',
                        date: new Date()
                    }
                }
            }
        );
        console.log('Desk chair update:', deskResult);

        // Fix A4 paper: 9999 -> 10000
        const paperResult = await Inventory.updateOne(
            { itemName: /a4 paper/i, quantity: 9999 },
            {
                $set: { quantity: 10000 },
                $push: {
                    history: {
                        action: 'adjusted',
                        quantity: 1,
                        previousQuantity: 9999,
                        newQuantity: 10000,
                        notes: 'Quantity correction - fixed registration error',
                        date: new Date()
                    }
                }
            }
        );
        console.log('A4 paper update:', paperResult);

        // Verify the updates
        const desk = await Inventory.findOne({ itemName: /desk chair/i });
        const paper = await Inventory.findOne({ itemName: /a4 paper/i });

        console.log('\n=== Updated Records ===');
        console.log('Desk chair:', desk ? `${desk.itemName} - Quantity: ${desk.quantity}` : 'Not found');
        console.log('A4 paper:', paper ? `${paper.itemName} - Quantity: ${paper.quantity}` : 'Not found');

        console.log('\n✅ Quantities fixed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing quantities:', error);
        process.exit(1);
    }
};

fixQuantities();
