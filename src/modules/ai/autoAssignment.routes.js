const express = require('express');
const router = express.Router();
const autoAssignmentController = require('./autoAssignment.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');
const { validateBody } = require('../../shared/middleware/validator.middleware');
const { z } = require('zod');

const suggestAssignmentSchema = z.object({
    taskId: z.string().uuid().optional().nullable(),
    title: z.string().optional(),
    description: z.string().optional()
});

router.use(authMiddleware);

router.post(
    '/projects/:projectId/ai/suggest-assignment',
    validateBody(suggestAssignmentSchema),
    autoAssignmentController.suggestAssignment
);

module.exports = router;
