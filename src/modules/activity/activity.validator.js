const { z } = require('zod');

// Helper schemas
const uuidSchema = z.string().uuid('Invalid UUID format');

// Get workspace activity schema
const getWorkspaceActivitySchema = z.object({
    params: z.object({
        workspaceId: uuidSchema
    }),
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional()
    }).optional()
});

// Get project activity schema
const getProjectActivitySchema = z.object({
    params: z.object({
        projectId: uuidSchema
    }),
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional()
    }).optional()
});

// Get task activity schema
const getTaskActivitySchema = z.object({
    params: z.object({
        taskId: uuidSchema
    })
});

module.exports = {
    getWorkspaceActivitySchema,
    getProjectActivitySchema,
    getTaskActivitySchema
};
