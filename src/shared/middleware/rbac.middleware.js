const { WorkspaceMember, ProjectMember } = require('../../database/models');

/**
 * Check if user has required workspace role
 */
const requireWorkspaceRole = (allowedRoles = []) => {
    return async (req, res, next) => {
        try {
            const { workspaceId } = req.params;
            const userId = req.user.id;

            const membership = await WorkspaceMember.findOne({
                where: {
                    workspace_id: workspaceId,
                    user_id: userId,
                    status: 'active'
                }
            });

            if (!membership) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not a member of this workspace'
                });
            }

            if (allowedRoles.length > 0 && !allowedRoles.includes(membership.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions'
                });
            }

            // Attach membership to request
            req.workspaceMembership = membership;
            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Check if user has required project role
 */
const requireProjectRole = (allowedRoles = []) => {
    return async (req, res, next) => {
        try {
            const { projectId } = req.params;
            const userId = req.user.id;

            // First check workspace membership
            const projectMember = await ProjectMember.findOne({
                where: { project_id: projectId },
                include: [{
                    model: require('../../database/models').WorkspaceMember,
                    as: 'workspaceMember',
                    where: { user_id: userId, status: 'active' }
                }]
            });

            if (!projectMember) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not a member of this project'
                });
            }

            const workspaceRole = projectMember.workspaceMember.role;
            const projectRole = projectMember.project_role;

            // Workspace owners and admins have full access
            if (['owner', 'admin'].includes(workspaceRole)) {
                req.projectMembership = projectMember;
                return next();
            }

            if (allowedRoles.length > 0 && !allowedRoles.includes(projectRole)) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient project permissions'
                });
            }

            req.projectMembership = projectMember;
            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Check if user is workspace owner
 */
const requireWorkspaceOwner = async (req, res, next) => {
    try {
        const { workspaceId } = req.params;
        const userId = req.user.id;

        const membership = await WorkspaceMember.findOne({
            where: {
                workspace_id: workspaceId,
                user_id: userId,
                role: 'owner',
                status: 'active'
            }
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: 'Only workspace owner can perform this action'
            });
        }

        req.workspaceMembership = membership;
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    requireWorkspaceRole,
    requireProjectRole,
    requireWorkspaceOwner
};
