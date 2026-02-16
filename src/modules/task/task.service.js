const {
    Task,
    TaskAssignee,
    TaskDependency,
    TaskTag,
    ProjectMember,
    Project,
    TaskStatus,
    ProjectLabel,
    WorkspaceMember,
    User,
    ActivityLog,
    sequelize
} = require('../../database/models');
const { Op } = require('sequelize');
const emailService = require('../../shared/services/email.service');
const notificationService = require('../notification/notification.service');

class TaskService {
    /**
     * Create a new task
     */
    async createTask(projectId, userId, data) {
        const transaction = await sequelize.transaction();

        try {
            // Verify project membership
            const project = await Project.findByPk(projectId);
            if (!project) {
                throw new Error('Project not found');
            }

            const workspaceMember = await WorkspaceMember.findOne({
                where: { workspace_id: project.workspace_id, user_id: userId }
            });

            if (!workspaceMember) {
                throw new Error('You are not a member of this workspace');
            }

            const projectMember = await ProjectMember.findOne({
                where: { project_id: projectId, workspace_member_id: workspaceMember.id }
            });

            if (!projectMember || projectMember.project_role === 'viewer') {
                throw new Error('Insufficient permissions to create tasks');
            }

            // Force default status (To Do) even if specified, as per mission protocol
            const defaultStatus = await TaskStatus.findOne({
                where: { project_id: projectId, is_default: true },
                order: [['position', 'ASC']]
            });
            let statusId = defaultStatus?.id;

            if (!statusId) {
                throw new Error('Project initialization failed: Default column (To Do) not found');
            }

            // Get max position in status column
            const maxPosition = await Task.max('position', {
                where: { project_id: projectId, status_id: statusId }
            });
            const position = (maxPosition || -1) + 1;

            // Verify parent task if specified
            if (data.parent_task_id) {
                const parentTask = await Task.findByPk(data.parent_task_id);
                if (!parentTask || parentTask.project_id !== projectId) {
                    throw new Error('Invalid parent task');
                }
                if (parentTask.parent_task_id) {
                    throw new Error('Cannot create subtask of subtask (only 1 level allowed)');
                }
            }

            // Create task
            const task = await Task.create({
                project_id: projectId,
                status_id: statusId,
                title: data.title,
                description: data.description,
                priority: data.priority || 'medium',
                due_date: data.due_date,
                start_date: data.start_date,
                estimated_hours: data.estimated_hours,
                position,
                created_by: userId,
                parent_task_id: data.parent_task_id
            }, { transaction });

            // Assign members if specified
            if (data.assignee_ids && data.assignee_ids.length > 0) {
                for (const memberId of data.assignee_ids) {
                    const member = await ProjectMember.findByPk(memberId);
                    if (member && member.project_id === projectId) {
                        await TaskAssignee.create({
                            task_id: task.id,
                            project_member_id: memberId
                        }, { transaction });
                    }
                }

                // Auto-progression: If task is in default status and assigned, move to first non-default status
                const nextStatus = await TaskStatus.findOne({
                    where: {
                        project_id: projectId,
                        is_default: false,
                        is_completed: false
                    },
                    order: [['position', 'ASC']],
                    transaction
                });

                if (nextStatus) {
                    await task.update({
                        status_id: nextStatus.id,
                        completed_at: nextStatus.is_completed ? new Date() : null
                    }, { transaction });

                    await ActivityLog.create({
                        workspace_id: project.workspace_id,
                        project_id: project.id,
                        actor_id: userId,
                        action: 'task_status_changed',
                        description: `Neural Orchestrator: Auto-moved "${task.title}" to ${nextStatus.name} due to assignment.`,
                        meta: {
                            task_id: task.id,
                            from_status: defaultStatus.name,
                            to_status: nextStatus.name
                        }
                    }, { transaction });
                }
            }

            // Add labels if specified
            if (data.label_ids && data.label_ids.length > 0) {
                for (const labelId of data.label_ids) {
                    const label = await ProjectLabel.findByPk(labelId);
                    if (label && label.project_id === projectId) {
                        await TaskTag.create({
                            task_id: task.id,
                            label_id: labelId
                        }, { transaction });
                    }
                }
            }

            await transaction.commit();

            // Fetch complete task with relations
            return await this.getTaskById(task.id, userId);
        } catch (error) {
            if (!transaction.finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }

    /**
     * Get all tasks in a project with filtering
     */
    async getProjectTasks(projectId, userId, filters = {}) {
        const {
            status_id,
            priority,
            assignee_id,
            label_id,
            search,
            archived = 'false',
            page = 1,
            limit = 100  // Increased from 20 to 100 for better Kanban board support
        } = filters;

        const offset = (page - 1) * limit;

        // Verify project access
        const project = await Project.findByPk(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        const workspaceMember = await WorkspaceMember.findOne({
            where: { workspace_id: project.workspace_id, user_id: userId }
        });

        if (!workspaceMember) {
            throw new Error('Access denied');
        }

        // Build where clause
        const whereClause = { project_id: projectId, parent_task_id: null };

        if (status_id) {
            whereClause.status_id = status_id;
        }

        if (priority) {
            whereClause.priority = priority;
        }

        if (archived === 'true') {
            whereClause.archived_at = { [Op.not]: null };
        } else if (archived === 'false') {
            whereClause.archived_at = null;
        }

        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } }
            ];
        }

        // Build include array
        const include = [
            {
                model: TaskStatus,
                as: 'status',
                attributes: ['id', 'name', 'color']
            },
            {
                model: TaskAssignee,
                as: 'assignees',
                attributes: ['id', 'task_id', 'project_member_id', 'assigned_at', 'created_at', 'updated_at'],
                include: [
                    {
                        model: ProjectMember,
                        as: 'projectMember',
                        include: [
                            {
                                model: WorkspaceMember,
                                as: 'workspaceMember',
                                include: [
                                    {
                                        model: User,
                                        as: 'user',
                                        attributes: ['id', 'name', 'email', 'avatar_url']
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                model: TaskTag,
                as: 'tags',
                attributes: ['id', 'task_id', 'label_id', 'created_at', 'updated_at'],
                include: [
                    {
                        model: ProjectLabel,
                        as: 'label',
                        attributes: ['id', 'name', 'color']
                    }
                ]
            },
            {
                model: User,
                as: 'creator',
                attributes: ['id', 'name', 'email', 'avatar_url']
            }
        ];

        // Filter by assignee if specified
        if (assignee_id) {
            include[1].where = { project_member_id: assignee_id };
            include[1].required = true;
        }

        // Filter by label if specified
        if (label_id) {
            include[2].where = { label_id };
            include[2].required = true;
        }

        const { count, rows } = await Task.findAndCountAll({
            where: whereClause,
            include,
            limit,
            offset,
            order: [['position', 'ASC']],
            distinct: true
        });

        // Get subtask counts
        const tasksWithCounts = await Promise.all(rows.map(async (task) => {
            const subtaskCount = await Task.count({
                where: { parent_task_id: task.id }
            });

            const completedSubtasks = await Task.count({
                where: { parent_task_id: task.id, completed_at: { [Op.not]: null } }
            });

            const taskData = task.toJSON();

            return {
                ...taskData,
                subtask_count: subtaskCount,
                completed_subtasks: completedSubtasks,
                assignees: taskData.assignees?.map(a => ({
                    id: a.id,
                    user: a.projectMember?.workspaceMember?.user,
                    assigned_at: a.assigned_at
                })) || [],
                tags: taskData.tags?.map(t => t.label) || []
            };
        }));

        return {
            tasks: tasksWithCounts,
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        };
    }

    /**
     * Get task by ID with all relations
     */
    async getTaskById(taskId, userId) {
        const task = await Task.findByPk(taskId, {
            include: [
                {
                    model: TaskStatus,
                    as: 'status',
                    attributes: ['id', 'name', 'color', 'position']
                },
                {
                    model: TaskAssignee,
                    as: 'assignees',
                    attributes: ['id', 'task_id', 'project_member_id', 'assigned_at', 'created_at', 'updated_at'],
                    include: [
                        {
                            model: ProjectMember,
                            as: 'projectMember',
                            include: [
                                {
                                    model: WorkspaceMember,
                                    as: 'workspaceMember',
                                    include: [
                                        {
                                            model: User,
                                            as: 'user',
                                            attributes: ['id', 'name', 'email', 'avatar_url']
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    model: TaskTag,
                    as: 'tags',
                    attributes: ['id', 'task_id', 'label_id', 'created_at', 'updated_at'],
                    include: [
                        {
                            model: ProjectLabel,
                            as: 'label',
                            attributes: ['id', 'name', 'color']
                        }
                    ]
                },
                {
                    model: TaskDependency,
                    as: 'dependencies',
                    include: [
                        {
                            model: Task,
                            as: 'dependsOnTask',
                            attributes: ['id', 'title', 'status_id', 'completed_at']
                        }
                    ]
                },
                {
                    model: TaskDependency,
                    as: 'dependents',
                    include: [
                        {
                            model: Task,
                            as: 'task',
                            attributes: ['id', 'title', 'status_id', 'completed_at']
                        }
                    ]
                },
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email', 'avatar_url']
                },
                {
                    model: Task,
                    as: 'parentTask',
                    attributes: ['id', 'title']
                }
            ]
        });

        if (!task) {
            throw new Error('Task not found');
        }

        // Verify access
        const project = await Project.findByPk(task.project_id);
        const workspaceMember = await WorkspaceMember.findOne({
            where: { workspace_id: project.workspace_id, user_id: userId }
        });

        if (!workspaceMember) {
            throw new Error('Access denied');
        }

        // Get subtasks count
        const subtaskCount = await Task.count({
            where: { parent_task_id: taskId }
        });

        const completedSubtasks = await Task.count({
            where: { parent_task_id: taskId, completed_at: { [Op.not]: null } }
        });

        const taskData = task.toJSON();

        return {
            ...taskData,
            subtask_count: subtaskCount,
            completed_subtasks: completedSubtasks,
            assignees: taskData.assignees?.map(a => ({
                id: a.id,
                project_member_id: a.project_member_id,
                user: a.projectMember?.workspaceMember?.user,
                assigned_at: a.assigned_at
            })) || [],
            tags: taskData.tags?.map(t => t.label) || [],
            dependencies: taskData.dependencies?.map(d => ({
                id: d.id,
                dependency_type: d.dependency_type,
                task: d.dependsOnTask
            })) || [],
            dependents: taskData.dependents?.map(d => ({
                id: d.id,
                dependency_type: d.dependency_type,
                task: d.task
            })) || []
        };
    }

    /**
     * Update task
     */
    async updateTask(taskId, userId, data) {
        const task = await Task.findByPk(taskId);

        if (!task) {
            throw new Error('Task not found');
        }

        // Check permissions
        const project = await Project.findByPk(task.project_id);
        const workspaceMember = await WorkspaceMember.findOne({
            where: { workspace_id: project.workspace_id, user_id: userId }
        });

        if (!workspaceMember) {
            throw new Error('Access denied');
        }

        const projectMember = await ProjectMember.findOne({
            where: { project_id: task.project_id, workspace_member_id: workspaceMember.id }
        });

        if (!projectMember || projectMember.project_role === 'viewer') {
            throw new Error('Insufficient permissions');
        }

        // Handle status update if provided through general update
        if (data.status_id && data.status_id !== task.status_id) {
            const newStatus = await TaskStatus.findByPk(data.status_id);
            if (!newStatus || newStatus.project_id !== task.project_id) {
                throw new Error('Invalid status for this project');
            }
            task.status_id = data.status_id;
            task.completed_at = newStatus.is_completed ? new Date() : null;
        }

        // Update task fields
        await task.update({
            title: data.title !== undefined ? data.title : task.title,
            description: data.description !== undefined ? data.description : task.description,
            priority: data.priority !== undefined ? data.priority : task.priority,
            due_date: data.due_date !== undefined ? data.due_date : task.due_date,
            start_date: data.start_date !== undefined ? data.start_date : task.start_date,
            estimated_hours: data.estimated_hours !== undefined ? data.estimated_hours : task.estimated_hours,
            actual_hours: data.actual_hours !== undefined ? data.actual_hours : task.actual_hours,
            status_id: task.status_id,
            completed_at: task.completed_at
        });

        return await this.getTaskById(taskId, userId);
    }

    /**
     * Move task to different status/position (drag & drop)
     */
    async moveTask(taskId, statusId, position, userId) {
        const transaction = await sequelize.transaction();

        try {
            const task = await Task.findByPk(taskId);

            if (!task) {
                throw new Error('Task not found');
            }

            // Check permissions
            const project = await Project.findByPk(task.project_id);
            const workspaceMember = await WorkspaceMember.findOne({
                where: { workspace_id: project.workspace_id, user_id: userId }
            });

            if (!workspaceMember) {
                throw new Error('Access denied');
            }

            const projectMember = await ProjectMember.findOne({
                where: { project_id: task.project_id, workspace_member_id: workspaceMember.id }
            });

            if (!projectMember || projectMember.project_role === 'viewer') {
                throw new Error('Insufficient permissions');
            }

            // Verify new status belongs to same project
            const newStatus = await TaskStatus.findByPk(statusId);
            if (!newStatus || newStatus.project_id !== task.project_id) {
                throw new Error('Invalid status');
            }

            const oldStatusId = task.status_id;
            const oldPosition = task.position;
            const oldStatus = await TaskStatus.findByPk(oldStatusId);

            // Restriction: Only assigned users (or leads/admins) can mark a task as completed
            if (newStatus.is_completed && !oldStatus.is_completed) {
                const isAssignee = await TaskAssignee.findOne({
                    where: { task_id: taskId, project_member_id: projectMember.id }
                });

                const isLeadOrAdmin = projectMember.project_role === 'lead' ||
                    ['owner', 'admin'].includes(workspaceMember.role);

                if (!isAssignee && !isLeadOrAdmin) {
                    throw new Error('Only assigned members or project leads can mark this task as completed');
                }
            }

            // If status changed
            if (oldStatusId !== statusId) {
                // Remove from old status (reorder remaining tasks)
                await Task.update(
                    { position: sequelize.literal('position - 1') },
                    {
                        where: {
                            project_id: task.project_id,
                            status_id: oldStatusId,
                            position: { [Op.gt]: oldPosition }
                        },
                        transaction
                    }
                );

                // Make space in new status
                await Task.update(
                    { position: sequelize.literal('position + 1') },
                    {
                        where: {
                            project_id: task.project_id,
                            status_id: statusId,
                            position: { [Op.gte]: position }
                        },
                        transaction
                    }
                );

                // Update task
                await task.update({
                    status_id: statusId,
                    position,
                    completed_at: newStatus.is_completed ? new Date() : null
                }, { transaction });
            } else if (oldPosition !== position) {
                // Same status, different position
                if (position > oldPosition) {
                    // Moving down
                    await Task.update(
                        { position: sequelize.literal('position - 1') },
                        {
                            where: {
                                project_id: task.project_id,
                                status_id: statusId,
                                position: { [Op.gt]: oldPosition, [Op.lte]: position }
                            },
                            transaction
                        }
                    );
                } else {
                    // Moving up
                    await Task.update(
                        { position: sequelize.literal('position + 1') },
                        {
                            where: {
                                project_id: task.project_id,
                                status_id: statusId,
                                position: { [Op.gte]: position, [Op.lt]: oldPosition }
                            },
                            transaction
                        }
                    );
                }

                await task.update({ position }, { transaction });
            }

            await transaction.commit();

            // Log activity
            const activityService = require('../activity/activity.service');
            await activityService.logActivity(project.workspace_id, userId, 'TASK_MOVED', {
                task_id: taskId,
                project_id: project.id,
                task_title: task.title,
                old_status: oldStatus.name,
                new_status: newStatus.name
            });

            return await this.getTaskById(taskId, userId);
        } catch (error) {
            if (!transaction.finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }

    /**
     * Archive or unarchive task
     */
    async archiveTask(taskId, userId, archived) {
        const task = await Task.findByPk(taskId);

        if (!task) {
            throw new Error('Task not found');
        }

        // Check permissions
        const project = await Project.findByPk(task.project_id);
        const workspaceMember = await WorkspaceMember.findOne({
            where: { workspace_id: project.workspace_id, user_id: userId }
        });

        if (!workspaceMember) {
            throw new Error('Access denied');
        }

        const projectMember = await ProjectMember.findOne({
            where: { project_id: task.project_id, workspace_member_id: workspaceMember.id }
        });

        if (!projectMember || projectMember.project_role === 'viewer') {
            throw new Error('Insufficient permissions');
        }

        await task.update({
            archived_at: archived ? new Date() : null
        });

        return await this.getTaskById(taskId, userId);
    }

    /**
     * Delete task (hard delete)
     */
    async deleteTask(taskId, userId) {
        const task = await Task.findByPk(taskId);

        if (!task) {
            throw new Error('Task not found');
        }

        // Check permissions (only project lead or workspace owner/admin)
        const project = await Project.findByPk(task.project_id);
        const workspaceMember = await WorkspaceMember.findOne({
            where: { workspace_id: project.workspace_id, user_id: userId }
        });

        if (!workspaceMember) {
            throw new Error('Access denied');
        }

        const projectMember = await ProjectMember.findOne({
            where: { project_id: task.project_id, workspace_member_id: workspaceMember.id }
        });

        if (!['owner', 'admin'].includes(workspaceMember.role) && projectMember?.project_role !== 'lead') {
            throw new Error('Only project leads or workspace owners/admins can delete tasks');
        }

        await task.destroy();
    }

    /**
     * Assign members to task
     */
    async assignMembers(taskId, memberIds, userId) {
        const task = await Task.findByPk(taskId);

        if (!task) {
            throw new Error('Task not found');
        }

        // Check permissions
        const project = await Project.findByPk(task.project_id);
        const workspaceMember = await WorkspaceMember.findOne({
            where: { workspace_id: project.workspace_id, user_id: userId }
        });

        if (!workspaceMember) {
            throw new Error('Access denied');
        }

        const projectMember = await ProjectMember.findOne({
            where: { project_id: task.project_id, workspace_member_id: workspaceMember.id }
        });

        if (!projectMember || projectMember.project_role === 'viewer') {
            throw new Error('Insufficient permissions to assign members. Only project collaborators can manage assignments.');
        }

        // Verify all members belong to project
        const members = await ProjectMember.findAll({
            where: {
                id: memberIds,
                project_id: task.project_id
            }
        });

        if (members.length !== memberIds.length) {
            throw new Error('Some members are not part of this project');
        }

        // Add assignees (ignore duplicates)
        const newlyAssignedMembers = [];
        for (const memberId of memberIds) {
            try {
                await TaskAssignee.create({
                    task_id: taskId,
                    project_member_id: memberId
                }, {
                    returning: ['id', 'task_id', 'project_member_id', 'assigned_at', 'created_at', 'updated_at']
                });
                newlyAssignedMembers.push(memberId);
            } catch (error) {
                // Ignore duplicate key errors (unique constraint violation)
                if (error.name !== 'SequelizeUniqueConstraintError') {
                    throw error;
                }
            }
        }

        // Auto-progression: If task is in default status, move to first non-completed, non-default status
        const currentStatus = await TaskStatus.findByPk(task.status_id);
        if (currentStatus?.is_default && newlyAssignedMembers.length > 0) {
            const inProgressStatus = await TaskStatus.findOne({
                where: {
                    project_id: task.project_id,
                    is_completed: false,
                    is_default: false
                },
                order: [['position', 'ASC']]
            });

            if (inProgressStatus) {
                const oldStatusName = currentStatus.name;
                await task.update({
                    status_id: inProgressStatus.id,
                    completed_at: inProgressStatus.is_completed ? new Date() : null
                });
                // Log activity for auto-transition
                const { ActivityLog } = require('../../database/models'); // Ensure ActivityLog is available
                await ActivityLog.create({
                    workspace_id: project.workspace_id,
                    project_id: project.id,
                    actor_id: userId,
                    action: 'task_status_changed',
                    description: `Neural Orchestrator: Auto-moved "${task.title}" to ${inProgressStatus.name} due to assignment.`,
                    meta: {
                        task_id: task.id,
                        from_status: oldStatusName,
                        to_status: inProgressStatus.name
                    }
                });
            }
        }

        // Send email notifications to newly assigned members (non-blocking)
        if (newlyAssignedMembers.length > 0) {
            const assignedBy = await User.findOne({
                include: [{
                    model: WorkspaceMember,
                    as: 'workspaceMemberships',
                    where: { id: workspaceMember.id }
                }]
            });

            const project = await Project.findByPk(task.project_id);

            for (const memberId of newlyAssignedMembers) {
                const projectMember = await ProjectMember.findOne({
                    where: { id: memberId },
                    include: [{
                        model: WorkspaceMember,
                        as: 'workspaceMember',
                        include: [{
                            model: User,
                            as: 'user'
                        }]
                    }]
                });

                if (projectMember?.workspaceMember?.user?.email) {
                    const assigneeUser = projectMember.workspaceMember.user;

                    // Send email notification
                    emailService.sendTaskAssignment(
                        assigneeUser.email,
                        task.title,
                        project.name,
                        assignedBy.name,
                        task.id
                    ).catch(err => {
                        console.error('Failed to send task assignment email:', err.message);
                    });

                    // Create in-app notification
                    notificationService.notifyTaskAssignment(
                        assigneeUser.id,
                        task.title,
                        assignedBy.name,
                        task.id
                    ).catch(err => {
                        console.error('Failed to create task assignment notification:', err.message);
                    });
                }
            }
        }

        // Return the full updated task with new status
        return await this.getTaskById(taskId, userId);
    }

    /**
     * Get task assignees
     */
    async getAssignees(taskId) {
        const assignees = await TaskAssignee.findAll({
            where: { task_id: taskId },
            attributes: ['id', 'task_id', 'project_member_id', 'assigned_at', 'created_at', 'updated_at'],
            include: [
                {
                    model: ProjectMember,
                    as: 'projectMember',
                    include: [
                        {
                            model: WorkspaceMember,
                            as: 'workspaceMember',
                            include: [
                                {
                                    model: User,
                                    as: 'user',
                                    attributes: ['id', 'name', 'email', 'avatar_url']
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [['assigned_at', 'ASC']]
        });

        return assignees.map(a => ({
            id: a.id,
            user: a.projectMember?.workspaceMember?.user,
            assigned_at: a.assigned_at
        }));
    }

    /**
     * Remove assignee from task
     */
    async removeAssignee(taskId, assigneeId, userId) {
        const assignee = await TaskAssignee.findByPk(assigneeId);

        if (!assignee || assignee.task_id !== taskId) {
            throw new Error('Assignee not found');
        }

        const task = await Task.findByPk(taskId);

        // Check permissions
        const project = await Project.findByPk(task.project_id);
        const workspaceMember = await WorkspaceMember.findOne({
            where: { workspace_id: project.workspace_id, user_id: userId }
        });

        if (!workspaceMember) {
            throw new Error('Access denied');
        }

        const projectMember = await ProjectMember.findOne({
            where: { project_id: task.project_id, workspace_member_id: workspaceMember.id }
        });

        if (!projectMember || projectMember.project_role === 'viewer') {
            throw new Error('Insufficient permissions');
        }

        await assignee.destroy();
    }

    /**
     * Add dependency to task
     */
    async addDependency(taskId, dependsOnTaskId, dependencyType, userId) {
        const task = await Task.findByPk(taskId);

        if (!task) {
            throw new Error('Task not found');
        }

        const dependsOnTask = await Task.findByPk(dependsOnTaskId);

        if (!dependsOnTask) {
            throw new Error('Dependent task not found');
        }

        // Verify both tasks in same project
        if (task.project_id !== dependsOnTask.project_id) {
            throw new Error('Tasks must be in the same project');
        }

        // Check permissions
        const project = await Project.findByPk(task.project_id);
        const workspaceMember = await WorkspaceMember.findOne({
            where: { workspace_id: project.workspace_id, user_id: userId }
        });

        if (!workspaceMember) {
            throw new Error('Access denied');
        }

        const projectMember = await ProjectMember.findOne({
            where: { project_id: task.project_id, workspace_member_id: workspaceMember.id }
        });

        if (!projectMember || projectMember.project_role === 'viewer') {
            throw new Error('Insufficient permissions');
        }

        // Check for circular dependency
        const hasCircular = await this.checkCircularDependency(taskId, dependsOnTaskId);
        if (hasCircular) {
            throw new Error('Circular dependency detected');
        }

        // Create dependency
        const dependency = await TaskDependency.create({
            task_id: taskId,
            depends_on_task_id: dependsOnTaskId,
            dependency_type: dependencyType
        });

        return await TaskDependency.findByPk(dependency.id, {
            include: [
                {
                    model: Task,
                    as: 'dependsOnTask',
                    attributes: ['id', 'title', 'status_id', 'completed_at']
                }
            ]
        });
    }

    /**
     * Check for circular dependencies
     */
    async checkCircularDependency(taskId, dependsOnTaskId) {
        // Simple check: if dependsOnTask depends on taskId (directly or indirectly)
        const visited = new Set();
        const queue = [dependsOnTaskId];

        while (queue.length > 0) {
            const currentId = queue.shift();

            if (currentId === taskId) {
                return true; // Circular dependency found
            }

            if (visited.has(currentId)) {
                continue;
            }

            visited.add(currentId);

            // Get all tasks that currentId depends on
            const dependencies = await TaskDependency.findAll({
                where: { task_id: currentId }
            });

            for (const dep of dependencies) {
                queue.push(dep.depends_on_task_id);
            }
        }

        return false;
    }

    /**
     * Get task dependencies
     */
    async getDependencies(taskId) {
        const dependencies = await TaskDependency.findAll({
            where: { task_id: taskId },
            include: [
                {
                    model: Task,
                    as: 'dependsOnTask',
                    attributes: ['id', 'title', 'status_id', 'priority', 'completed_at'],
                    include: [
                        {
                            model: TaskStatus,
                            as: 'status',
                            attributes: ['id', 'name', 'color']
                        }
                    ]
                }
            ]
        });

        return dependencies.map(d => ({
            id: d.id,
            dependency_type: d.dependency_type,
            task: d.dependsOnTask
        }));
    }

    /**
     * Remove dependency
     */
    async removeDependency(taskId, dependencyId, userId) {
        const dependency = await TaskDependency.findByPk(dependencyId);

        if (!dependency || dependency.task_id !== taskId) {
            throw new Error('Dependency not found');
        }

        const task = await Task.findByPk(taskId);

        // Check permissions
        const project = await Project.findByPk(task.project_id);
        const workspaceMember = await WorkspaceMember.findOne({
            where: { workspace_id: project.workspace_id, user_id: userId }
        });

        if (!workspaceMember) {
            throw new Error('Access denied');
        }

        const projectMember = await ProjectMember.findOne({
            where: { project_id: task.project_id, workspace_member_id: workspaceMember.id }
        });

        if (!projectMember || projectMember.project_role === 'viewer') {
            throw new Error('Insufficient permissions');
        }

        await dependency.destroy();
    }

    /**
     * Add tags to task
     */
    async addTags(taskId, labelIds, userId) {
        const task = await Task.findByPk(taskId);

        if (!task) {
            throw new Error('Task not found');
        }

        // Check permissions
        const project = await Project.findByPk(task.project_id);
        const workspaceMember = await WorkspaceMember.findOne({
            where: { workspace_id: project.workspace_id, user_id: userId }
        });

        if (!workspaceMember) {
            throw new Error('Access denied');
        }

        const projectMember = await ProjectMember.findOne({
            where: { project_id: task.project_id, workspace_member_id: workspaceMember.id }
        });

        if (!projectMember || projectMember.project_role === 'viewer') {
            throw new Error('Insufficient permissions');
        }

        // Verify all labels belong to project
        const labels = await ProjectLabel.findAll({
            where: {
                id: labelIds,
                project_id: task.project_id
            }
        });

        if (labels.length !== labelIds.length) {
            throw new Error('Some labels do not belong to this project');
        }

        // Add tags (ignore duplicates)
        for (const labelId of labelIds) {
            try {
                await TaskTag.create({
                    task_id: taskId,
                    label_id: labelId
                }, {
                    returning: ['id', 'task_id', 'label_id', 'created_at', 'updated_at']
                });
            } catch (error) {
                // Ignore duplicate key errors (unique constraint violation)
                if (error.name !== 'SequelizeUniqueConstraintError') {
                    throw error;
                }
            }
        }

        return await this.getTags(taskId);
    }

    /**
     * Get task tags
     */
    async getTags(taskId) {
        const tags = await TaskTag.findAll({
            where: { task_id: taskId },
            attributes: ['id', 'task_id', 'label_id', 'created_at', 'updated_at'],
            include: [
                {
                    model: ProjectLabel,
                    as: 'label',
                    attributes: ['id', 'name', 'color']
                }
            ]
        });

        return tags.map(t => t.label);
    }

    /**
     * Remove tag from task
     */
    async removeTag(taskId, tagId, userId) {
        const tag = await TaskTag.findByPk(tagId);

        if (!tag || tag.task_id !== taskId) {
            throw new Error('Tag not found');
        }

        const task = await Task.findByPk(taskId);

        // Check permissions
        const project = await Project.findByPk(task.project_id);
        const workspaceMember = await WorkspaceMember.findOne({
            where: { workspace_id: project.workspace_id, user_id: userId }
        });

        if (!workspaceMember) {
            throw new Error('Access denied');
        }

        const projectMember = await ProjectMember.findOne({
            where: { project_id: task.project_id, workspace_member_id: workspaceMember.id }
        });

        if (!projectMember || projectMember.project_role === 'viewer') {
            throw new Error('Insufficient permissions');
        }

        await tag.destroy();
    }

    /**
     * Search tasks
     */
    async searchTasks(projectId, query, filters = {}) {
        const { priority, status = 'active', page = 1, limit = 20 } = filters;
        const offset = (page - 1) * limit;

        const whereClause = {
            project_id: projectId,
            [Op.or]: [
                { title: { [Op.iLike]: `%${query}%` } },
                { description: { [Op.iLike]: `%${query}%` } }
            ]
        };

        if (priority) {
            whereClause.priority = priority;
        }

        if (status === 'active') {
            whereClause.archived_at = null;
            whereClause.completed_at = null;
        } else if (status === 'completed') {
            whereClause.completed_at = { [Op.not]: null };
        } else if (status === 'archived') {
            whereClause.archived_at = { [Op.not]: null };
        }

        const { count, rows } = await Task.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: TaskStatus,
                    as: 'status',
                    attributes: ['id', 'name', 'color']
                }
            ],
            limit,
            offset,
            order: [['created_at', 'DESC']]
        });

        return {
            tasks: rows,
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        };
    }

    /**
     * Get user's tasks across projects
     */
    async getMyTasks(userId, filters = {}) {
        const { workspace_id, project_id, status = 'active', priority, page = 1, limit = 20 } = filters;
        const offset = (page - 1) * limit;

        // Get user's workspace member IDs
        const workspaceMemberWhere = { user_id: userId };
        if (workspace_id) {
            workspaceMemberWhere.workspace_id = workspace_id;
        }

        const workspaceMembers = await WorkspaceMember.findAll({
            where: workspaceMemberWhere
        });

        const workspaceMemberIds = workspaceMembers.map(wm => wm.id);

        // Get user's project member IDs
        const projectMemberWhere = { workspace_member_id: workspaceMemberIds };
        if (project_id) {
            projectMemberWhere.project_id = project_id;
        }

        const projectMembers = await ProjectMember.findAll({
            where: projectMemberWhere
        });

        const projectMemberIds = projectMembers.map(pm => pm.id);

        // Get tasks assigned to user
        const assigneeWhere = { project_member_id: projectMemberIds };

        const taskAssignees = await TaskAssignee.findAll({
            where: assigneeWhere,
            attributes: ['id', 'task_id', 'project_member_id', 'assigned_at', 'created_at', 'updated_at'],
            include: [
                {
                    model: Task,
                    as: 'task',
                    include: [
                        {
                            model: TaskStatus,
                            as: 'status',
                            attributes: ['id', 'name', 'color']
                        },
                        {
                            model: Project,
                            as: 'project',
                            attributes: ['id', 'name', 'color']
                        }
                    ]
                }
            ]
        });

        let tasks = taskAssignees.map(ta => ta.task).filter(t => t !== null);

        // Apply filters
        if (status === 'active') {
            tasks = tasks.filter(t => !t.archived_at && !t.completed_at);
        } else if (status === 'completed') {
            tasks = tasks.filter(t => t.completed_at);
        } else if (status === 'overdue') {
            const now = new Date();
            tasks = tasks.filter(t => t.due_date && new Date(t.due_date) < now && !t.completed_at);
        }

        if (priority) {
            tasks = tasks.filter(t => t.priority === priority);
        }

        // Pagination
        const total = tasks.length;
        const paginatedTasks = tasks.slice(offset, offset + limit);

        return {
            tasks: paginatedTasks,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Create subtask
     */
    async createSubtask(parentTaskId, userId, data) {
        const parentTask = await Task.findByPk(parentTaskId);

        if (!parentTask) {
            throw new Error('Parent task not found');
        }

        if (parentTask.parent_task_id) {
            throw new Error('Cannot create subtask of subtask (only 1 level allowed)');
        }

        // Create subtask with parent_task_id set
        return await this.createTask(parentTask.project_id, userId, {
            ...data,
            parent_task_id: parentTaskId
        });
    }

    /**
     * Get subtasks
     */
    async getSubtasks(taskId) {
        const subtasks = await Task.findAll({
            where: { parent_task_id: taskId },
            include: [
                {
                    model: TaskStatus,
                    as: 'status',
                    attributes: ['id', 'name', 'color']
                },
                {
                    model: TaskAssignee,
                    as: 'assignees',
                    attributes: ['id', 'task_id', 'project_member_id', 'assigned_at', 'created_at', 'updated_at'],
                    include: [
                        {
                            model: ProjectMember,
                            as: 'projectMember',
                            include: [
                                {
                                    model: WorkspaceMember,
                                    as: 'workspaceMember',
                                    include: [
                                        {
                                            model: User,
                                            as: 'user',
                                            attributes: ['id', 'name', 'email', 'avatar_url']
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [['position', 'ASC']]
        });

        return subtasks.map(st => {
            const data = st.toJSON();
            return {
                ...data,
                assignees: data.assignees?.map(a => ({
                    id: a.id,
                    user: a.projectMember?.workspaceMember?.user,
                    assigned_at: a.assigned_at
                })) || []
            };
        });
    }
}

module.exports = new TaskService();
