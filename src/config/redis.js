const redis = require('redis');

const redisClient = redis.createClient({
    socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        reconnectStrategy: (retries) => {
            if (retries > 5 && process.env.NODE_ENV !== 'production') {
                return false; // Stop reconnecting after 5 attempts in development
            }
            return Math.min(retries * 500, 5000); // Backoff strategy
        }
    }
});

// Only log critical errors in production to avoid spamming the console in development
redisClient.on('error', (err) => {
    if (process.env.NODE_ENV === 'production' || err.code !== 'ECONNREFUSED') {
        console.error('Redis Client Error:', err.message);
    }
});

redisClient.on('connect', () => {
    console.log('✅ Redis connected successfully');
});

const connectRedis = async () => {
    try {
        await redisClient.connect();
    } catch (error) {
        console.error('❌ Failed to connect to Redis:', error.message);
        if (process.env.NODE_ENV === 'production') {
            console.error('CRITICAL: Redis is required in production. Exiting...');
            process.exit(1);
        } else {
            console.warn('WARNING: Continuing without Redis. Some features (queues, caching) may be limited.');
        }
    }
};

module.exports = { redisClient, connectRedis };
