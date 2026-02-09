const express = require('express');
const router = express.Router();

// Import AI sub-module routes
const chatRoutes = require('./chat.routes');
const taskGenerationRoutes = require('./taskGeneration.routes');
const summaryRoutes = require('./summary.routes');
const suggestionsRoutes = require('./suggestions.routes');

// Register routes
router.use(chatRoutes);
router.use(taskGenerationRoutes);
router.use(summaryRoutes);
router.use(suggestionsRoutes);

module.exports = router;
