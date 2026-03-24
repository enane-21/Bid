require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const connectDB = require('./config/database');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const requisitionRoutes = require('./routes/requisitionRoutes');
const tenderRoutes = require('./routes/tenderRoutes');
const bidRoutes = require('./routes/bidRoutes');
const messageRoutes = require('./routes/messageRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const storekeeperRoutes = require('./routes/storekeeperRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requisitions', requisitionRoutes);
app.use('/api/tenders', tenderRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/storekeeper', storekeeperRoutes);

app.get('/', (req, res) => {
    res.json({
        message: 'E-Bid Processing System API',
        version: '1.0.0',
        status: 'running'
    });
});

// Public stats endpoint for home page
app.get('/api/stats', async (req, res) => {
    try {
        const User = require('./models/User');
        const TenderFile = require('./models/TenderFile');
        const Bid = require('./models/Bid');

        const [activeUsers, tendersProcessed, totalBids] = await Promise.all([
            User.countDocuments({ isApproved: true }),
            TenderFile.countDocuments(),
            Bid.countDocuments()
        ]);

        res.json({ success: true, activeUsers, tendersProcessed, totalBids });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('joinAuction', (productId) => {
        socket.join(`auction_${productId}`);
    });

    socket.on('newBid', (data) => {
        io.to(`auction_${data.productId}`).emit('bidUpdate', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
