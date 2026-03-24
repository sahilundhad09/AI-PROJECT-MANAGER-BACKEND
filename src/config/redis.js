const redis = require('redis');

const redisClient = redis.createClient({
    socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
    }
});

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
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
