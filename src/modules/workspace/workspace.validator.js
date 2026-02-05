const { z } = require('zod');

// Create workspace validation
const createWorkspaceSchema = z.object({
    body: z.object({
        name: z.string()
            .min(3, 'Workspace name must be at least 3 characters')
            .max(100, 'Workspace name must not exceed 100 characters')
            .trim(),
        description: z.string()
            .max(500, 'Description must not exceed 500 characters')
            .trim()
            .optional(),
        logo_url: z.string()
            .url('Invalid logo URL')
            .optional()
    })
});

// Update workspace validation
const updateWorkspaceSchema = z.object({
    body: z.object({
        name: z.string()
            .min(3, 'Workspace name must be at least 3 characters')
            .max(100, 'Workspace name must not exceed 100 characters')
            .trim()
            .optional(),
        description: z.string()
            .max(500, 'Description must not exceed 500 characters')
            .trim()
            .optional(),
        logo_url: z.string()
            .url('Invalid logo URL')
            .optional()
            .nullable(),
        settings: z.object({}).passthrough().optional()
    })
});

// Invite member validation
const inviteMemberSchema = z.object({
    body: z.object({
        email: z.string()
            .email('Invalid email address')
            .toLowerCase()
            .trim(),
        role: z.enum(['admin', 'member'], {
            errorMap: () => ({ message: 'Role must be either admin or member' })
        })
    })
});

// Update member role validation
const updateMemberRoleSchema = z.object({
    body: z.object({
        role: z.enum(['admin', 'member'], {
            errorMap: () => ({ message: 'Role must be either admin or member' })
        })
    })
});

// Pagination validation
const paginationSchema = z.object({
    query: z.object({
        page: z.string()
            .regex(/^\d+$/, 'Page must be a positive number')
            .transform(Number)
            .refine(val => val > 0, 'Page must be greater than 0')
            .optional()
            .default('1'),
        limit: z.string()
            .regex(/^\d+$/, 'Limit must be a positive number')
            .transform(Number)
            .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100')
            .optional()
            .default('10')
    })
});

// Get members with filters validation
const getMembersSchema = z.object({
    query: z.object({
        role: z.enum(['owner', 'admin', 'member']).optional(),
        page: z.string()
            .regex(/^\d+$/)
            .transform(Number)
            .optional()
            .default('1'),
        limit: z.string()
            .regex(/^\d+$/)
            .transform(Number)
            .refine(val => val > 0 && val <= 100)
            .optional()
            .default('20')
    })
});

// Get invitations with filters validation
const getInvitationsSchema = z.object({
    query: z.object({
        status: z.enum(['pending', 'accepted', 'declined', 'cancelled']).optional(),
        page: z.string()
            .regex(/^\d+$/)
            .transform(Number)
            .optional()
            .default('1'),
        limit: z.string()
            .regex(/^\d+$/)
            .transform(Number)
            .refine(val => val > 0 && val <= 100)
            .optional()
            .default('20')
    })
});

module.exports = {
    createWorkspaceSchema,
    updateWorkspaceSchema,
    inviteMemberSchema,
    updateMemberRoleSchema,
    paginationSchema,
    getMembersSchema,
    getInvitationsSchema
};
