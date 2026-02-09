const express = require('express');
const router = express.Router();
const chatController = require('./chat.controller');
const authenticate = require('../../shared/middleware/auth.middleware');
const { validate } = require('../../shared/middleware/validator.middleware');
const chatValidator = require('./chat.validator');

// Send chat message (non-streaming)
router.post(
    '/projects/:projectId/ai/chat',
    authenticate,
    validate(chatValidator.sendChatMessageSchema),
    chatController.sendMessage
);

// Send chat message with streaming (SSE)
router.post(
    '/projects/:projectId/ai/chat/stream',
    authenticate,
    validate(chatValidator.sendChatMessageSchema),
    chatController.sendMessageStream
);

// Get chat sessions for a project
router.get(
    '/projects/:projectId/ai/chat/sessions',
    authenticate,
    validate(chatValidator.getChatSessionsSchema),
    chatController.getChatSessions
);

// Get session history
router.get(
    '/ai/chat/sessions/:sessionId',
    authenticate,
    validate(chatValidator.getSessionHistorySchema),
    chatController.getSessionHistory
);

// Delete session
router.delete(
    '/ai/chat/sessions/:sessionId',
    authenticate,
    validate(chatValidator.deleteSessionSchema),
    chatController.deleteSession
);

module.exports = router;
