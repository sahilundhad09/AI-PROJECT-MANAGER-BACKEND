const crypto = require('crypto');
const { Workspace, WorkspaceMember, WorkspaceInvitation, User, Notification, sequelize } = require('../../database/models');
const { Op } = require('sequelize');
const emailService = require('../../shared/services/email.service');
const notificationService = require('../notification/notification.service');

class WorkspaceService {
    /**
     * Create a new workspace
     */
    async createWorkspace(userId, data) {
        const { name, description, logo_url } = data;

        // Create workspace
        const workspace = await Workspace.create({
            name,
            description,
            logo_url
        });

        // Add creator as owner
        await WorkspaceMember.create({
            workspace_id: workspace.id,
            user_id: userId,
            role: 'owner'
        });

        // Fetch workspace with member info
        return this.getWorkspaceById(workspace.id, userId);
    }

    /**
     * Get all workspaces for a user
     */
    async getUserWorkspaces(userId, pagination = {}) {
        const { page = 1, limit = 10 } = pagination;
        const offset = (page - 1) * limit;

        const { count, rows } = await Workspace.findAndCountAll({
            include: [
                {
                    model: WorkspaceMember,
                    as: 'members',
                    where: { user_id: userId },
                    attributes: ['role', 'joined_at'],
                    required: true
                }
            ],
            where: { deleted_at: null },
            limit,
            offset,
            order: [['created_at', 'DESC']],
            distinct: true
        });

        return {
            workspaces: rows.map(workspace => ({
                id: workspace.id,
                name: workspace.name,
                description: workspace.description,
                logo_url: workspace.logo_url,
                role: workspace.members[0].role,
                joined_at: workspace.members[0].joined_at,
                created_at: workspace.created_at
            })),
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        };
    }

    /**
     * Get workspace by ID
     */
    async getWorkspaceById(workspaceId, userId) {
        const workspace = await Workspace.findOne({
            where: {
                id: workspaceId,
                deleted_at: null
            },
            include: [
                {
                    model: WorkspaceMember,
                    as: 'members',
                    where: { user_id: userId },
                    attributes: ['role', 'joined_at'],
                    required: true
                }
            ]
        });

        if (!workspace) {
            const error = new Error('Workspace not found or access denied');
            error.statusCode = 404;
            throw error;
        }

        // Get member count
        const memberCount = await WorkspaceMember.count({
            where: { workspace_id: workspaceId }
        });

        return {
            id: workspace.id,
            name: workspace.name,
            description: workspace.description,
            logo_url: workspace.logo_url,
            settings: workspace.settings,
            member_count: memberCount,
            your_role: workspace.members[0].role,
            joined_at: workspace.members[0].joined_at,
            created_at: workspace.created_at,
            updated_at: workspace.updated_at
        };
    }

    /**
     * Update workspace
     */
    async updateWorkspace(workspaceId, userId, data) {
        const workspace = await Workspace.findOne({
            where: {
                id: workspaceId,
                deleted_at: null
            }
        });

        if (!workspace) {
            const error = new Error('Workspace not found');
            error.statusCode = 404;
            throw error;
        }

        // Check permission (handled by middleware, but double-check)
        const member = await WorkspaceMember.findOne({
            where: {
                workspace_id: workspaceId,
                user_id: userId,
                role: { [Op.in]: ['owner', 'admin'] }
            }
        });

        if (!member) {
            const error = new Error('Insufficient permissions');
            error.statusCode = 403;
            throw error;
        }

        // Update workspace
        await workspace.update(data);

        return this.getWorkspaceById(workspaceId, userId);
    }

    /**
     * Delete workspace (soft delete)
     */
    async deleteWorkspace(workspaceId, userId) {
        const workspace = await Workspace.findOne({
            where: {
                id: workspaceId,
                deleted_at: null
            }
        });

        if (!workspace) {
            const error = new Error('Workspace not found');
            error.statusCode = 404;
            throw error;
        }

        // Check if user is owner
        const member = await WorkspaceMember.findOne({
            where: {
                workspace_id: workspaceId,
                user_id: userId,
                role: 'owner'
            }
        });

        if (!member) {
            const error = new Error('Only workspace owner can delete the workspace');
            error.statusCode = 403;
            throw error;
        }

        // Soft delete
        await workspace.update({ deleted_at: new Date() });

        return { message: 'Workspace deleted successfully' };
    }

    /**
     * Get workspace members
     */
    async getMembers(workspaceId, filters = {}) {
        const { role, page = 1, limit = 20 } = filters;
        const offset = (page - 1) * limit;

        const whereClause = { workspace_id: workspaceId };
        if (role) {
            whereClause.role = role;
        }

        const { count, rows } = await WorkspaceMember.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email', 'avatar_url']
                }
            ],
            limit,
            offset,
            order: [['joined_at', 'ASC']]
        });

        return {
            members: rows.map(member => ({
                id: member.id,
                user: member.user,
                role: member.role,
                joined_at: member.joined_at
            })),
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        };
    }

    /**
     * Update member role
     */
    async updateMemberRole(workspaceId, memberId, role, userId) {
        const member = await WorkspaceMember.findOne({
            where: {
                id: memberId,
                workspace_id: workspaceId
            }
        });

        if (!member) {
            const error = new Error('Member not found');
            error.statusCode = 404;
            throw error;
        }

        // Cannot change owner role
        if (member.role === 'owner') {
            const error = new Error('Cannot change owner role');
            error.statusCode = 400;
            throw error;
        }

        // Cannot demote yourself if you're the only owner
        if (member.user_id === userId && member.role === 'owner') {
            const ownerCount = await WorkspaceMember.count({
                where: {
                    workspace_id: workspaceId,
                    role: 'owner'
                }
            });

            if (ownerCount === 1) {
                const error = new Error('Cannot demote yourself as the only owner');
                error.statusCode = 400;
                throw error;
            }
        }

        await member.update({ role });

        return {
            id: member.id,
            role: member.role,
            updated_at: member.updated_at
        };
    }

    /**
     * Remove member from workspace
     */
    async removeMember(workspaceId, memberId, userId) {
        const member = await WorkspaceMember.findOne({
            where: {
                id: memberId,
                workspace_id: workspaceId
            }
        });

        if (!member) {
            const error = new Error('Member not found');
            error.statusCode = 404;
            throw error;
        }

        // Cannot remove owner
        if (member.role === 'owner') {
            const error = new Error('Cannot remove workspace owner');
            error.statusCode = 400;
            throw error;
        }

        // Cannot remove yourself (use leave endpoint)
        if (member.user_id === userId) {
            const error = new Error('Use leave endpoint to remove yourself');
            error.statusCode = 400;
            throw error;
        }

        await member.destroy();

        return { message: 'Member removed successfully' };
    }

    /**
     * Leave workspace
     */
    async leaveWorkspace(workspaceId, userId) {
        const member = await WorkspaceMember.findOne({
            where: {
                workspace_id: workspaceId,
                user_id: userId
            }
        });

        if (!member) {
            const error = new Error('You are not a member of this workspace');
            error.statusCode = 404;
            throw error;
        }

        // Owner cannot leave
        if (member.role === 'owner') {
            const error = new Error('Owner cannot leave workspace. Transfer ownership or delete the workspace.');
            error.statusCode = 400;
            throw error;
        }

        await member.destroy();

        return { message: 'Left workspace successfully' };
    }

    /**
     * Invite member to workspace
     */
    async inviteMember(workspaceId, email, role, userId) {
        // Check if user with email exists
        const existingUser = await User.findOne({ where: { email } });

        // Check if already a member
        if (existingUser) {
            const existingMember = await WorkspaceMember.findOne({
                where: {
                    workspace_id: workspaceId,
                    user_id: existingUser.id
                }
            });

            if (existingMember) {
                const error = new Error('User is already a member of this workspace');
                error.statusCode = 409;
                throw error;
            }
        }

        // Check for existing pending invitation
        const existingInvitation = await WorkspaceInvitation.findOne({
            where: {
                workspace_id: workspaceId,
                email,
                status: 'pending'
            }
        });

        if (existingInvitation) {
            const error = new Error('Invitation already sent to this email');
            error.statusCode = 409;
            throw error;
        }

        // Generate secure token
        const token = crypto.randomBytes(32).toString('hex');

        // Set expiry (7 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Create invitation
        const invitation = await WorkspaceInvitation.create({
            workspace_id: workspaceId,
            invited_by: userId,
            email,
            role,
            token,
            expires_at: expiresAt
        });

        // Get workspace and inviter details for email
        const workspace = await Workspace.findByPk(workspaceId);
        const inviter = await User.findByPk(userId);

        // Send invitation email (non-blocking)
        emailService.sendWorkspaceInvite(
            email,
            workspace.name,
            inviter.name,
            token
        ).catch(err => {
            console.error('Failed to send invitation email:', err.message);
        });

        // Create in-app notification if user exists
        if (existingUser) {
            notificationService.notifyWorkspaceInvite(
                existingUser.id,
                workspace.name,
                inviter.name,
                token
            ).catch(err => {
                console.error('Failed to create workspace invitation notification:', err.message);
            });
        }

        return {
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            token: invitation.token,
            expires_at: invitation.expires_at,
            status: invitation.status
        };
    }

    /**
     * Get workspace invitations
     */
    async getInvitations(workspaceId, filters = {}) {
        const { status, page = 1, limit = 20 } = filters;
        const offset = (page - 1) * limit;

        const whereClause = { workspace_id: workspaceId };
        if (status) {
            whereClause.status = status;
        }

        const { count, rows } = await WorkspaceInvitation.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'inviter',
                    attributes: ['id', 'name', 'email']
                }
            ],
            limit,
            offset,
            order: [['created_at', 'DESC']]
        });

        return {
            invitations: rows,
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        };
    }

    /**
     * Accept invitation
     */
    async acceptInvitation(token, userId) {
        const invitation = await WorkspaceInvitation.findOne({
            where: { token },
            include: [
                {
                    model: Workspace,
                    as: 'workspace',
                    where: { deleted_at: null }
                }
            ]
        });

        if (!invitation) {
            const error = new Error('Invalid invitation token');
            error.statusCode = 404;
            throw error;
        }
        if (invitation.status === 'accepted') {
            const user = await User.findByPk(userId);
            if (user && user.email === invitation.email) {
                // Check if already a member
                const membership = await WorkspaceMember.findOne({
                    where: { workspace_id: invitation.workspace_id, user_id: userId }
                });
                if (membership) {
                    return this.getWorkspaceById(invitation.workspace_id, userId);
                }
            }
            const error = new Error('Invitation has already been processed');
            error.statusCode = 400;
            throw error;
        }

        if (invitation.status !== 'pending') {
            const error = new Error('Invitation is no longer active');
            error.statusCode = 400;
            throw error;
        }

        if (new Date() > invitation.expires_at) {
            const error = new Error('Invitation has expired');
            error.statusCode = 400;
            throw error;
        }

        // Get user email
        const user = await User.findByPk(userId);
        if (user.email !== invitation.email) {
            const error = new Error('This invitation is for a different email address');
            error.statusCode = 403;
            throw error;
        }

        // Check if already a member
        const existingMember = await WorkspaceMember.findOne({
            where: {
                workspace_id: invitation.workspace_id,
                user_id: userId
            }
        });

        if (existingMember) {
            const error = new Error('You are already a member of this workspace');
            error.statusCode = 409;
            throw error;
        }

        const transaction = await sequelize.transaction();
        try {
            // Add user to workspace
            await WorkspaceMember.create({
                workspace_id: invitation.workspace_id,
                user_id: userId,
                role: invitation.role
            }, { transaction });

            // Update invitation status
            await invitation.update({
                status: 'accepted',
                accepted_at: new Date()
            }, { transaction });

            // Mark notification as read if exists
            await Notification.update(
                { is_read: true },
                {
                    where: {
                        user_id: userId,
                        type: 'workspace_invite',
                        is_read: false
                    },
                    transaction
                }
            );

            await transaction.commit();
            return this.getWorkspaceById(invitation.workspace_id, userId);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Decline invitation
     */
    async declineInvitation(token, userId) {
        const invitation = await WorkspaceInvitation.findOne({
            where: { token }
        });

        if (!invitation) {
            const error = new Error('Invalid invitation token');
            error.statusCode = 404;
            throw error;
        }

        if (invitation.status !== 'pending') {
            const error = new Error('Invitation has already been processed');
            error.statusCode = 400;
            throw error;
        }

        // Get user email
        const user = await User.findByPk(userId);
        if (user.email !== invitation.email) {
            const error = new Error('This invitation is for a different email address');
            error.statusCode = 403;
            throw error;
        }

        await invitation.update({ status: 'declined' });

        return { message: 'Invitation declined' };
    }

    /**
     * Cancel invitation
     */
    async cancelInvitation(workspaceId, invitationId, userId) {
        const invitation = await WorkspaceInvitation.findOne({
            where: {
                id: invitationId,
                workspace_id: workspaceId
            }
        });

        if (!invitation) {
            const error = new Error('Invitation not found');
            error.statusCode = 404;
            throw error;
        }

        if (invitation.status !== 'pending') {
            const error = new Error('Can only cancel pending invitations');
            error.statusCode = 400;
            throw error;
        }

        await invitation.update({ status: 'cancelled' });

        return { message: 'Invitation cancelled successfully' };
    }
}

module.exports = new WorkspaceService();
