const { z } = require('zod');

// Helper schemas
const uuidSchema = z.string().uuid('Invalid UUID format');
const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format (e.g., #FF5733)');
const paginationSchema = z.object({
    query: z.object({
        page: z.string().optional().transform(val => val ? parseInt(val) : 1),
        limit: z.string().optional().transform(val => val ? Math.min(parseInt(val) || 20, 100) : 20)
    })
});

// Project CRUD Schemas
const createProjectSchema = z.object({
    params: z.object({
        workspaceId: uuidSchema
    }),
    body: z.object({
        name: z.string().min(3, 'Project name must be at least 3 characters').max(100, 'Project name too long'),
        description: z.string().max(1000, 'Description too long').optional(),
        color: hexColorSchema.optional(),
        start_date: z.string().datetime().optional(),
        end_date: z.string().datetime().optional()
    }).refine(data => {
        if (data.start_date && data.end_date) {
            return new Date(data.end_date) > new Date(data.start_date);
        }
        return true;
    }, {
        message: 'End date must be after start date',
        path: ['end_date']
    })
});

const getWorkspaceProjectsSchema = z.object({
    params: z.object({
        workspaceId: uuidSchema
    }),
    query: z.object({
        status: z.enum(['active', 'archived', 'all']).optional().default('active'),
        page: z.string().optional().transform(val => val ? parseInt(val) : 1),
        limit: z.string().optional().transform(val => val ? Math.min(parseInt(val) || 20, 100) : 20)
    })
});

const getProjectByIdSchema = z.object({
    params: z.object({
        projectId: uuidSchema
    })
});

const updateProjectSchema = z.object({
    params: z.object({
        projectId: uuidSchema
    }),
    body: z.object({
        name: z.string().min(3).max(100).optional(),
        description: z.string().max(1000).optional().nullable(),
        color: hexColorSchema.optional().nullable(),
        start_date: z.string().datetime().optional().nullable(),
        end_date: z.string().datetime().optional().nullable(),
        settings: z.record(z.any()).optional()
    }).refine(data => {
        if (data.start_date && data.end_date) {
            return new Date(data.end_date) > new Date(data.start_date);
        }
        return true;
    }, {
        message: 'End date must be after start date',
        path: ['end_date']
    })
});

const archiveProjectSchema = z.object({
    params: z.object({
        projectId: uuidSchema
    }),
    body: z.object({
        archived: z.boolean()
    })
});

const deleteProjectSchema = z.object({
    params: z.object({
        projectId: uuidSchema
    })
});

// Project Member Schemas
const addProjectMemberSchema = z.object({
    params: z.object({
        projectId: uuidSchema
    }),
    body: z.object({
        workspace_member_id: uuidSchema,
        project_role: z.enum(['lead', 'member', 'viewer'])
    })
});

const getProjectMembersSchema = z.object({
    params: z.object({
        projectId: uuidSchema
    }),
    query: z.object({
        role: z.enum(['lead', 'member', 'viewer']).optional(),
        page: z.string().optional().transform(val => val ? parseInt(val) : 1),
        limit: z.string().optional().transform(val => val ? Math.min(parseInt(val) || 20, 100) : 20)
    })
});

const updateProjectMemberRoleSchema = z.object({
    params: z.object({
        projectId: uuidSchema,
        memberId: uuidSchema
    }),
    body: z.object({
        project_role: z.enum(['lead', 'member', 'viewer'])
    })
});

const removeProjectMemberSchema = z.object({
    params: z.object({
        projectId: uuidSchema,
        memberId: uuidSchema
    })
});

const leaveProjectSchema = z.object({
    params: z.object({
        projectId: uuidSchema
    })
});

// Task Status Schemas
const createTaskStatusSchema = z.object({
    params: z.object({
        projectId: uuidSchema
    }),
    body: z.object({
        name: z.string().min(2, 'Status name must be at least 2 characters').max(50, 'Status name too long'),
        color: hexColorSchema.optional(),
        position: z.number().int().min(0).optional()
    })
});

const getTaskStatusesSchema = z.object({
    params: z.object({
        projectId: uuidSchema
    })
});

const updateTaskStatusSchema = z.object({
    params: z.object({
        projectId: uuidSchema,
        statusId: uuidSchema
    }),
    body: z.object({
        name: z.string().min(2).max(50).optional(),
        color: hexColorSchema.optional(),
        position: z.number().int().min(0).optional()
    })
});

const deleteTaskStatusSchema = z.object({
    params: z.object({
        projectId: uuidSchema,
        statusId: uuidSchema
    }),
    query: z.object({
        move_tasks_to_status_id: uuidSchema.optional()
    })
});

// Project Label Schemas
const createProjectLabelSchema = z.object({
    params: z.object({
        projectId: uuidSchema
    }),
    body: z.object({
        name: z.string().min(2, 'Label name must be at least 2 characters').max(30, 'Label name too long'),
        color: hexColorSchema
    })
});

const getProjectLabelsSchema = z.object({
    params: z.object({
        projectId: uuidSchema
    })
});

const updateProjectLabelSchema = z.object({
    params: z.object({
        projectId: uuidSchema,
        labelId: uuidSchema
    }),
    body: z.object({
        name: z.string().min(2).max(30).optional(),
        color: hexColorSchema.optional()
    })
});

const deleteProjectLabelSchema = z.object({
    params: z.object({
        projectId: uuidSchema,
        labelId: uuidSchema
    })
});

module.exports = {
    // Project CRUD
    createProjectSchema,
    getWorkspaceProjectsSchema,
    getProjectByIdSchema,
    updateProjectSchema,
    archiveProjectSchema,
    deleteProjectSchema,

    // Project Members
    addProjectMemberSchema,
    getProjectMembersSchema,
    updateProjectMemberRoleSchema,
    removeProjectMemberSchema,
    leaveProjectSchema,

    // Task Statuses
    createTaskStatusSchema,
    getTaskStatusesSchema,
    updateTaskStatusSchema,
    deleteTaskStatusSchema,

    // Project Labels
    createProjectLabelSchema,
    getProjectLabelsSchema,
    updateProjectLabelSchema,
    deleteProjectLabelSchema
};
