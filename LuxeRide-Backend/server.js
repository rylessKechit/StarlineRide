const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { connectDB } = require('./src/config/database');
const { setupSocket } = require('./src/config/socket');
const logger = require('./src/utils/logger');

// Import routes
const authRoutes = require('./src/routes/auth');
const bookingRoutes = require('./src/routes/bookings');
const driverRoutes = require('./src/routes/drivers');
const paymentRoutes = require('./src/routes/payments');
const reviewRoutes = require('./src/routes/reviews');
// const userRoutes = require('./src/routes/users');
// const vehicleRoutes = require('./src/routes/vehicles');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"]
    }
});

// Connect to database
connectDB();

// Middleware
app.use(helmet()); // Sécurité HTTP headers
app.use(cors()); // CORS
app.use(express.json({ limit: '10mb' })); // Parse JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded

// Static files
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/vehicles', vehicleRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'LuxeRide API is running perfectly!',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Setup Socket.io
setupSocket(io);

// Global error handler
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    logger.info(`🚀 LuxeRide API Server running on port ${PORT}`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`📱 Socket.io ready for real-time connections`);
});

module.exports = { app, io };