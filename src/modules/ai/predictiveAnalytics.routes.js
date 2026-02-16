const express = require('express');
const router = express.Router();
const predictiveAnalyticsController = require('./predictiveAnalytics.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');

router.use(authMiddleware);

router.get(
    '/projects/:projectId/ai/pulse',
    predictiveAnalyticsController.getProjectPulse
);

module.exports = router;
