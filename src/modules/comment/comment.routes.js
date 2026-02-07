const express = require('express');
const router = express.Router();
const commentController = require('./comment.controller');
const authenticate = require('../../shared/middleware/auth.middleware');
const { validate } = require('../../shared/middleware/validator.middleware');
const commentValidator = require('./comment.validator');

// Create comment on task
router.post(
    '/tasks/:taskId/comments',
    authenticate,
    validate(commentValidator.createCommentSchema),
    commentController.createComment
);

// Get all comments for a task
router.get(
    '/tasks/:taskId/comments',
    authenticate,
    validate(commentValidator.getTaskCommentsSchema),
    commentController.getTaskComments
);

// Update comment
router.put(
    '/comments/:commentId',
    authenticate,
    validate(commentValidator.updateCommentSchema),
    commentController.updateComment
);

// Delete comment
router.delete(
    '/comments/:commentId',
    authenticate,
    validate(commentValidator.deleteCommentSchema),
    commentController.deleteComment
);

module.exports = router;
