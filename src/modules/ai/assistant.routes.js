const express = require('express');
const router = express.Router();
const assistantController = require('./assistant.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');
const { validateBody } = require('../../shared/middleware/validator.middleware');
const { detailTaskSchema, summarizeCommentsSchema } = require('./assistant.validator');

// All routes are protected
router.use(authMiddleware);

// Detail a task
router.post(
    '/projects/:projectId/ai/detail-task',
    validateBody(detailTaskSchema),
    assistantController.detailTask
);

// Summarize comments
router.post(
    '/projects/:projectId/ai/summarize-comments',
    validateBody(summarizeCommentsSchema),
    assistantController.summarizeComments
);

module.exports = router;
