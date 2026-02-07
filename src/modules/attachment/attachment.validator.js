const { z } = require('zod');

// Helper schemas
const uuidSchema = z.string().uuid('Invalid UUID format');

// Upload attachment schema (file handled by multer)
const uploadAttachmentSchema = z.object({
    params: z.object({
        taskId: uuidSchema
    })
});

// Get task attachments schema
const getTaskAttachmentsSchema = z.object({
    params: z.object({
        taskId: uuidSchema
    })
});

// Delete attachment schema
const deleteAttachmentSchema = z.object({
    params: z.object({
        attachmentId: uuidSchema
    })
});

// Download attachment schema
const downloadAttachmentSchema = z.object({
    params: z.object({
        attachmentId: uuidSchema
    })
});

module.exports = {
    uploadAttachmentSchema,
    getTaskAttachmentsSchema,
    deleteAttachmentSchema,
    downloadAttachmentSchema
};
