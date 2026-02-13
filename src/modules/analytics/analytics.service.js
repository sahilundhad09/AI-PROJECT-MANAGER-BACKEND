const {
    Task,
    Project,
    Workspace,
    TaskAssignee,
    ProjectMember,
    WorkspaceMember,
    User,
    ActivityLog,
    TaskStatus,
    sequelize
} = require('../../database/models');
const { Op } = require('sequelize');

class AnalyticsService {
    /**
     * Get project analytics/dashboard
     */
    async getProjectAnalytics(projectId, userId) {
        // Verify access
        const project = await Project.findByPk(projectId);
        if (!project) {
            const error = new Error('Project not found');
            error.statusCode = 404;
            throw error;
        }

        // Get task statistics
        const taskStats = await this.getProjectTaskStats(projectId);

        // Get assignee workload
        const assigneeWorkload = await this.getAssigneeWorkload(projectId);

        // Get burndown data (last 30 days)
        const burndownData = await this.getBurndownData(projectId);

        // Get recent activity
        const recentActivity = await this.getRecentActivity(projectId, 10);

        return {
            taskStats,
            assigneeWorkload,
            burndownData,
            recentActivity
        };
    }

    /**
     * Get workspace analytics/overview
     */
    async getWorkspaceAnalytics(workspaceId, userId) {
        // Verify access
        const workspace = await Workspace.findByPk(workspaceId);
        if (!workspace) {
            const error = new Error('Workspace not found');
            error.statusCode = 404;
            throw error;
        }

        // Get project count
        const projectCount = await Project.count({
            where: { workspace_id: workspaceId }
        });

        // Get active projects (projects with tasks updated in last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const activeProjects = await Project.count({
            where: {
                workspace_id: workspaceId,
                updated_at: { [Op.gte]: sevenDaysAgo }
            }
        });

        // Get total tasks across all projects
        const totalTasks = await Task.count({
            include: [{
                model: Project,
                as: 'project',
                where: { workspace_id: workspaceId },
                attributes: []
            }]
        });

        const completedTasks = await Task.count({
            include: [{
                model: TaskStatus,
                as: 'status',
                where: { is_completed: true },
                attributes: [],
                include: [{
                    model: Project,
                    as: 'project',
                    where: { workspace_id: workspaceId },
                    attributes: []
                }]
            }]
        });

        // Get member count
        const memberCount = await WorkspaceMember.count({
            where: { workspace_id: workspaceId }
        });

        // Get recent activity
        const recentActivity = await ActivityLog.findAll({
            where: { workspace_id: workspaceId },
            include: [{
                model: User,
                as: 'actor',
                attributes: ['id', 'name', 'avatar_url']
            }],
            limit: 10,
            order: [['created_at', 'DESC']]
        });

        // Detailed Status Breakdown across workspace
        const statusCounts = await Task.findAll({
            attributes: [
                [sequelize.literal(`CASE 
                WHEN "status"."is_completed" = true THEN 'Done'
                        WHEN "status"."name" ILIKE '%progress%' THEN 'In Progress'
                        ELSE 'To Do'
                    END`), 'status_group'],
                [sequelize.fn('COUNT', sequelize.col('Task.id')), 'count']
            ],
            include: [{
                model: require('../../database/models').TaskStatus,
                as: 'status',
                attributes: [],
                include: [{
                    model: Project,
                    as: 'project',
                    where: { workspace_id: workspaceId },
                    attributes: []
                }]
            }],
            group: ['status_group'],
            raw: true
        });

        const statusBreakdown = {
            todo: parseInt(statusCounts.find(s => s.status_group === 'To Do')?.count || 0),
            inProgress: parseInt(statusCounts.find(s => s.status_group === 'In Progress')?.count || 0),
            done: parseInt(statusCounts.find(s => s.status_group === 'Done')?.count || 0)
        };

        return {
            projectCount,
            activeProjects,
            totalTasks,
            completedTasks,
            completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
            statusBreakdown,
            memberCount,
            recentActivity
        };
    }

    /**
     * Analyze workspace with AI
     */
    async analyzeWorkspace(workspaceId, userId) {
        const stats = await this.getWorkspaceAnalytics(workspaceId, userId);

        const projects = await Project.findAll({
            where: { workspace_id: workspaceId },
            include: [{
                model: Task,
                as: 'tasks',
                attributes: ['status', 'priority']
            }]
        });

        const prompt = `You are a project management AI. Analyze this workspace:
        Projects: ${stats.projectCount}
        Total Tasks: ${stats.totalTasks}
        Completed: ${stats.completedTasks}
        Completion Rate: ${stats.completionRate}%
        Active Projects: ${stats.activeProjects}
        
        Project Breakdown:
        ${projects.map(p => `- ${p.name}: ${p.tasks.length} tasks`).join('\n')}
        
        Provide:
        1. A high-level executive summary (2 sentences).
        2. Top 3 bottlenecks or risks.
        3. Strategic recommendation for the next 7 days.
        
        Format as clear, actionable points.`;

        const aiResponse = await require('../../shared/services/groq.service').generateContent(prompt, {
            temperature: 0.5
        });

        return {
            analysis: aiResponse.text,
            stats: stats,
            generated_at: new Date()
        };
    }

    /**
     * Get user performance metrics
     */
    async getUserPerformance(userId) {
        // 1. Get all workspace memberships for the user
        const workspaceMembers = await WorkspaceMember.findAll({
            where: { user_id: userId },
            attributes: ['id']
        });
        const workspaceMemberIds = workspaceMembers.map(wm => wm.id);

        if (workspaceMemberIds.length === 0) {
            return {
                tasksAssigned: 0,
                tasksCompleted: 0,
                completionRate: 0,
                onTimeDelivery: 0,
                averageCompletionTime: 0,
                tasksByPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
                recentTasks: []
            };
        }

        // 2. Get all project memberships
        const projectMembers = await ProjectMember.findAll({
            where: { workspace_member_id: workspaceMemberIds },
            attributes: ['id']
        });
        const projectMemberIds = projectMembers.map(pm => pm.id);

        if (projectMemberIds.length === 0) {
            return {
                tasksAssigned: 0,
                tasksCompleted: 0,
                completionRate: 0,
                onTimeDelivery: 0,
                averageCompletionTime: 0,
                tasksByPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
                recentTasks: []
            };
        }

        // 3. Get all task assignments
        const assignments = await TaskAssignee.findAll({
            where: { project_member_id: projectMemberIds },
            attributes: ['task_id']
        });
        const taskIds = [...new Set(assignments.map(a => a.task_id))];

        if (taskIds.length === 0) {
            return {
                tasksAssigned: 0,
                tasksCompleted: 0,
                completionRate: 0,
                onTimeDelivery: 0,
                averageCompletionTime: 0,
                tasksByPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
                recentTasks: []
            };
        }

        // 4. Get the tasks
        const userTasks = await Task.findAll({
            where: { id: taskIds }
        });

        const tasksAssigned = userTasks.length;
        const tasksCompleted = userTasks.filter(t => t.completed_at !== null).length;
        const completionRate = tasksAssigned > 0 ? Math.round((tasksCompleted / tasksAssigned) * 100) : 0;

        // Calculate on-time delivery
        const completedWithDueDate = userTasks.filter(t => t.completed_at && t.due_date);
        const onTimeCount = completedWithDueDate.filter(t =>
            new Date(t.completed_at) <= new Date(t.due_date)
        ).length;
        const onTimeDelivery = completedWithDueDate.length > 0
            ? Math.round((onTimeCount / completedWithDueDate.length) * 100)
            : 0;

        // Calculate average completion time (in days)
        const completedTasks = userTasks.filter(t => t.completed_at);
        let avgCompletionTime = 0;
        if (completedTasks.length > 0) {
            const totalDays = completedTasks.reduce((sum, task) => {
                const created = new Date(task.created_at);
                const completed = new Date(task.completed_at);
                const days = (completed - created) / (1000 * 60 * 60 * 24);
                return sum + days;
            }, 0);
            avgCompletionTime = Math.round((totalDays / completedTasks.length) * 10) / 10;
        }

        // Tasks by priority
        const tasksByPriority = {
            low: userTasks.filter(t => t.priority === 'low').length,
            medium: userTasks.filter(t => t.priority === 'medium').length,
            high: userTasks.filter(t => t.priority === 'high').length,
            urgent: userTasks.filter(t => t.priority === 'urgent').length
        };

        // Recent tasks (last 5)
        const recentTasks = userTasks
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5)
            .map(task => ({
                id: task.id,
                title: task.title,
                priority: task.priority,
                completed_at: task.completed_at,
                due_date: task.due_date,
                created_at: task.created_at
            }));

        // Pending Tasks (Assigned and not completed)
        const pendingTasks = await Task.findAll({
            where: {
                id: taskIds,
                completed_at: null
            },
            include: [{
                model: Project,
                as: 'project',
                attributes: ['id', 'name']
            }],
            limit: 10,
            order: [['created_at', 'DESC']]
        });

        return {
            tasksAssigned,
            tasksCompleted,
            completionRate,
            onTimeDelivery,
            averageCompletionTime: avgCompletionTime,
            tasksByPriority,
            recentTasks,
            pendingTasks
        };
    }

    /**
     * Helper: Get project task statistics
     */
    async getProjectTaskStats(projectId) {
        const tasks = await Task.findAll({
            where: { project_id: projectId },
            include: [{
                model: require('../../database/models').TaskStatus,
                as: 'status',
                attributes: ['name', 'is_completed']
            }]
        });

        const total = tasks.length;
        const completed = tasks.filter(t => t.status?.is_completed).length;

        // Group by status
        const byStatus = {};
        tasks.forEach(task => {
            const statusName = task.status?.name || 'No Status';
            byStatus[statusName] = (byStatus[statusName] || 0) + 1;
        });

        // Group by priority
        const byPriority = {
            low: tasks.filter(t => t.priority === 'low').length,
            medium: tasks.filter(t => t.priority === 'medium').length,
            high: tasks.filter(t => t.priority === 'high').length,
            urgent: tasks.filter(t => t.priority === 'urgent').length
        };

        // Count overdue tasks
        const now = new Date();
        const overdue = tasks.filter(t =>
            !t.completed_at && t.due_date && new Date(t.due_date) < now
        ).length;

        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
            total,
            completed,
            byStatus,
            byPriority,
            overdue,
            completionRate
        };
    }

    /**
     * Helper: Get assignee workload
     */
    async getAssigneeWorkload(projectId) {
        try {
            // Get all tasks for this project
            const tasks = await Task.findAll({
                where: { project_id: projectId },
                attributes: ['id', 'completed_at']
            });

            if (tasks.length === 0) {
                return [];
            }

            const taskIds = tasks.map(t => t.id);

            // Get all assignees for these tasks
            const assignees = await TaskAssignee.findAll({
                where: {
                    task_id: taskIds
                },
                attributes: ['task_id', 'project_member_id']
            });

            // Get project members with user details
            const memberIds = [...new Set(assignees.map(a => a.project_member_id))];
            const projectMembers = await ProjectMember.findAll({
                where: { id: memberIds },
                include: [{
                    model: WorkspaceMember,
                    as: 'workspaceMember',
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['id', 'name', 'avatar_url']
                    }]
                }]
            });

            // Build workload map
            const workloadMap = {};

            assignees.forEach(assignee => {
                const projectMember = projectMembers.find(pm => pm.id === assignee.project_member_id);
                const user = projectMember?.workspaceMember?.user;

                if (user) {
                    if (!workloadMap[user.id]) {
                        workloadMap[user.id] = {
                            member: {
                                id: user.id,
                                name: user.name,
                                avatar_url: user.avatar_url
                            },
                            taskCount: 0,
                            completedCount: 0
                        };
                    }

                    workloadMap[user.id].taskCount++;

                    const task = tasks.find(t => t.id === assignee.task_id);
                    if (task && task.completed_at) {
                        workloadMap[user.id].completedCount++;
                    }
                }
            });

            return Object.values(workloadMap);
        } catch (error) {
            console.error('Error in getAssigneeWorkload:', error);
            return [];
        }
    }

    /**
     * Helper: Get burndown data (last 30 days)
     */
    async getBurndownData(projectId) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get all tasks for the project
        const tasks = await Task.findAll({
            where: { project_id: projectId },
            attributes: ['id', 'created_at', 'completed_at']
        });

        // Generate daily data
        const burndown = [];
        for (let i = 30; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            // Count tasks completed on this day
            const completedOnDay = tasks.filter(t => {
                if (!t.completed_at) return false;
                const completedDate = new Date(t.completed_at);
                return completedDate >= date && completedDate < nextDate;
            }).length;

            // Count remaining tasks (created before or on this day, not completed)
            const remaining = tasks.filter(t => {
                const created = new Date(t.created_at);
                if (created > nextDate) return false;
                if (!t.completed_at) return true;
                const completed = new Date(t.completed_at);
                return completed >= nextDate;
            }).length;

            burndown.push({
                date: date.toISOString().split('T')[0],
                completed: completedOnDay,
                remaining
            });
        }

        return burndown;
    }

    /**
     * Helper: Get recent activity
     */
    async getRecentActivity(projectId, limit = 10) {
        const activities = await ActivityLog.findAll({
            where: { project_id: projectId },
            include: [{
                model: User,
                as: 'actor',
                attributes: ['id', 'name', 'avatar_url']
            }],
            limit,
            order: [['created_at', 'DESC']]
        });

        return activities.map(activity => ({
            action: activity.action,
            user: activity.actor,
            timestamp: activity.created_at,
            meta: activity.meta
        }));
    }
}

module.exports = new AnalyticsService();
