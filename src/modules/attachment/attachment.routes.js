const express = require('express');
const router = express.Router();
const attachmentController = require('./attachment.controller');
const authenticate = require('../../shared/middleware/auth.middleware');
const { validate } = require('../../shared/middleware/validator.middleware');
const attachmentValidator = require('./attachment.validator');
const upload = require('../../shared/utils/fileUpload');

// Upload attachment to task
router.post(
    '/tasks/:taskId/attachments',
    authenticate,
    upload.single('file'),
    validate(attachmentValidator.uploadAttachmentSchema),
    attachmentController.uploadAttachment
);

// Get all attachments for a task
router.get(
    '/tasks/:taskId/attachments',
    authenticate,
    validate(attachmentValidator.getTaskAttachmentsSchema),
    attachmentController.getTaskAttachments
);

// Download attachment
router.get(
    '/attachments/:attachmentId/download',
    authenticate,
    validate(attachmentValidator.downloadAttachmentSchema),
    attachmentController.downloadAttachment
);

// Delete attachment
router.delete(
    '/attachments/:attachmentId',
    authenticate,
    validate(attachmentValidator.deleteAttachmentSchema),
    attachmentController.deleteAttachment
);

module.exports = router;
