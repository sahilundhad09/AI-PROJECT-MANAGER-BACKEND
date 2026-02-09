const { z } = require('zod');

// Helper schemas
const uuidSchema = z.string().uuid('Invalid UUID format');

// Generate tasks schema
const generateTasksSchema = z.object({
    params: z.object({
        projectId: uuidSchema
    }),
    body: z.object({
        prompt: z.string().min(10, 'Prompt must be at least 10 characters').max(2000, 'Prompt too long'),
        count: z.number().int().min(3).max(20).optional().default(8)
    })
});

// Accept generated tasks schema
const acceptTasksSchema = z.object({
    params: z.object({
        projectId: uuidSchema,
        generationId: uuidSchema
    }),
    body: z.object({
        task_indices: z.array(z.number().int().min(0)).min(1, 'Must select at least one task')
    })
});

// Get generation history schema
const getGenerationsSchema = z.object({
    params: z.object({
        projectId: uuidSchema
    }),
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional()
    }).optional()
});

module.exports = {
    generateTasksSchema,
    acceptTasksSchema,
    getGenerationsSchema
};
