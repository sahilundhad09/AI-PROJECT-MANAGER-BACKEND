const { z } = require('zod');

/**
 * Zod schemas for notification validation
 */
const notificationValidator = {
    /**
     * Schema for get notifications query
     */
    getNotificationsSchema: z.object({
        query: z.object({
            page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
            limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
            is_read: z.string().optional().transform(val => val === 'true')
        })
    }),

    /**
     * Schema for notification ID param
     */
    notificationIdSchema: z.object({
        params: z.object({
            id: z.string().uuid({ message: 'Invalid notification ID' })
        })
    })
};

module.exports = notificationValidator;
