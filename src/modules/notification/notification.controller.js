const notificationService = require('./notification.service');

class NotificationController {
    /**
     * Get user's notifications
     * GET /api/v1/notifications
     */
    async getNotifications(req, res, next) {
        try {
            const result = await notificationService.getNotifications(
                req.user.id,
                req.query
            );

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get unread notification count
     * GET /api/v1/notifications/unread-count
     */
    async getUnreadCount(req, res, next) {
        try {
            const result = await notificationService.getUnreadCount(req.user.id);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Mark notification as read
     * PATCH /api/v1/notifications/:id/read
     */
    async markAsRead(req, res, next) {
        try {
            const notification = await notificationService.markAsRead(
                req.params.id,
                req.user.id
            );

            res.json({
                success: true,
                message: 'Notification marked as read',
                data: notification
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Mark all notifications as read
     * PATCH /api/v1/notifications/read-all
     */
    async markAllAsRead(req, res, next) {
        try {
            const result = await notificationService.markAllAsRead(req.user.id);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete notification
     * DELETE /api/v1/notifications/:id
     */
    async deleteNotification(req, res, next) {
        try {
            const result = await notificationService.deleteNotification(
                req.params.id,
                req.user.id
            );

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new NotificationController();
