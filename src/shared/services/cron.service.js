const cron = require('node-cron');
const { Task, TaskAssignee, ProjectMember, WorkspaceMember, User, Project, TaskStatus } = require('../../database/models');
const { Op } = require('sequelize');
const emailService = require('../../shared/services/email.service');
const notificationService = require('../../modules/notification/notification.service');

/**
 * Initialize all scheduled cron jobs
 */
function initializeCronJobs() {
    // ─── Daily Deadline Reminders (runs every day at 8:00 AM) ───────────────────
    cron.schedule('0 8 * * *', async () => {
        console.log('⏰ Running daily deadline reminder job...');
        try {
            await sendDeadlineReminders();
        } catch (error) {
            console.error('❌ Deadline reminder job failed:', error.message);
        }
    });

    // ─── Overdue Task Alerts (runs every day at 9:00 AM) ────────────────────────
    cron.schedule('0 9 * * *', async () => {
        console.log('🚨 Running overdue task alert job...');
        try {
            await sendOverdueAlerts();
        } catch (error) {
            console.error('❌ Overdue alert job failed:', error.message);
        }
    });

    console.log('✅ Cron jobs initialized');
}

/**
 * Send reminders for tasks due within the next 24 hours
 */
async function sendDeadlineReminders() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find tasks due in the next 24 hours that aren't completed
    const dueSoonTasks = await Task.findAll({
        where: {
            due_date: {
                [Op.gte]: now,
                [Op.lte]: tomorrow
            },
            completed_at: null,
            archived_at: null
        },
        include: [
            {
                model: TaskAssignee,
                as: 'assignees',
                include: [{
                    model: ProjectMember,
                    as: 'projectMember',
                    include: [{
                        model: WorkspaceMember,
                        as: 'workspaceMember',
                        include: [{
                            model: User,
                            as: 'user',
                            attributes: ['id', 'name', 'email']
                        }]
                    }]
                }]
            },
            {
                model: Project,
                as: 'project',
                attributes: ['id', 'name']
            }
        ]
    });

    let emailsSent = 0;
    for (const task of dueSoonTasks) {
        for (const assignee of task.assignees || []) {
            const user = assignee.projectMember?.workspaceMember?.user;
            if (!user?.email) continue;

            // Send email reminder
            emailService.sendTaskDueReminder(
                user.email,
                task.title,
                task.due_date,
                task.id
            ).catch(err => console.error(`Failed to send reminder to ${user.email}:`, err.message));

            // Create in-app notification
            notificationService.notifyTaskDue(
                user.id,
                task.title,
                task.due_date,
                task.id
            ).catch(err => console.error(`Failed to create due notification for ${user.id}:`, err.message));

            emailsSent++;
        }
    }

    console.log(`⏰ Deadline reminders sent: ${emailsSent} emails for ${dueSoonTasks.length} tasks`);
}

/**
 * Send alerts for tasks that are past their due date
 */
async function sendOverdueAlerts() {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    // Find tasks that became overdue in the last 24 hours (to avoid repeated alerts)
    const overdueTasks = await Task.findAll({
        where: {
            due_date: {
                [Op.lt]: now,
                [Op.gte]: yesterday
            },
            completed_at: null,
            archived_at: null
        },
        include: [
            {
                model: TaskAssignee,
                as: 'assignees',
                include: [{
                    model: ProjectMember,
                    as: 'projectMember',
                    include: [{
                        model: WorkspaceMember,
                        as: 'workspaceMember',
                        include: [{
                            model: User,
                            as: 'user',
                            attributes: ['id', 'name', 'email']
                        }]
                    }]
                }]
            },
            {
                model: Project,
                as: 'project',
                attributes: ['id', 'name']
            },
            {
                model: User,
                as: 'creator',
                attributes: ['id', 'name', 'email']
            }
        ]
    });

    let alertsSent = 0;
    for (const task of overdueTasks) {
        // Notify all assignees
        for (const assignee of task.assignees || []) {
            const user = assignee.projectMember?.workspaceMember?.user;
            if (!user?.email) continue;

            emailService.sendEmail(
                user.email,
                `🚨 Overdue Task: ${task.title}`,
                `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h2>🚨 Task Overdue!</h2>
                    </div>
                    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                        <div style="background: #fef2f2; padding: 20px; border-left: 4px solid #dc2626; margin: 20px 0;">
                            <h3 style="color: #dc2626;">${task.title}</h3>
                            <p><strong>Project:</strong> ${task.project?.name || 'Unknown'}</p>
                            <p><strong>Due Date:</strong> ${new Date(task.due_date).toLocaleDateString()}</p>
                        </div>
                        <p>This task has passed its deadline and requires immediate attention.</p>
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${task.project_id}" 
                           style="display: inline-block; padding: 12px 30px; background: #dc2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                            View Task
                        </a>
                    </div>
                </div>
                `
            ).catch(err => console.error(`Failed to send overdue alert to ${user.email}:`, err.message));

            alertsSent++;
        }

        // Also notify the task creator
        if (task.creator?.email) {
            const creatorIsAssignee = task.assignees?.some(
                a => a.projectMember?.workspaceMember?.user?.id === task.creator.id
            );
            if (!creatorIsAssignee) {
                emailService.sendEmail(
                    task.creator.email,
                    `🚨 Overdue: "${task.title}" needs attention`,
                    `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h2>⚠️ Task Overdue Alert</h2>
                        </div>
                        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                            <p>A task you created is now overdue:</p>
                            <div style="background: white; padding: 15px; border-left: 4px solid #f59e0b; margin: 15px 0;">
                                <h3>${task.title}</h3>
                                <p>Project: ${task.project?.name || 'Unknown'}</p>
                                <p>Due: ${new Date(task.due_date).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                    `
                ).catch(err => console.error(`Failed to send overdue alert to creator:`, err.message));
            }
        }
    }

    console.log(`🚨 Overdue alerts sent: ${alertsSent} for ${overdueTasks.length} tasks`);
}

module.exports = { initializeCronJobs };
