const { Attachment, Task, User, ProjectMember, WorkspaceMember, Project } = require('../../database/models');
const path = require('path');
const fs = require('fs').promises;

class AttachmentService {
    /**
     * Upload attachment to task
     */
    async uploadAttachment(taskId, userId, file) {
        if (!file) {
            throw new Error('No file provided');
        }

        // Verify task exists and user has access
        const task = await Task.findByPk(taskId, {
            include: [{
                model: Project,
                as: 'project',
                attributes: ['id', 'workspace_id']
            }]
        });
        if (!task) {
            throw new Error('Task not found');
        }

        // Verify user is a member of the project
        const workspaceMember = await WorkspaceMember.findOne({
            where: {
                user_id: userId,
                workspace_id: task.project.workspace_id
            }
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

        // Create attachment record
        const attachment = await Attachment.create({
            task_id: taskId,
            uploaded_by: userId,
            file_url: file.path,
            file_name: file.originalname,
            file_size: file.size,
            mime_type: file.mimetype
        });

        // Return attachment with uploader info
        return await this.getAttachmentById(attachment.id);
    }

    /**
     * Get all attachments for a task
     */
    async getTaskAttachments(taskId, userId) {
        // Verify task exists and user has access
        const task = await Task.findByPk(taskId, {
            include: [{
                model: Project,
                as: 'project',
                attributes: ['id', 'workspace_id']
            }]
        });
        if (!task) {
            throw new Error('Task not found');
        }

        const workspaceMember = await WorkspaceMember.findOne({
            where: {
                user_id: userId,
                workspace_id: task.project.workspace_id
            }
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

        // Get all attachments for the task
        const attachments = await Attachment.findAll({
            where: { task_id: taskId },
            attributes: ['id', 'task_id', 'uploaded_by', 'file_url', 'file_name', 'file_size', 'mime_type', 'created_at'],
            include: [
                {
                    model: User,
                    as: 'uploader',
                    attributes: ['id', 'name', 'email', 'avatar_url']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        return attachments;
    }

    /**
     * Get attachment by ID (for download)
     */
    async getAttachmentForDownload(attachmentId, userId) {
        const attachment = await Attachment.findByPk(attachmentId);
        if (!attachment) {
            throw new Error('Attachment not found');
        }

        // Verify user has access to the task
        const task = await Task.findByPk(attachment.task_id);
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
            throw new Error('You do not have access to this attachment');
        }

        return attachment;
    }

    /**
     * Delete attachment
     */
    async deleteAttachment(attachmentId, userId) {
        const attachment = await Attachment.findByPk(attachmentId);
        if (!attachment) {
            throw new Error('Attachment not found');
        }

        // Only uploader can delete
        if (attachment.uploaded_by !== userId) {
            throw new Error('You can only delete your own attachments');
        }

        // Delete file from filesystem
        try {
            await fs.unlink(attachment.file_url);
        } catch (error) {
            console.error('Error deleting file:', error);
            // Continue even if file deletion fails
        }

        // Delete database record
        await attachment.destroy();
    }

    /**
     * Helper: Get attachment by ID with uploader info
     */
    async getAttachmentById(attachmentId) {
        const attachment = await Attachment.findByPk(attachmentId, {
            attributes: ['id', 'task_id', 'uploaded_by', 'file_url', 'file_name', 'file_size', 'mime_type', 'created_at'],
            include: [
                {
                    model: User,
                    as: 'uploader',
                    attributes: ['id', 'name', 'email', 'avatar_url']
                }
            ]
        });

        return attachment;
    }
}

module.exports = new AttachmentService();
