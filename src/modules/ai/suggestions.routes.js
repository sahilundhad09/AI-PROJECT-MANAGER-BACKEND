const express = require('express');
const router = express.Router();
const suggestionsController = require('./suggestions.controller');
const authenticate = require('../../shared/middleware/auth.middleware');
const { validate } = require('../../shared/middleware/validator.middleware');
const suggestionsValidator = require('./suggestions.validator');

// Get smart suggestions for project
router.get(
    '/projects/:projectId/ai/suggestions',
    authenticate,
    validate(suggestionsValidator.getSuggestionsSchema),
    suggestionsController.getSuggestions
);

module.exports = router;
