const { Notification, User } = require('../../database/models');
const { Op } = require('sequelize');

class NotificationService {
    /**
     * Create a new notification
     */
    async createNotification(userId, type, title, message, meta = {}) {
        const notification = await Notification.create({
            user_id: userId,
            type,
            title,
            message,
            meta
        });

        return notification;
    }

    /**
     * Get user's notifications with pagination and filters
     */
    async getNotifications(userId, filters = {}) {
        const { page = 1, limit = 20, is_read } = filters;
        const offset = (page - 1) * limit;

        const whereClause = { user_id: userId };

        // Filter by read/unread status
        if (is_read !== undefined) {
            whereClause.is_read = is_read === 'true' || is_read === true;
        }

        const { count, rows } = await Notification.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: [['created_at', 'DESC']]
        });

        return {
            notifications: rows,
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        };
    }

    /**
     * Get count of unread notifications
     */
    async getUnreadCount(userId) {
        const count = await Notification.count({
            where: {
                user_id: userId,
                is_read: false
            }
        });

        return { unreadCount: count };
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId, userId) {
        const notification = await Notification.findOne({
            where: {
                id: notificationId,
                user_id: userId
            }
        });

        if (!notification) {
            const error = new Error('Notification not found');
            error.statusCode = 404;
            throw error;
        }

        await notification.update({ is_read: true });

        return notification;
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(userId) {
        const [updatedCount] = await Notification.update(
            { is_read: true },
            {
                where: {
                    user_id: userId,
                    is_read: false
                }
            }
        );

        return {
            message: 'All notifications marked as read',
            updatedCount
        };
    }

    /**
     * Delete a notification
     */
    async deleteNotification(notificationId, userId) {
        const notification = await Notification.findOne({
            where: {
                id: notificationId,
                user_id: userId
            }
        });

        if (!notification) {
            const error = new Error('Notification not found');
            error.statusCode = 404;
            throw error;
        }

        await notification.destroy();

        return { message: 'Notification deleted successfully' };
    }

    /**
     * Helper: Create task assignment notification
     */
    async notifyTaskAssignment(assigneeUserId, taskTitle, assignedByName, taskId) {
        return this.createNotification(
            assigneeUserId,
            'task_assigned',
            'New Task Assigned',
            `${assignedByName} assigned you to "${taskTitle}"`,
            { taskId, assignedBy: assignedByName }
        );
    }

    /**
     * Helper: Create comment notification
     */
    async notifyComment(userId, commenterName, taskTitle, taskId) {
        return this.createNotification(
            userId,
            'comment_mention',
            'New Comment',
            `${commenterName} commented on "${taskTitle}"`,
            { taskId, commenter: commenterName }
        );
    }

    /**
     * Helper: Create workspace invitation notification
     */
    async notifyWorkspaceInvite(userId, workspaceName, inviterName) {
        return this.createNotification(
            userId,
            'workspace_invite',
            'Workspace Invitation',
            `${inviterName} invited you to join "${workspaceName}"`,
            { workspace: workspaceName, inviter: inviterName }
        );
    }

    /**
     * Helper: Create project update notification
     */
    async notifyProjectUpdate(userId, projectName, action, actorName) {
        return this.createNotification(
            userId,
            'project_update',
            'Project Update',
            `${actorName} ${action} in "${projectName}"`,
            { project: projectName, action, actor: actorName }
        );
    }

    /**
     * Helper: Create task due notification
     */
    async notifyTaskDue(userId, taskTitle, dueDate, taskId) {
        return this.createNotification(
            userId,
            'task_due',
            'Task Due Soon',
            `"${taskTitle}" is due on ${new Date(dueDate).toLocaleDateString()}`,
            { taskId, dueDate }
        );
    }
}

module.exports = new NotificationService();
