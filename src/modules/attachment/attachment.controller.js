const attachmentService = require('./attachment.service');

// Upload attachment
const uploadAttachment = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.id;
        const file = req.file;

        const attachment = await attachmentService.uploadAttachment(taskId, userId, file);
        res.status(201).json({
            success: true,
            message: 'Attachment uploaded successfully',
            data: attachment
        });
    } catch (error) {
        next(error);
    }
};

// Get task attachments
const getTaskAttachments = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.id;
        const attachments = await attachmentService.getTaskAttachments(taskId, userId);
        res.json({
            success: true,
            data: attachments
        });
    } catch (error) {
        next(error);
    }
};

// Download attachment
const downloadAttachment = async (req, res, next) => {
    try {
        const { attachmentId } = req.params;
        const userId = req.user.id;
        const attachment = await attachmentService.getAttachmentForDownload(attachmentId, userId);

        // Send file
        res.download(attachment.file_url, attachment.file_name);
    } catch (error) {
        next(error);
    }
};

// Delete attachment
const deleteAttachment = async (req, res, next) => {
    try {
        const { attachmentId } = req.params;
        const userId = req.user.id;
        await attachmentService.deleteAttachment(attachmentId, userId);
        res.json({
            success: true,
            message: 'Attachment deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    uploadAttachment,
    getTaskAttachments,
    downloadAttachment,
    deleteAttachment
};
