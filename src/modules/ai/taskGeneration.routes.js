const express = require('express');
const router = express.Router();
const taskGenerationController = require('./taskGeneration.controller');
const authenticate = require('../../shared/middleware/auth.middleware');
const { validate } = require('../../shared/middleware/validator.middleware');
const taskGenerationValidator = require('./taskGeneration.validator');

// Generate tasks from description
router.post(
    '/projects/:projectId/ai/generate-tasks',
    authenticate,
    validate(taskGenerationValidator.generateTasksSchema),
    taskGenerationController.generateTasks
);

// Accept and create tasks from generation
router.post(
    '/projects/:projectId/ai/generations/:generationId/accept',
    authenticate,
    validate(taskGenerationValidator.acceptTasksSchema),
    taskGenerationController.acceptTasks
);

// Get task generation history
router.get(
    '/projects/:projectId/ai/generations',
    authenticate,
    validate(taskGenerationValidator.getGenerationsSchema),
    taskGenerationController.getGenerations
);

module.exports = router;
