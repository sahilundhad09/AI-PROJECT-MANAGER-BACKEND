const { Comment, Task, User, ProjectMember, WorkspaceMember, TaskAssignee } = require('../../database/models');
const emailService = require('../../shared/services/email.service');

class CommentService {
    /**
     * Create a new comment on a task
     */
    async createComment(taskId, userId, data) {
        // Verify task exists and user has access
        const task = await Task.findByPk(taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        // Verify user is a member of the project
        const workspaceMember = await WorkspaceMember.findOne({
            where: { user_id: userId }
        });

        if (!workspaceMember) {
            throw new Error('User not found in workspace');
        }

        const projectMember = await ProjectMember.findOne({
            where: {
                project_id: task.project_id,
                workspace_member_id: workspaceMember.id
            }
        });

        if (!projectMember) {
            throw new Error('You do not have access to this task');
        }

        // If parent_comment_id is provided, verify it exists and belongs to same task
        if (data.parent_comment_id) {
            const parentComment = await Comment.findByPk(data.parent_comment_id);
            if (!parentComment) {
                throw new Error('Parent comment not found');
            }
            if (parentComment.task_id !== taskId) {
                throw new Error('Parent comment does not belong to this task');
            }
        }

        // Create comment
        const comment = await Comment.create({
            task_id: taskId,
            user_id: userId,
            message: data.message,
            parent_comment_id: data.parent_comment_id || null
        });

        // Send email notifications to task assignees (non-blocking)
        const commenter = await User.findByPk(userId);
        const assignees = await TaskAssignee.findAll({
            where: { task_id: taskId },
            include: [{
                model: ProjectMember,
                as: 'projectMember',
                include: [{
                    model: WorkspaceMember,
                    as: 'workspaceMember',
                    include: [{
                        model: User,
                        as: 'user'
                    }]
                }]
            }]
        });

        // Send email to each assignee (except the commenter)
        for (const assignee of assignees) {
            const assigneeUser = assignee.projectMember?.workspaceMember?.user;
            if (assigneeUser && assigneeUser.id !== userId && assigneeUser.email) {
                emailService.sendCommentNotification(
                    assigneeUser.email,
                    commenter.name,
                    task.title,
                    data.message,
                    taskId
                ).catch(err => {
                    console.error('Failed to send comment notification:', err.message);
                });
            }
        }

        // Return comment with user info
        return await this.getCommentById(comment.id);
    }

    /**
     * Get all comments for a task (with threading)
     */
    async getTaskComments(taskId, userId) {
        // Verify task exists and user has access
        const task = await Task.findByPk(taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        const workspaceMember = await WorkspaceMember.findOne({
            where: { user_id: userId }
        });

        if (!workspaceMember) {
            throw new Error('User not found in workspace');
        }

        const projectMember = await ProjectMember.findOne({
            where: {
                project_id: task.project_id,
                workspace_member_id: workspaceMember.id
            }
        });

        if (!projectMember) {
            throw new Error('You do not have access to this task');
        }

        // Get all comments for the task
        const comments = await Comment.findAll({
            where: { task_id: taskId },
            attributes: ['id', 'task_id', 'user_id', 'message', 'parent_comment_id', 'created_at'],
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email', 'avatar_url']
                }
            ],
            order: [['created_at', 'ASC']]
        });

        // Organize into threaded structure
        const commentMap = {};
        const rootComments = [];

        // First pass: create map of all comments
        comments.forEach(comment => {
            const commentData = comment.toJSON();
            commentData.replies = [];
            commentMap[commentData.id] = commentData;
        });

        // Second pass: organize into tree structure
        comments.forEach(comment => {
            const commentData = commentMap[comment.id];
            if (comment.parent_comment_id && commentMap[comment.parent_comment_id]) {
                commentMap[comment.parent_comment_id].replies.push(commentData);
            } else {
                rootComments.push(commentData);
            }
        });

        return rootComments;
    }

    /**
     * Update a comment
     */
    async updateComment(commentId, userId, data) {
        const comment = await Comment.findByPk(commentId);
        if (!comment) {
            throw new Error('Comment not found');
        }

        // Only comment author can update
        if (comment.user_id !== userId) {
            throw new Error('You can only edit your own comments');
        }

        await comment.update({
            message: data.message
        });

        return await this.getCommentById(commentId);
    }

    /**
     * Delete a comment
     */
    async deleteComment(commentId, userId) {
        const comment = await Comment.findByPk(commentId);
        if (!comment) {
            throw new Error('Comment not found');
        }

        // Only comment author can delete
        if (comment.user_id !== userId) {
            throw new Error('You can only delete your own comments');
        }

        // Delete comment (cascade will delete replies)
        await comment.destroy();
    }

    /**
     * Helper: Get comment by ID with user info
     */
    async getCommentById(commentId) {
        const comment = await Comment.findByPk(commentId, {
            attributes: ['id', 'task_id', 'user_id', 'message', 'parent_comment_id', 'created_at'],
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email', 'avatar_url']
                }
            ]
        });

        return comment;
    }
}

module.exports = new CommentService();
