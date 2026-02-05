const workspaceService = require('./workspace.service');

class WorkspaceController {
    /**
     * Create workspace
     */
    async createWorkspace(req, res, next) {
        try {
            const workspace = await workspaceService.createWorkspace(req.user.userId, req.body);

            res.status(201).json({
                success: true,
                message: 'Workspace created successfully',
                data: workspace
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get user's workspaces
     */
    async getUserWorkspaces(req, res, next) {
        try {
            const { page, limit } = req.query;
            const result = await workspaceService.getUserWorkspaces(req.user.userId, { page, limit });

            res.json({
                success: true,
                data: result.workspaces,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get workspace by ID
     */
    async getWorkspaceById(req, res, next) {
        try {
            const workspace = await workspaceService.getWorkspaceById(
                req.params.workspaceId,
                req.user.userId
            );

            res.json({
                success: true,
                data: workspace
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update workspace
     */
    async updateWorkspace(req, res, next) {
        try {
            const workspace = await workspaceService.updateWorkspace(
                req.params.workspaceId,
                req.user.userId,
                req.body
            );

            res.json({
                success: true,
                message: 'Workspace updated successfully',
                data: workspace
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete workspace
     */
    async deleteWorkspace(req, res, next) {
        try {
            const result = await workspaceService.deleteWorkspace(
                req.params.workspaceId,
                req.user.userId
            );

            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get workspace members
     */
    async getMembers(req, res, next) {
        try {
            const { role, page, limit } = req.query;
            const result = await workspaceService.getMembers(req.params.workspaceId, {
                role,
                page,
                limit
            });

            res.json({
                success: true,
                data: result.members,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update member role
     */
    async updateMemberRole(req, res, next) {
        try {
            const member = await workspaceService.updateMemberRole(
                req.params.workspaceId,
                req.params.memberId,
                req.body.role,
                req.user.userId
            );

            res.json({
                success: true,
                message: 'Member role updated successfully',
                data: member
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Remove member
     */
    async removeMember(req, res, next) {
        try {
            const result = await workspaceService.removeMember(
                req.params.workspaceId,
                req.params.memberId,
                req.user.userId
            );

            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Leave workspace
     */
    async leaveWorkspace(req, res, next) {
        try {
            const result = await workspaceService.leaveWorkspace(
                req.params.workspaceId,
                req.user.userId
            );

            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Invite member
     */
    async inviteMember(req, res, next) {
        try {
            const invitation = await workspaceService.inviteMember(
                req.params.workspaceId,
                req.body.email,
                req.body.role,
                req.user.userId
            );

            res.status(201).json({
                success: true,
                message: 'Invitation sent successfully',
                data: invitation
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get invitations
     */
    async getInvitations(req, res, next) {
        try {
            const { status, page, limit } = req.query;
            const result = await workspaceService.getInvitations(req.params.workspaceId, {
                status,
                page,
                limit
            });

            res.json({
                success: true,
                data: result.invitations,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Accept invitation
     */
    async acceptInvitation(req, res, next) {
        try {
            const workspace = await workspaceService.acceptInvitation(
                req.params.token,
                req.user.userId
            );

            res.json({
                success: true,
                message: 'Invitation accepted successfully',
                data: workspace
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Decline invitation
     */
    async declineInvitation(req, res, next) {
        try {
            const result = await workspaceService.declineInvitation(
                req.params.token,
                req.user.userId
            );

            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cancel invitation
     */
    async cancelInvitation(req, res, next) {
        try {
            const result = await workspaceService.cancelInvitation(
                req.params.workspaceId,
                req.params.invitationId,
                req.user.userId
            );

            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new WorkspaceController();
