const { z } = require('zod');

// Helper schemas
const uuidSchema = z.string().uuid('Invalid UUID format');

// Get smart suggestions schema
const getSuggestionsSchema = z.object({
    params: z.object({
        projectId: uuidSchema
    }),
    query: z.object({
        suggestion_type: z.enum(['priority', 'assignment', 'blockers', 'all']).optional().default('all')
    }).optional()
});

module.exports = {
    getSuggestionsSchema
};
