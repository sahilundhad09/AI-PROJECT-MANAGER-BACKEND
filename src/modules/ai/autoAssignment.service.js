const { User, Task, ProjectMember, WorkspaceMember, TaskAssignee, ActivityLog, sequelize } = require('../../database/models');
const groqService = require('../../shared/services/groq.service');
const { Op } = require('sequelize');

class AutoAssignmentService {
    /**
     * Suggest the best team member for a task
     */
    async suggestAssignment(projectId, userId, taskId = null, taskData = {}) {
        // 1. Get task context
        let taskTitle = taskData.title;
        let taskDescription = taskData.description;

        if (taskId) {
            const task = await Task.findByPk(taskId);
            if (task) {
                taskTitle = task.title;
                taskDescription = task.description;
            }
        }

        // 2. Get team members and their roles
        const projectMembers = await ProjectMember.findAll({
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

        // 3. Get current workload (active tasks) for each member
        const memIds = projectMembers.map(m => m.id);
        const workloads = await TaskAssignee.findAll({
            where: { project_member_id: { [Op.in]: memIds } },
            include: [{
                model: Task,
                as: 'task',
                where: {
                    archived_at: null
                },
                include: [{
                    model: require('../../database/models').TaskStatus,
                    as: 'status',
                    where: { is_completed: false }
                }]
            }]
        });

        const workloadMap = {};
        workloads.forEach(w => {
            workloadMap[w.project_member_id] = (workloadMap[w.project_member_id] || 0) + 1;
        });

        // 4. Get historical expertise (recent completions)
        const expertise = await TaskAssignee.findAll({
            where: { project_member_id: { [Op.in]: memIds } },
            include: [{
                model: Task,
                as: 'task',
                where: {
                    project_id: projectId,
                    archived_at: null
                },
                include: [{
                    model: require('../../database/models').TaskStatus,
                    as: 'status',
                    where: { is_completed: true }
                }],
                attributes: ['title']
            }],
            limit: 100
        });

        const expertiseMap = {};
        expertise.forEach(e => {
            if (!expertiseMap[e.project_member_id]) expertiseMap[e.project_member_id] = [];
            expertiseMap[e.project_member_id].push(e.task.title);
        });

        const teamContext = projectMembers.map(m => ({
            name: m.workspaceMember?.user?.name || 'Unknown',
            role: m.project_role,
            current_active_tasks: workloadMap[m.id] || 0,
            expertise: (expertiseMap[m.id] || []).slice(0, 5).join(', '),
            userId: m.workspaceMember?.user?.id
        }));

        const prompt = `You are a project manager. Suggest the one BEST team member to assign to this task based on their role, current workload, and past expertise.
        
Task: ${taskTitle}
Description: ${taskDescription || 'No description'}

Team Members:
${teamContext.map(m => `- ${m.name} (${m.role}) - Active tasks: ${m.current_active_tasks} - Past completed themes: ${m.expertise || 'None yet'}`).join('\n')}

Provide your recommendation in JSON format:
{
  "suggested_member_name": "Name",
  "reason": "Expertise-based explanation",
  "workload_analysis": "Brief comment on their capacity"
}

Recommendation:`;

        const aiResponse = await groqService.generateContent(prompt, {
            temperature: 0.3
        });

        const result = groqService.parseJSON(aiResponse.text);

        return {
            task_title: taskTitle,
            suggestion: result
        };
    }
}

module.exports = new AutoAssignmentService();
