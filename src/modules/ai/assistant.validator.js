const { z } = require('zod');

const detailTaskSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().optional().nullable()
});

const summarizeCommentsSchema = z.object({
    comments: z.array(z.object({
        user: z.object({
            name: z.string().optional()
        }).optional(),
        content: z.string()
    })).min(1, 'At least one comment is required to summarize')
});

module.exports = {
    detailTaskSchema,
    summarizeCommentsSchema
};
