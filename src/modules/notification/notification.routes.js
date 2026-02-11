const express = require('express');
const router = express.Router();
const notificationController = require('./notification.controller');
const notificationValidator = require('./notification.validator');
const authenticate = require('../../shared/middleware/auth.middleware');
const { validate } = require('../../shared/middleware/validator.middleware');

// All notification routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/notifications
 * @desc    Get user's notifications (paginated, filterable)
 * @access  Private
 */
router.get(
    '/',
    validate(notificationValidator.getNotificationsSchema),
    notificationController.getNotifications
);

/**
 * @route   GET /api/v1/notifications/unread-count
 * @desc    Get count of unread notifications
 * @access  Private
 */
router.get(
    '/unread-count',
    notificationController.getUnreadCount
);

// Legacy alias for unread count
router.get(
    '/unread/count',
    notificationController.getUnreadCount
);

/**
 * @route   PATCH /api/v1/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.patch(
    '/:id/read',
    validate(notificationValidator.notificationIdSchema),
    notificationController.markAsRead
);

/**
 * @route   PATCH /api/v1/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.patch(
    '/read-all',
    notificationController.markAllAsRead
);

/**
 * @route   DELETE /api/v1/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete(
    '/:id',
    validate(notificationValidator.notificationIdSchema),
    notificationController.deleteNotification
);

module.exports = router;
