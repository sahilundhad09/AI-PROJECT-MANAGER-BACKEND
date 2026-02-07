const { ActivityLog, Workspace, Project, Task, User, WorkspaceMember, ProjectMember } = require('../../database/models');

class ActivityService {
    /**
     * Log an activity
     */
    async logActivity(workspaceId, actorId, action, meta = {}) {
        try {
            await ActivityLog.create({
                workspace_id: workspaceId,
                project_id: meta.project_id || null,
                task_id: meta.task_id || null,
                actor_id: actorId,
                action: action,
                meta: meta
            });
        } catch (error) {
            console.error('Error logging activity:', error);
            // Don't throw - activity logging should not break the main flow
        }
    }

    /**
     * Get workspace activity feed
     */
    async getWorkspaceActivity(workspaceId, userId, filters = {}) {
        const { page = 1, limit = 50 } = filters;
        const offset = (page - 1) * limit;

        // Verify user has access to workspace
        const workspaceMember = await WorkspaceMember.findOne({
            where: {
                workspace_id: workspaceId,
                user_id: userId
            }
        });

        if (!workspaceMember) {
            throw new Error('You do not have access to this workspace');
        }

        // Get activity logs
        const { count, rows: activities } = await ActivityLog.findAndCountAll({
            where: { workspace_id: workspaceId },
            attributes: ['id', 'workspace_id', 'project_id', 'task_id', 'actor_id', 'action', 'meta', 'created_at'],
            include: [
                {
                    model: User,
                    as: 'actor',
                    attributes: ['id', 'name', 'email', 'avatar_url']
                },
                {
                    model: Project,
                    as: 'project',
                    attributes: ['id', 'name'],
                    required: false
                },
                {
                    model: Task,
                    as: 'task',
                    attributes: ['id', 'title'],
                    required: false
                }
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        return {
            activities,
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        };
    }

    /**
     * Get project activity feed
     */
    async getProjectActivity(projectId, userId, filters = {}) {
        const { page = 1, limit = 50 } = filters;
        const offset = (page - 1) * limit;

        // Verify project exists and user has access
        const project = await Project.findByPk(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        const workspaceMember = await WorkspaceMember.findOne({
            where: {
                workspace_id: project.workspace_id,
                user_id: userId
            }
        });

        if (!workspaceMember) {
            throw new Error('You do not have access to this project');
        }

        const projectMember = await ProjectMember.findOne({
            where: {
                project_id: projectId,
                workspace_member_id: workspaceMember.id
            }
        });

        if (!projectMember) {
            throw new Error('You are not a member of this project');
        }

        // Get activity logs
        const { count, rows: activities } = await ActivityLog.findAndCountAll({
            where: { project_id: projectId },
            attributes: ['id', 'workspace_id', 'project_id', 'task_id', 'actor_id', 'action', 'meta', 'created_at'],
            include: [
                {
                    model: User,
                    as: 'actor',
                    attributes: ['id', 'name', 'email', 'avatar_url']
                },
                {
                    model: Task,
                    as: 'task',
                    attributes: ['id', 'title'],
                    required: false
                }
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        return {
            activities,
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        };
    }

    /**
     * Get task activity timeline
     */
    async getTaskActivity(taskId, userId) {
        // Verify task exists and user has access
        const task = await Task.findByPk(taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        const project = await Project.findByPk(task.project_id);
        if (!project) {
            throw new Error('Project not found');
        }

        const workspaceMember = await WorkspaceMember.findOne({
            where: {
                workspace_id: project.workspace_id,
                user_id: userId
            }
        });

        if (!workspaceMember) {
            throw new Error('You do not have access to this task');
        }

        const projectMember = await ProjectMember.findOne({
            where: {
                project_id: task.project_id,
                workspace_member_id: workspaceMember.id
            }
        });

        if (!projectMember) {
            throw new Error('You are not a member of this project');
        }

        // Get activity logs for task
        const activities = await ActivityLog.findAll({
            where: { task_id: taskId },
            attributes: ['id', 'workspace_id', 'project_id', 'task_id', 'actor_id', 'action', 'meta', 'created_at'],
            include: [
                {
                    model: User,
                    as: 'actor',
                    attributes: ['id', 'name', 'email', 'avatar_url']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        return activities;
    }
}

module.exports = new ActivityService();
