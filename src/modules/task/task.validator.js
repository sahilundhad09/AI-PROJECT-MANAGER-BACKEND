const { z } = require('zod');

// Helper schemas
const uuidSchema = z.string().uuid('Invalid UUID format');
const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(500).optional().default(100)
});

// Task CRUD Validators

const createTaskSchema = z.object({
    body: z.object({
        title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must not exceed 200 characters'),
        description: z.string().max(5000, 'Description must not exceed 5000 characters').optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
        due_date: z.string().datetime().optional(),
        start_date: z.string().datetime().optional(),
        estimated_hours: z.number().min(0, 'Estimated hours must be positive').optional(),
        parent_task_id: uuidSchema.optional(),
        assignee_ids: z.array(uuidSchema).optional(),
        label_ids: z.array(uuidSchema).optional()
    }),
    params: z.object({
        projectId: uuidSchema
    })
});

const getProjectTasksSchema = z.object({
    params: z.object({
        projectId: uuidSchema
    }),
    query: z.object({
        status_id: uuidSchema.optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
        assignee_id: uuidSchema.optional(),
        label_id: uuidSchema.optional(),
        search: z.string().optional(),
        archived: z.enum(['true', 'false']).optional(),
        ...paginationSchema.shape
    })
});

const getTaskDetailsSchema = z.object({
    params: z.object({
        taskId: uuidSchema
    })
});

const updateTaskSchema = z.object({
    body: z.object({
        title: z.string().min(3).max(200).optional(),
        description: z.string().max(5000).optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
        due_date: z.string().datetime().nullable().optional(),
        start_date: z.string().datetime().nullable().optional(),
        estimated_hours: z.number().min(0).nullable().optional(),
        actual_hours: z.number().min(0).nullable().optional()
    }),
    params: z.object({
        taskId: uuidSchema
    })
});

const moveTaskSchema = z.object({
    body: z.object({
        status_id: uuidSchema,
        position: z.number().int().min(0, 'Position must be non-negative')
    }),
    params: z.object({
        taskId: uuidSchema
    })
});

const archiveTaskSchema = z.object({
    body: z.object({
        archived: z.boolean()
    }),
    params: z.object({
        taskId: uuidSchema
    })
});

const deleteTaskSchema = z.object({
    params: z.object({
        taskId: uuidSchema
    })
});

// Task Assignee Validators

const assignMembersSchema = z.object({
    body: z.object({
        project_member_ids: z.array(uuidSchema).min(1, 'At least one member must be specified')
    }),
    params: z.object({
        taskId: uuidSchema
    })
});

const getTaskAssigneesSchema = z.object({
    params: z.object({
        taskId: uuidSchema
    })
});

const removeAssigneeSchema = z.object({
    params: z.object({
        taskId: uuidSchema,
        assigneeId: uuidSchema
    })
});

// Task Dependency Validators

const addDependencySchema = z.object({
    body: z.object({
        depends_on_task_id: uuidSchema,
        dependency_type: z.enum(['blocks', 'blocked_by'])
    }),
    params: z.object({
        taskId: uuidSchema
    })
});

const getTaskDependenciesSchema = z.object({
    params: z.object({
        taskId: uuidSchema
    })
});

const removeDependencySchema = z.object({
    params: z.object({
        taskId: uuidSchema,
        dependencyId: uuidSchema
    })
});

// Task Tag Validators

const addTagsSchema = z.object({
    body: z.object({
        label_ids: z.array(uuidSchema).min(1, 'At least one label must be specified')
    }),
    params: z.object({
        taskId: uuidSchema
    })
});

const getTaskTagsSchema = z.object({
    params: z.object({
        taskId: uuidSchema
    })
});

const removeTagSchema = z.object({
    params: z.object({
        taskId: uuidSchema,
        tagId: uuidSchema
    })
});

// Search & Filter Validators

const searchTasksSchema = z.object({
    params: z.object({
        projectId: uuidSchema
    }),
    query: z.object({
        q: z.string().min(1, 'Search query is required'),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
        status: z.enum(['active', 'completed', 'archived', 'all']).optional(),
        ...paginationSchema.shape
    })
});

const getMyTasksSchema = z.object({
    query: z.object({
        workspace_id: uuidSchema.optional(),
        project_id: uuidSchema.optional(),
        status: z.enum(['active', 'completed', 'overdue', 'all']).optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
        ...paginationSchema.shape
    })
});

// Subtask Validators

const createSubtaskSchema = z.object({
    body: z.object({
        title: z.string().min(3).max(200),
        description: z.string().max(5000).optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
        due_date: z.string().datetime().optional(),
        assignee_ids: z.array(uuidSchema).optional()
    }),
    params: z.object({
        parentTaskId: uuidSchema
    })
});

const getSubtasksSchema = z.object({
    params: z.object({
        taskId: uuidSchema
    })
});

module.exports = {
    createTaskSchema,
    getProjectTasksSchema,
    getTaskDetailsSchema,
    updateTaskSchema,
    moveTaskSchema,
    archiveTaskSchema,
    deleteTaskSchema,
    assignMembersSchema,
    getTaskAssigneesSchema,
    removeAssigneeSchema,
    addDependencySchema,
    getTaskDependenciesSchema,
    removeDependencySchema,
    addTagsSchema,
    getTaskTagsSchema,
    removeTagSchema,
    searchTasksSchema,
    getMyTasksSchema,
    createSubtaskSchema,
    getSubtasksSchema
};
