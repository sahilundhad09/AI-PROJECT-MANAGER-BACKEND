const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize } = require('./database/models');
const { connectRedis } = require('./config/redis');

// Import middleware
const errorHandler = require('./shared/middleware/errorHandler.middleware');

// Import routes
const authRoutes = require('./modules/auth/auth.routes');
const workspaceRoutes = require('./modules/workspace/workspace.routes');
const projectRoutes = require('./modules/project/project.routes');
const taskRoutes = require('./modules/task/task.routes');
const collaborationRoutes = require('./modules/collaboration/collaboration.routes');
const aiRoutes = require('./modules/ai/ai.routes');
const reportingRoutes = require('./modules/reporting/reporting.routes');
const notificationRoutes = require('./modules/notification/notification.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
    ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(o => o.trim()) : []),
    'http://localhost:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.includes('*');

        if (isAllowed) {
            callback(null, true);
        } else {
            console.error(`[CORS Error] Origin ${origin} not in allowed list:`, allowedOrigins);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workspaces', workspaceRoutes);
app.use('/api/v1', projectRoutes); // Project routes include /workspaces/:id/projects and /projects/:id
app.use('/api/v1', taskRoutes); // Task routes include /projects/:id/tasks and /tasks/:id
app.use('/api/v1', collaborationRoutes);
app.use('/api/v1', aiRoutes); // AI routes include /projects/:id/ai/* and /ai/*
app.use('/api/v1/reports', reportingRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1', analyticsRoutes); // Analytics routes include /projects/:id/analytics, /workspaces/:id/analytics, /users/me/performance

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Database connection test
const testDatabaseConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully');
    } catch (error) {
        console.error('❌ Unable to connect to database:', error);
        process.exit(1);
    }
};

// Initialize connections
const initializeApp = async () => {
    await testDatabaseConnection();
    await connectRedis();
};

initializeApp();

module.exports = app;
