const { AIProjectSummary, Project, Task, WorkspaceMember, ProjectMember, User } = require('../../database/models');
const groqService = require('../../shared/services/groq.service');
const { Op } = require('sequelize');

class SummaryService {
    /**
     * Generate project summary
     */
    async generateSummary(projectId, userId, summaryType, dateRangeStart = null, dateRangeEnd = null) {
        // Verify project access
        const project = await Project.findByPk(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        const workspaceMember = await WorkspaceMember.findOne({
            where: { user_id: userId, workspace_id: project.workspace_id }
        });

        if (!workspaceMember) {
            throw new Error('You do not have access to this project');
        }

        // Calculate date range based on summary type
        let startDate, endDate;
        const now = new Date();

        if (summaryType === 'daily') {
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
        } else if (summaryType === 'weekly') {
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
        } else {
            // Custom range
            startDate = new Date(dateRangeStart);
            endDate = new Date(dateRangeEnd);
        }

        // Gather project data
        const tasks = await Task.findAll({
            where: {
                project_id: projectId,
                created_at: {
                    [Op.between]: [startDate, endDate]
                }
            },
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'name']
                }
            ]
        });

        const allTasks = await Task.findAll({
            where: { project_id: projectId }
        });

        // Calculate statistics
        const stats = {
            total_tasks: allTasks.length,
            completed: allTasks.filter(t => t.status === 'Done').length,
            in_progress: allTasks.filter(t => t.status === 'In Progress').length,
            todo: allTasks.filter(t => t.status === 'To Do').length,
            blocked: allTasks.filter(t => t.status === 'Blocked').length,
            high_priority: allTasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length,
            overdue: allTasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'Done').length,
            tasks_created_in_period: tasks.length
        };

        // Build AI prompt
        const aiPrompt = `You are a project management AI assistant. Generate a comprehensive ${summaryType} summary for the following project.

Project: ${project.name}
Description: ${project.description || 'No description'}
Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}

Statistics:
- Total Tasks: ${stats.total_tasks}
- Completed: ${stats.completed}
- In Progress: ${stats.in_progress}
- To Do: ${stats.todo}
- Blocked: ${stats.blocked}
- High Priority: ${stats.high_priority}
- Overdue: ${stats.overdue}
- Tasks Created in Period: ${stats.tasks_created_in_period}

Recent Tasks:
${tasks.slice(0, 10).map(t => `- [${t.status}] ${t.title} (${t.priority})`).join('\n')}

Generate a professional summary covering:
1. Overall Progress (2-3 sentences)
2. Key Achievements (bullet points)
3. Current Challenges/Blockers (if any)
4. Upcoming Priorities (2-3 items)
5. Team Performance Insights
6. Recommendations (2-3 actionable items)

Keep it concise but informative (300-500 words).`;

        // Generate summary using Gemini
        const aiResponse = await groqService.generateContent(aiPrompt, {
            temperature: 0.6
        });

        // Save summary to database
        const summary = await AIProjectSummary.create({
            project_id: projectId,
            created_by: userId,
            summary_type: summaryType,
            content: aiResponse.text,
            date_range_start: startDate.toISOString().split('T')[0],
            date_range_end: endDate.toISOString().split('T')[0],
            tokens_used: aiResponse.tokensUsed,
            created_by: userId
        });

        return {
            summary_id: summary.id,
            summary_type: summaryType,
            content: aiResponse.text,
            date_range: {
                start: summary.date_range_start,
                end: summary.date_range_end
            },
            statistics: stats,
            tokens_used: aiResponse.tokensUsed
        };
    }

    /**
     * Get project summaries
     */
    async getSummaries(projectId, userId, filters = {}) {
        const { page = 1, limit = 10, summary_type } = filters;
        const offset = (page - 1) * limit;

        // Verify access
        const project = await Project.findByPk(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        const workspaceMember = await WorkspaceMember.findOne({
            where: { user_id: userId, workspace_id: project.workspace_id }
        });

        if (!workspaceMember) {
            throw new Error('You do not have access to this project');
        }

        const whereClause = { project_id: projectId };
        if (summary_type) {
            whereClause.summary_type = summary_type;
        }

        const { count, rows: summaries } = await AIProjectSummary.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email']
                }
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        return {
            summaries,
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        };
    }
}

module.exports = new SummaryService();
