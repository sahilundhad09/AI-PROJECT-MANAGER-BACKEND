const { AITaskGeneration, Project, Task, WorkspaceMember, ProjectMember, TaskStatus } = require('../../database/models');
const groqService = require('../../shared/services/groq.service');

class TaskGenerationService {
    /**
     * Generate tasks from project description
     */
    async generateTasks(projectId, userId, prompt, count = 8) {
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

        const projectMember = await ProjectMember.findOne({
            where: {
                project_id: projectId,
                workspace_member_id: workspaceMember.id
            }
        });

        if (!projectMember) {
            throw new Error('You are not a member of this project');
        }

        // Build AI prompt
        const aiPrompt = `You are a project management AI assistant. Generate ${count} actionable tasks for the following project.

Project Name: ${project.name}
Project Description: ${project.description || 'No description provided'}
User Request: ${prompt}

Generate ${count} specific, actionable tasks. For each task, provide:
- title: Clear, action-oriented task title (max 100 characters)
- description: Detailed description of what needs to be done (2-3 sentences)
- priority: One of: low, medium, high, urgent
- estimated_hours: Realistic time estimate in hours (1-40)

Return ONLY a JSON array with no additional text. Example format:
[
  {
    "title": "Setup project repository",
    "description": "Initialize Git repository, create README, and setup basic project structure with necessary folders.",
    "priority": "high",
    "estimated_hours": 2
  }
]`;

        // Generate tasks using Gemini
        const aiResponse = await groqService.generateContent(aiPrompt, {
            temperature: 0.5 // Lower temperature for more focused output
        });

        // Parse JSON response
        const generatedTasks = groqService.parseJSON(aiResponse.text);

        // Validate generated tasks structure
        if (!Array.isArray(generatedTasks) || generatedTasks.length === 0) {
            throw new Error('AI failed to generate valid tasks. Please try again.');
        }

        // Save generation to database
        const generation = await AITaskGeneration.create({
            project_id: projectId,
            created_by: userId,
            prompt: prompt,
            generated_tasks: generatedTasks,
            tokens_used: aiResponse.tokensUsed
        });

        return {
            generation_id: generation.id,
            tasks: generatedTasks,
            tokens_used: aiResponse.tokensUsed
        };
    }

    /**
     * Accept and create tasks from generation
     */
    async acceptTasks(projectId, userId, generationId, taskIndices) {
        // Verify generation exists
        const generation = await AITaskGeneration.findOne({
            where: { id: generationId, project_id: projectId }
        });

        if (!generation) {
            throw new Error('Task generation not found');
        }

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

        const projectMember = await ProjectMember.findOne({
            where: {
                project_id: projectId,
                workspace_member_id: workspaceMember.id
            }
        });

        if (!projectMember) {
            throw new Error('You are not a member of this project');
        }

        // Get generated tasks
        const generatedTasks = generation.generated_tasks;

        // Validate indices
        const invalidIndices = taskIndices.filter(idx => idx >= generatedTasks.length);
        if (invalidIndices.length > 0) {
            throw new Error(`Invalid task indices: ${invalidIndices.join(', ')}`);
        }

        // Get default status for project
        const defaultStatus = await TaskStatus.findOne({
            where: { project_id: projectId, is_default: true }
        });

        let statusId;
        if (defaultStatus) {
            statusId = defaultStatus.id;
        } else {
            // Fallback to first status
            const firstStatus = await TaskStatus.findOne({
                where: { project_id: projectId },
                order: [['position', 'ASC']]
            });
            if (firstStatus) {
                statusId = firstStatus.id;
            } else {
                throw new Error('Project has no task statuses defined');
            }
        }

        // Create tasks
        const createdTasks = [];
        for (const index of taskIndices) {
            const taskData = generatedTasks[index];

            const task = await Task.create({
                project_id: projectId,
                title: taskData.title,
                description: taskData.description,
                status_id: statusId,
                priority: taskData.priority,
                estimated_hours: taskData.estimated_hours,
                created_by: userId
            });

            createdTasks.push(task);
        }

        // Update generation with accepted task IDs
        await generation.update({
            accepted_task_ids: createdTasks.map(t => t.id)
        });

        return {
            created_tasks: createdTasks,
            count: createdTasks.length
        };
    }

    /**
     * Get task generation history
     */
    async getGenerations(projectId, userId, filters = {}) {
        const { page = 1, limit = 10 } = filters;
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

        const { count, rows: generations } = await AITaskGeneration.findAndCountAll({
            where: { project_id: projectId },
            order: [['created_at', 'DESC']],
            limit,
            limit,
            offset
        });

        return {
            generations,
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        };
    }
}

module.exports = new TaskGenerationService();
