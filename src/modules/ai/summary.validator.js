const { z } = require('zod');

// Helper schemas
const uuidSchema = z.string().uuid('Invalid UUID format');

// Generate summary schema
const generateSummarySchema = z.object({
    params: z.object({
        projectId: uuidSchema
    }),
    body: z.object({
        summary_type: z.enum(['daily', 'weekly', 'custom'], {
            errorMap: () => ({ message: 'Summary type must be daily, weekly, or custom' })
        }),
        date_range_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        date_range_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
    }).refine(
        data => {
            if (data.summary_type === 'custom') {
                return data.date_range_start && data.date_range_end;
            }
            return true;
        },
        { message: 'Custom summaries require date_range_start and date_range_end' }
    )
});

// Get summaries schema
const getSummariesSchema = z.object({
    params: z.object({
        projectId: uuidSchema
    }),
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
        summary_type: z.enum(['daily', 'weekly', 'custom']).optional()
    }).optional()
});

module.exports = {
    generateSummarySchema,
    getSummariesSchema
};
