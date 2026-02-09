const { z } = require('zod');

// Helper schemas
const uuidSchema = z.string().uuid('Invalid UUID format');

// Send chat message schema
const sendChatMessageSchema = z.object({
    params: z.object({
        projectId: uuidSchema
    }),
    body: z.object({
        message: z.string().min(1, 'Message cannot be empty').max(5000, 'Message too long'),
        session_id: uuidSchema.optional() // Optional - creates new session if not provided
    })
});

// Get chat sessions schema
const getChatSessionsSchema = z.object({
    params: z.object({
        projectId: uuidSchema
    }),
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional()
    }).optional()
});

// Get session history schema
const getSessionHistorySchema = z.object({
    params: z.object({
        sessionId: uuidSchema
    })
});

// Delete session schema
const deleteSessionSchema = z.object({
    params: z.object({
        sessionId: uuidSchema
    })
});

module.exports = {
    sendChatMessageSchema,
    getChatSessionsSchema,
    getSessionHistorySchema,
    deleteSessionSchema
};
