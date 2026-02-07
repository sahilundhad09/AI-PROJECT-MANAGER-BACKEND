const express = require('express');
const router = express.Router();

// Import sub-module routes
const commentRoutes = require('../comment/comment.routes');
const attachmentRoutes = require('../attachment/attachment.routes');
const activityRoutes = require('../activity/activity.routes');

// Register sub-module routes
router.use(commentRoutes);
router.use(attachmentRoutes);
router.use(activityRoutes);

module.exports = router;
