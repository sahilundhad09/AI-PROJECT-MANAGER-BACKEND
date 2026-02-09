const express = require('express');
const router = express.Router();
const summaryController = require('./summary.controller');
const authenticate = require('../../shared/middleware/auth.middleware');
const { validate } = require('../../shared/middleware/validator.middleware');
const summaryValidator = require('./summary.validator');

// Generate project summary
router.post(
    '/projects/:projectId/ai/summary',
    authenticate,
    validate(summaryValidator.generateSummarySchema),
    summaryController.generateSummary
);

// Get project summaries
router.get(
    '/projects/:projectId/ai/summaries',
    authenticate,
    validate(summaryValidator.getSummariesSchema),
    summaryController.getSummaries
);

module.exports = router;
