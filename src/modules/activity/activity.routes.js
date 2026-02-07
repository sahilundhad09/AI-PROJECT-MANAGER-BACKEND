const express = require('express');
const router = express.Router();
const activityController = require('./activity.controller');
const authenticate = require('../../shared/middleware/auth.middleware');
const { validate } = require('../../shared/middleware/validator.middleware');
const activityValidator = require('./activity.validator');

// Get workspace activity feed
router.get(
    '/workspaces/:workspaceId/activity',
    authenticate,
    validate(activityValidator.getWorkspaceActivitySchema),
    activityController.getWorkspaceActivity
);

// Get project activity feed
router.get(
    '/projects/:projectId/activity',
    authenticate,
    validate(activityValidator.getProjectActivitySchema),
    activityController.getProjectActivity
);

// Get task activity timeline
router.get(
    '/tasks/:taskId/activity',
    authenticate,
    validate(activityValidator.getTaskActivitySchema),
    activityController.getTaskActivity
);

module.exports = router;
