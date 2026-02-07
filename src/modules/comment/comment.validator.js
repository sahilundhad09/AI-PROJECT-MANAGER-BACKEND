const { z } = require('zod');

// Helper schemas
const uuidSchema = z.string().uuid('Invalid UUID format');

// Create comment schema
const createCommentSchema = z.object({
    body: z.object({
        message: z.string().min(1, 'Message cannot be empty').max(5000, 'Message must not exceed 5000 characters'),
        parent_comment_id: uuidSchema.optional()
    }),
    params: z.object({
        taskId: uuidSchema
    })
});

// Get task comments schema
const getTaskCommentsSchema = z.object({
    params: z.object({
        taskId: uuidSchema
    })
});

// Update comment schema
const updateCommentSchema = z.object({
    body: z.object({
        message: z.string().min(1, 'Message cannot be empty').max(5000, 'Message must not exceed 5000 characters')
    }),
    params: z.object({
        commentId: uuidSchema
    })
});

// Delete comment schema
const deleteCommentSchema = z.object({
    params: z.object({
        commentId: uuidSchema
    })
});

module.exports = {
    createCommentSchema,
    getTaskCommentsSchema,
    updateCommentSchema,
    deleteCommentSchema
};
