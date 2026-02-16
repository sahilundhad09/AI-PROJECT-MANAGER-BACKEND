const { Project, Task, ActivityLog, sequelize } = require('../../database/models');
const groqService = require('../../shared/services/groq.service');
const { Op } = require('sequelize');

class PredictiveAnalyticsService {
    async analyzeProjectPulse(projectId) {
        // 1. Get project metadata
        const project = await Project.findByPk(projectId);
        if (!project) throw new Error('Project not found');

        // 2. Get task statistics using status flags
        const totalTasks = await Task.count({ where: { project_id: projectId, archived_at: null } });
        const completedTasks = await Task.count({
            include: [{
                model: require('../../database/models').TaskStatus,
                as: 'status',
                where: { is_completed: true }
            }],
            where: {
                project_id: projectId,
                archived_at: null
            }
        });

        // 3. Get velocity (tasks completed in the last 7 days)
        // Relying on completed_at timestamp which is now synchronized with is_completed flag
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentCompletions = await Task.count({
            where: {
                project_id: projectId,
                completed_at: { [Op.gte]: sevenDaysAgo },
                archived_at: null
            }
        });

        const weeklyVelocity = recentCompletions;
        const remainingTasks = totalTasks - completedTasks;

        // 4. Deadline analysis
        const now = new Date();
        const deadline = project.end_date ? new Date(project.end_date) : null;
        const daysRemaining = deadline ? Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)) : null;

        const prompt = `You are a project management AI. Analyze the following project data and provide a "Project Pulse" report.
        
Project: ${project.name}
Total Tasks: ${totalTasks}
Completed Tasks: ${completedTasks}
Remaining Tasks: ${remainingTasks}
Weekly Velocity (Tasks completed this week): ${weeklyVelocity}
Project Deadline: ${deadline ? deadline.toDateString() : 'No deadline set'}
Days Remaining until Deadline: ${daysRemaining !== null ? daysRemaining : 'N/A'}

Analysis Requirements:
1. Estimate the likely completion date based on current velocity.
2. Assess the "Risk Level" (Low, Medium, High, Critical).
3. Identify potential timeline blockers (e.g. if velocity is too low for the remaining tasks).
4. Provide a 2-sentence "Executive Summary".

Return the result in JSON format:
{
  "project_status": "Healthy / At Risk / Critical",
  "estimated_completion": "Date or timeframe",
  "risk_level": "Level",
  "risk_reason": "Brief reason why",
  "velocity_status": "Brief comment on speed",
  "summary": "2-sentence executive summary"
}

Analysis:`;

        const aiResponse = await groqService.generateContent(prompt, {
            temperature: 0.3
        });

        const result = groqService.parseJSON(aiResponse.text);

        return {
            raw_stats: {
                totalTasks,
                completedTasks,
                remainingTasks,
                weeklyVelocity,
                daysRemaining
            },
            pulse: result
        };
    }
}

module.exports = new PredictiveAnalyticsService();
