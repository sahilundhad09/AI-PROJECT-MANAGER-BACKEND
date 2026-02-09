const { Project, Task, WorkspaceMember, ProjectMember, User } = require('../../database/models');
const groqService = require('../../shared/services/groq.service');

class SuggestionsService {
    /**
     * Get smart suggestions for project
     */
    async getSuggestions(projectId, userId, suggestionType = 'all') {
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

        // Gather project data
        const tasks = await Task.findAll({
            where: { project_id: projectId },
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'name']
                }
            ],
            order: [['created_at', 'DESC']],
            limit: 50
        });

        const members = await ProjectMember.findAll({
            where: { project_id: projectId },
            include: [
                {
                    model: WorkspaceMember,
                    as: 'workspaceMember',
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['id', 'name', 'email']
                        }
                    ]
                }
            ]
        });

        // Build context for AI
        const now = new Date();
        const taskSummary = tasks.map(t => ({
            title: t.title,
            status: t.status,
            priority: t.priority,
            due_date: t.due_date,
            estimated_hours: t.estimated_hours,
            is_overdue: t.due_date && new Date(t.due_date) < now && t.status !== 'Done'
        }));

        const teamMembers = members.map(m => ({
            name: m.workspaceMember?.user?.name || 'Unknown',
            role: m.role
        }));

        // Build AI prompt based on suggestion type
        let prompt = `You are a project management AI assistant. Analyze the following project and provide smart suggestions.

Project: ${project.name}
Description: ${project.description || 'No description'}
Team Size: ${teamMembers.length}
Total Tasks: ${tasks.length}

Tasks Overview:
${taskSummary.slice(0, 20).map(t => `- [${t.status}] ${t.title} (${t.priority}${t.is_overdue ? ' - OVERDUE' : ''})`).join('\n')}

Team Members:
${teamMembers.map(m => `- ${m.name} (${m.role})`).join('\n')}

`;

        if (suggestionType === 'priority' || suggestionType === 'all') {
            prompt += `\n### Priority Suggestions
Analyze tasks and suggest which tasks should be reprioritized based on:
- Due dates and deadlines
- Current status and blockers
- Dependencies and critical path
Provide 3-5 specific priority recommendations.

`;
        }

        if (suggestionType === 'assignment' || suggestionType === 'all') {
            prompt += `\n### Assignment Suggestions
Suggest optimal task assignments based on:
- Team member roles and expertise
- Current workload distribution
- Task complexity and requirements
Provide 3-5 specific assignment recommendations.

`;
        }

        if (suggestionType === 'blockers' || suggestionType === 'all') {
            prompt += `\n### Blocker Detection
Identify potential blockers and risks:
- Tasks that might be blocked or at risk
- Resource constraints
- Timeline concerns
- Dependencies that could cause delays
Provide 3-5 specific blocker warnings.

`;
        }

        prompt += `\nReturn your response as a JSON object with this structure:
{
  "priority_suggestions": [{"task": "task title", "current_priority": "low", "suggested_priority": "high", "reason": "explanation"}],
  "assignment_suggestions": [{"task": "task title", "suggested_assignee": "team member name", "reason": "explanation"}],
  "blocker_warnings": [{"task": "task title or area", "risk_level": "low|medium|high", "description": "explanation", "mitigation": "suggested action"}],
  "general_recommendations": ["recommendation 1", "recommendation 2"]
}

Only include sections relevant to the requested suggestion type.`;

        // Generate suggestions using Gemini
        const aiResponse = await groqService.generateContent(prompt, {
            temperature: 0.4 // Lower temperature for more focused, analytical output
        });

        // Parse JSON response
        const suggestions = groqService.parseJSON(aiResponse.text);

        return {
            project_id: projectId,
            suggestion_type: suggestionType,
            suggestions,
            tokens_used: aiResponse.tokensUsed,
            generated_at: new Date().toISOString()
        };
    }
}

module.exports = new SuggestionsService();
