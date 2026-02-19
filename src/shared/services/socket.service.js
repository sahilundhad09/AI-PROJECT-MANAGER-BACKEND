const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

/**
 * Initialize Socket.io with the HTTP server
 */
function initializeSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL
                ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
                : ['http://localhost:3000'],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    // Authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id || decoded.userId;
            socket.user = decoded;
            next();
        } catch (error) {
            return next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Socket connected: ${socket.id} (User: ${socket.userId})`);

        // Join user's personal room for targeted notifications
        socket.join(`user:${socket.userId}`);

        // Join project rooms
        socket.on('join:project', (projectId) => {
            socket.join(`project:${projectId}`);
            console.log(`📌 User ${socket.userId} joined project:${projectId}`);
        });

        socket.on('leave:project', (projectId) => {
            socket.leave(`project:${projectId}`);
            console.log(`📌 User ${socket.userId} left project:${projectId}`);
        });

        // Join workspace rooms
        socket.on('join:workspace', (workspaceId) => {
            socket.join(`workspace:${workspaceId}`);
            console.log(`📌 User ${socket.userId} joined workspace:${workspaceId}`);
        });

        socket.on('leave:workspace', (workspaceId) => {
            socket.leave(`workspace:${workspaceId}`);
        });

        socket.on('disconnect', (reason) => {
            console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
        });
    });

    console.log('✅ Socket.io initialized');
    return io;
}

/**
 * Get the Socket.io instance
 */
function getIO() {
    return io;
}

/**
 * Emit a task event to a project room
 */
function emitTaskEvent(projectId, event, data) {
    if (!io) return;
    io.to(`project:${projectId}`).emit(event, data);
}

/**
 * Emit a notification to a specific user
 */
function emitNotification(userId, notification) {
    if (!io) return;
    io.to(`user:${userId}`).emit('notification:new', notification);
}

/**
 * Emit a workspace event
 */
function emitWorkspaceEvent(workspaceId, event, data) {
    if (!io) return;
    io.to(`workspace:${workspaceId}`).emit(event, data);
}

module.exports = {
    initializeSocket,
    getIO,
    emitTaskEvent,
    emitNotification,
    emitWorkspaceEvent
};
