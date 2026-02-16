const express = require('express');
const router = express.Router();

// Import AI sub-module routes
const chatRoutes = require('./chat.routes');
const taskGenerationRoutes = require('./taskGeneration.routes');
const summaryRoutes = require('./summary.routes');
const suggestionsRoutes = require('./suggestions.routes');
const assistantRoutes = require('./assistant.routes');
const autoAssignmentRoutes = require('./autoAssignment.routes');
const predictiveAnalyticsRoutes = require('./predictiveAnalytics.routes');

// Register routes
router.use(chatRoutes);
router.use(taskGenerationRoutes);
router.use(summaryRoutes);
router.use(suggestionsRoutes);
router.use(assistantRoutes);
router.use(autoAssignmentRoutes);
router.use(predictiveAnalyticsRoutes);

module.exports = router;
