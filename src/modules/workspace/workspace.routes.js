const express = require('express');
const router = express.Router();
const workspaceController = require('./workspace.controller');
const authenticate = require('../../shared/middleware/auth.middleware');
const { requireWorkspaceRole, requireWorkspaceMembership } = require('../../shared/middleware/rbac.middleware');
const { validate } = require('../../shared/middleware/validator.middleware');
const {
    createWorkspaceSchema,
    updateWorkspaceSchema,
    inviteMemberSchema,
    updateMemberRoleSchema,
    paginationSchema,
    getMembersSchema,
    getInvitationsSchema
} = require('./workspace.validator');

// All routes require authentication
router.use(authenticate);

// Workspace CRUD
router.post(
    '/',
    validate(createWorkspaceSchema),
    workspaceController.createWorkspace
);

router.get(
    '/',
    validate(paginationSchema),
    workspaceController.getUserWorkspaces
);

router.get(
    '/:workspaceId',
    requireWorkspaceMembership,
    workspaceController.getWorkspaceById
);

router.put(
    '/:workspaceId',
    requireWorkspaceRole(['owner', 'admin']),
    validate(updateWorkspaceSchema),
    workspaceController.updateWorkspace
);

router.delete(
    '/:workspaceId',
    requireWorkspaceRole(['owner']),
    workspaceController.deleteWorkspace
);

// Member Management
router.get(
    '/:workspaceId/members',
    requireWorkspaceMembership,
    validate(getMembersSchema),
    workspaceController.getMembers
);

router.put(
    '/:workspaceId/members/:memberId',
    requireWorkspaceRole(['owner', 'admin']),
    validate(updateMemberRoleSchema),
    workspaceController.updateMemberRole
);

router.delete(
    '/:workspaceId/members/:memberId',
    requireWorkspaceRole(['owner', 'admin']),
    workspaceController.removeMember
);

router.post(
    '/:workspaceId/leave',
    requireWorkspaceMembership,
    workspaceController.leaveWorkspace
);

// Invitation Management
router.post(
    '/:workspaceId/invitations',
    requireWorkspaceRole(['owner', 'admin']),
    validate(inviteMemberSchema),
    workspaceController.inviteMember
);

router.get(
    '/:workspaceId/invitations',
    requireWorkspaceRole(['owner', 'admin']),
    validate(getInvitationsSchema),
    workspaceController.getInvitations
);

router.post(
    '/invitations/:token/accept',
    workspaceController.acceptInvitation
);

router.post(
    '/invitations/:token/decline',
    workspaceController.declineInvitation
);

router.delete(
    '/:workspaceId/invitations/:invitationId',
    requireWorkspaceRole(['owner', 'admin']),
    workspaceController.cancelInvitation
);

module.exports = router;
