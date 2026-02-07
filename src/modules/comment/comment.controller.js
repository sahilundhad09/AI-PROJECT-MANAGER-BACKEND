const commentService = require('./comment.service');

// Create comment
const createComment = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.id;
        const comment = await commentService.createComment(taskId, userId, req.body);
        res.status(201).json({
            success: true,
            message: 'Comment created successfully',
            data: comment
        });
    } catch (error) {
        next(error);
    }
};

// Get task comments
const getTaskComments = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.id;
        const comments = await commentService.getTaskComments(taskId, userId);
        res.json({
            success: true,
            data: comments
        });
    } catch (error) {
        next(error);
    }
};

// Update comment
const updateComment = async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;
        const comment = await commentService.updateComment(commentId, userId, req.body);
        res.json({
            success: true,
            message: 'Comment updated successfully',
            data: comment
        });
    } catch (error) {
        next(error);
    }
};

// Delete comment
const deleteComment = async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;
        await commentService.deleteComment(commentId, userId);
        res.json({
            success: true,
            message: 'Comment deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createComment,
    getTaskComments,
    updateComment,
    deleteComment
};
