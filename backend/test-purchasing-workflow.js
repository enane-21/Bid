const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Requisition = require('./models/Requisition');
const Budget = require('./models/Budget');
const TenderFile = require('./models/TenderFile');
const Bid = require('./models/Bid');
require('dotenv').config();

const testPurchasingWorkflow = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Connected to MongoDB');

        // Hash password once
        const hashedPassword = await bcrypt.hash('password123', 10);
        console.log('✓ Password hashed');

        // Find or create test users
        let purchasingTeam = await User.findOne({ email: 'purchasing@test.com' });
        if (!purchasingTeam) {
            purchasingTeam = new User({
                name: 'Purchasing Officer',
                email: 'purchasing@test.com',
                password: hashedPassword,
                role: 'purchasing_team',
                isApproved: true,
                isVerified: true
            });
            await purchasingTeam.save({ validateBeforeSave: false });
            console.log('✓ Created Purchasing Team user');
        } else {
            console.log('✓ Purchasing Team user already exists');
        }

        let departmentHead = await User.findOne({ email: 'dept.head@test.com' });
        if (!departmentHead) {
            departmentHead = new User({
                name: 'John Department',
                email: 'dept.head@test.com',
                password: hashedPassword,
                role: 'department_head',
                department: 'Computer Science',
                isApproved: true,
                isVerified: true
            });
            await departmentHead.save({ validateBeforeSave: false });
            console.log('✓ Created Department Head user');
        }

        let scientificDirector = await User.findOne({ email: 'director@test.com' });
        if (!scientificDirector) {
            scientificDirector = new User({
                name: 'Dr. Science Director',
                email: 'director@test.com',
                password: hashedPassword,
                role: 'scientific_director',
                isApproved: true,
                isVerified: true
            });
            await scientificDirector.save({ validateBeforeSave: false });
            console.log('✓ Created Scientific Director user');
        }

        let storekeeper = await User.findOne({ email: 'storekeeper@test.com' });
        if (!storekeeper) {
            storekeeper = new User({
                name: 'Store Keeper',
                email: 'storekeeper@test.com',
                password: hashedPassword,
                role: 'storekeeper',
                isApproved: true,
                isVerified: true
            });
            await storekeeper.save({ validateBeforeSave: false });
            console.log('✓ Created Storekeeper user');
        }

        let finance = await User.findOne({ email: 'finance@test.com' });
        if (!finance) {
            finance = new User({
                name: 'Finance Manager',
                email: 'finance@test.com',
                password: hashedPassword,
                role: 'finance',
                isApproved: true,
                isVerified: true
            });
            await finance.save({ validateBeforeSave: false });
            console.log('✓ Created Finance user');
        }

        let supplier1 = await User.findOne({ email: 'supplier1@test.com' });
        if (!supplier1) {
            supplier1 = new User({
                name: 'Tech Supplies Ltd',
                email: 'supplier1@test.com',
                password: hashedPassword,
                role: 'supplier',
                companyName: 'Tech Supplies Ltd',
                phone: '+251911234567',
                isApproved: true,
                isVerified: true
            });
            await supplier1.save({ validateBeforeSave: false });
            console.log('✓ Created Supplier 1');
        }

        let supplier2 = await User.findOne({ email: 'supplier2@test.com' });
        if (!supplier2) {
            supplier2 = new User({
                name: 'Office Equipment Co',
                email: 'supplier2@test.com',
                password: hashedPassword,
                role: 'supplier',
                companyName: 'Office Equipment Co',
                phone: '+251922345678',
                isApproved: true,
                isVerified: true
            });
            await supplier2.save({ validateBeforeSave: false });
            console.log('✓ Created Supplier 2');
        }

        // Create budget
        let budget = await Budget.findOne({ department: 'Computer Science' });
        if (!budget) {
            budget = await Budget.create({
                department: 'Computer Science',
                fiscalYear: '2024',
                totalBudget: 500000,
                allocatedBudget: 0,
                remainingBudget: 500000,
                createdBy: finance._id
            });
            console.log('✓ Created department budget');
        }

        console.log('\n--- Creating Test Requisitions ---');

        // Requisition 1
        const existingReq1 = await Requisition.findOne({ title: 'High-Performance Laptops' });
        if (!existingReq1) {
            await Requisition.create({
                title: 'High-Performance Laptops',
                description: 'Dell XPS 15 laptops for research lab',
                category: 'Electronics',
                quantity: 10,
                estimatedBudget: 50000,
                urgency: 'high',
                requestedBy: departmentHead._id,
                status: 'budget_verified',
                approvedBy: scientificDirector._id,
                approvalDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                storekeeperCheck: {
                    checkedBy: storekeeper._id,
                    isAvailableInStore: false,
                    checkDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                    notes: 'Not available in store'
                },
                budgetVerification: {
                    verifiedBy: finance._id,
                    isApproved: true,
                    allocatedAmount: 50000,
                    verificationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                    notes: 'Budget approved'
                }
            });
            console.log('✓ Created requisition: High-Performance Laptops');
        }

        // Requisition 2
        const existingReq2 = await Requisition.findOne({ title: 'Office Furniture Set' });
        if (!existingReq2) {
            await Requisition.create({
                title: 'Office Furniture Set',
                description: 'Ergonomic office chairs and desks',
                category: 'Furniture',
                quantity: 15,
                estimatedBudget: 30000,
                urgency: 'medium',
                requestedBy: departmentHead._id,
                status: 'budget_verified',
                approvedBy: scientificDirector._id,
                approvalDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
                storekeeperCheck: {
                    checkedBy: storekeeper._id,
                    isAvailableInStore: false,
                    checkDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                    notes: 'Need to order'
                },
                budgetVerification: {
                    verifiedBy: finance._id,
                    isApproved: true,
                    allocatedAmount: 30000,
                    verificationDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                    notes: 'Approved'
                }
            });
            console.log('✓ Created requisition: Office Furniture Set');
        }

        // Requisition 3 with tender
        const existingReq3 = await Requisition.findOne({ title: 'Laboratory Equipment' });
        let req3;
        if (!existingReq3) {
            req3 = await Requisition.create({
                title: 'Laboratory Equipment',
                description: 'Microscopes and lab equipment',
                category: 'Laboratory Equipment',
                quantity: 8,
                estimatedBudget: 75000,
                urgency: 'high',
                requestedBy: departmentHead._id,
                status: 'arranged',
                approvedBy: scientificDirector._id,
                approvalDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                storekeeperCheck: {
                    checkedBy: storekeeper._id,
                    isAvailableInStore: false,
                    checkDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
                    notes: 'Not in stock'
                },
                budgetVerification: {
                    verifiedBy: finance._id,
                    isApproved: true,
                    allocatedAmount: 75000,
                    verificationDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
                    notes: 'Approved'
                },
                arrangedBy: purchasingTeam._id,
                arrangedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            });
            console.log('✓ Created requisition: Laboratory Equipment');
        } else {
            req3 = existingReq3;
        }

        console.log('\n--- Creating Test Tenders ---');

        // Active tender with bids
        const existingTender1 = await TenderFile.findOne({ title: 'Laboratory Equipment Procurement' });
        if (!existingTender1) {
            const tender1 = await TenderFile.create({
                requisition: req3._id,
                title: 'Laboratory Equipment Procurement',
                description: 'Supply of lab equipment',
                startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
                status: 'active',
                uploadedBy: purchasingTeam._id,
                publishedBy: purchasingTeam._id,
                publishedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                announcementDetails: {
                    announcementNumber: 'TND-2024-001',
                    publicationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                    closingDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
                    venue: 'University Procurement Office'
                }
            });
            console.log('✓ Created tender: Laboratory Equipment');

            // Create bids
            await Bid.create({
                tenderFile: tender1._id,
                supplier: supplier1._id,
                financialProposal: {
                    proposedPrice: 72000,
                    currency: 'ETB',
                    paymentTerms: '50% advance, 50% on delivery',
                    validityPeriod: '90 days'
                },
                technicalProposal: {
                    specifications: 'ISO standards',
                    deliveryTime: '30 days',
                    warranty: '2 years',
                    afterSalesService: '24/7 support'
                },
                status: 'submitted',
                timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            });
            console.log('✓ Created bid from Tech Supplies Ltd');

            await Bid.create({
                tenderFile: tender1._id,
                supplier: supplier2._id,
                financialProposal: {
                    proposedPrice: 68000,
                    currency: 'ETB',
                    paymentTerms: '30% advance, 70% on delivery',
                    validityPeriod: '60 days'
                },
                technicalProposal: {
                    specifications: 'Premium quality',
                    deliveryTime: '45 days',
                    warranty: '3 years',
                    afterSalesService: 'On-site support'
                },
                status: 'submitted',
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            });
            console.log('✓ Created bid from Office Equipment Co');
        }

        console.log('\n✅ SUCCESS! Test data created!');
        console.log('\n=== LOGIN CREDENTIALS ===');
        console.log('Email: purchasing@test.com');
        console.log('Password: password123');
        console.log('\nYou should see:');
        console.log('- 2 Approved Requisitions');
        console.log('- 1 Active Tender with 2 Bids');
        console.log('- 1 Draft Tender');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

testPurchasingWorkflow();
