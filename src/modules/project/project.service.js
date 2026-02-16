const {
    Project,
    ProjectMember,
    TaskStatus,
    ProjectLabel,
    WorkspaceMember,
    User,
    Workspace,
    ProjectInvitation,
    Notification,
    sequelize
} = require('../../database/models');
const { Op } = require('sequelize');
const notificationService = require('../notification/notification.service');
const { v4: uuidv4, validate: validateUuid } = require('uuid');
const activityService = require('../activity/activity.service');

class ProjectService {
    /**
     * Create a new project
     */
    async createProject(workspaceId, userId, data) {
        const transaction = await sequelize.transaction();

        try {
            // Verify workspace membership
            const workspaceMember = await WorkspaceMember.findOne({
                where: { workspace_id: workspaceId, user_id: userId }
            });

            if (!workspaceMember) {
                throw new Error('You are not a member of this workspace');
            }

            // Create project
            const project = await Project.create({
                workspace_id: workspaceId,
                name: data.name,
                description: data.description,
                color: data.color,
                start_date: data.start_date,
                end_date: data.end_date,
                settings: data.settings || {}
            }, { transaction });

            // Add creator as project lead
            await ProjectMember.create({
                project_id: project.id,
                workspace_member_id: workspaceMember.id,
                project_role: 'lead'
            }, { transaction });

            // Create default task statuses
            const defaultStatuses = [
                { name: 'To Do', color: '#94A3B8', position: 0, is_default: true, is_completed: false },
                { name: 'In Progress', color: '#3B82F6', position: 1, is_default: false, is_completed: false },
                { name: 'Done', color: '#10B981', position: 2, is_default: false, is_completed: true }
            ];

            for (const status of defaultStatuses) {
                await TaskStatus.create({
                    project_id: project.id,
                    ...status
                }, { transaction });
            }

            await transaction.commit();

            // Fetch complete project with statuses (after commit)
            return await this.getProjectById(project.id, userId);
        } catch (error) {
            // Only rollback if transaction hasn't been committed
            if (!transaction.finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }

    /**
     * Get all projects in a workspace
     */
    async getWorkspaceProjects(workspaceId, userId, filters = {}) {
        const { status = 'active', page = 1, limit = 20 } = filters;
        const offset = (page - 1) * limit;

        // Get user's workspace membership
        const workspaceMember = await WorkspaceMember.findOne({
            where: { workspace_id: workspaceId, user_id: userId }
        });

        if (!workspaceMember) {
            throw new Error('You are not a member of this workspace');
        }

        // Build where clause
        const whereClause = { workspace_id: workspaceId };

        if (status === 'active') {
            whereClause.archived_at = null;
        } else if (status === 'archived') {
            whereClause.archived_at = { [Op.not]: null };
        }
        // 'all' shows both

        const { count, rows } = await Project.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: ProjectMember,
                    as: 'members',
                    where: { workspace_member_id: workspaceMember.id },
                    required: false,
                    attributes: ['id', 'project_role', 'added_at']
                }
            ],
            limit,
            offset,
            order: [['created_at', 'DESC']],
            distinct: true
        });

        // Get member count and task count for each project
        const projectsWithCounts = await Promise.all(rows.map(async (project) => {
            const memberCount = await ProjectMember.count({
                where: { project_id: project.id }
            });

            let taskCount = 0;
            let completedTaskCount = 0;
            try {
                if (sequelize.models.Task && sequelize.models.TaskStatus) {
                    const tasks = await sequelize.models.Task.findAll({
                        where: { project_id: project.id, archived_at: null },
                        include: [{
                            model: sequelize.models.TaskStatus,
                            as: 'status',
                            attributes: ['name', 'is_completed']
                        }],
                        attributes: ['id']
                    });

                    taskCount = tasks.length;
                    completedTaskCount = tasks.filter(t => t.status?.is_completed).length;
                }
            } catch (error) {
                console.error('Error calculating progress:', error);
            }

            const progress = taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0;

            const projectData = project.toJSON();
            const userMembership = projectData.members?.[0];

            return {
                id: projectData.id,
                name: projectData.name,
                description: projectData.description,
                color: projectData.color,
                start_date: projectData.start_date,
                end_date: projectData.end_date,
                archived_at: projectData.archived_at,
                member_count: memberCount,
                task_count: taskCount,
                completed_task_count: completedTaskCount,
                progress,
                your_role: userMembership?.project_role || null,
                joined_at: userMembership?.added_at || null,
                created_at: projectData.created_at,
                updated_at: projectData.updated_at
            };
        }));

        return {
            projects: projectsWithCounts,
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        };
    }

    /**
     * Get project by ID
     */
    async getProjectById(projectId, userId) {
        const project = await Project.findByPk(projectId, {
            include: [
                {
                    model: TaskStatus,
                    as: 'taskStatuses',
                    attributes: ['id', 'name', 'color', 'position', 'is_default'],
                    order: [['position', 'ASC']]
                },
                {
                    model: ProjectLabel,
                    as: 'labels',
                    attributes: ['id', 'name', 'color']
                }
            ]
        });

        if (!project) {
            throw new Error('Project not found');
        }

        // Check if user is a member
        const workspaceMember = await WorkspaceMember.findOne({
            where: { workspace_id: project.workspace_id, user_id: userId }
        });

        if (!workspaceMember) {
            throw new Error('Access denied');
        }

        const projectMember = await ProjectMember.findOne({
            where: {
                project_id: projectId,
                workspace_member_id: workspaceMember.id
            }
        });

        // Get counts and progress
        let taskCount = 0;
        let completedTaskCount = 0;
        let memberCount = 0;
        try {
            // Get member count
            const members = await ProjectMember.findAll({
                where: { project_id: projectId },
                attributes: ['id']
            });
            memberCount = members.length;

            // Get task statistics
            if (sequelize.models.Task) {
                const tasks = await sequelize.models.Task.findAll({
                    where: { project_id: projectId, archived_at: null },
                    include: [{
                        model: TaskStatus,
                        as: 'status',
                        attributes: ['name', 'is_completed']
                    }],
                    attributes: ['id']
                });

                taskCount = tasks.length;
                completedTaskCount = tasks.filter(t => t.status?.is_completed).length;
            }
        } catch (error) {
            console.error('Error calculating project progress:', error);
        }

        const progress = taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0;
        const projectData = project.toJSON();

        return {
            ...projectData,
            member_count: memberCount,
            task_count: taskCount,
            completed_task_count: completedTaskCount,
            progress,
            your_role: projectMember?.project_role || null,
            joined_at: projectMember?.added_at || null
        };
    }

    /**
     * Update project
     */
    async updateProject(projectId, userId, data) {
        const project = await Project.findByPk(projectId);

        if (!project) {
            throw new Error('Project not found');
        }

        // Check permissions (project lead or workspace owner/admin)
        await this.checkProjectPermission(projectId, userId, ['lead']);

        // Update project
        await project.update({
            name: data.name !== undefined ? data.name : project.name,
            description: data.description !== undefined ? data.description : project.description,
            color: data.color !== undefined ? data.color : project.color,
            start_date: data.start_date !== undefined ? data.start_date : project.start_date,
            end_date: data.end_date !== undefined ? data.end_date : project.end_date,
            settings: data.settings !== undefined ? data.settings : project.settings
        });

        return await this.getProjectById(projectId, userId);
    }

    /**
     * Archive or unarchive project
     */
    async archiveProject(projectId, userId, archived) {
        const project = await Project.findByPk(projectId);

        if (!project) {
            throw new Error('Project not found');
        }

        // Check permissions
        await this.checkProjectPermission(projectId, userId, ['lead']);

        await project.update({
            archived_at: archived ? new Date() : null
        });

        return await this.getProjectById(projectId, userId);
    }

    /**
     * Delete project (hard delete)
     */
    async deleteProject(projectId, userId) {
        const project = await Project.findByPk(projectId);

        if (!project) {
            throw new Error('Project not found');
        }

        // Only workspace owner/admin can delete
        const workspaceMember = await WorkspaceMember.findOne({
            where: { workspace_id: project.workspace_id, user_id: userId }
        });

        if (!workspaceMember || !['owner', 'admin'].includes(workspaceMember.role)) {
            throw new Error('Only workspace owner/admin can delete projects');
        }

        await project.destroy();
    }

    /**
     * Add member to project
     */
    async addMember(projectId, workspaceMemberId, projectRole, userId) {
        const project = await Project.findByPk(projectId);

        if (!project) {
            throw new Error('Project not found');
        }

        // Check permissions
        await this.checkProjectPermission(projectId, userId, ['lead']);

        // Verify workspace member exists and belongs to same workspace
        const workspaceMember = await WorkspaceMember.findByPk(workspaceMemberId);

        if (!workspaceMember || workspaceMember.workspace_id !== project.workspace_id) {
            throw new Error('Invalid workspace member');
        }

        // Check if already a member
        const existing = await ProjectMember.findOne({
            where: { project_id: projectId, workspace_member_id: workspaceMemberId }
        });

        if (existing) {
            throw new Error('User is already a project member');
        }

        // Add member
        const projectMember = await ProjectMember.create({
            project_id: projectId,
            workspace_member_id: workspaceMemberId,
            project_role: projectRole
        });

        // Return member with user details
        return await ProjectMember.findByPk(projectMember.id, {
            include: [
                {
                    model: WorkspaceMember,
                    as: 'workspaceMember',
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['id', 'name', 'email', 'avatar_url']
                        }
                    ]
                }
            ]
        });
    }

    /**
     * Get project members
     */
    async getMembers(projectId, filters = {}) {
        const { role, page = 1, limit = 20 } = filters;
        const offset = (page - 1) * limit;

        const whereClause = { project_id: projectId };
        if (role) {
            whereClause.project_role = role;
        }

        const { count, rows } = await ProjectMember.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: WorkspaceMember,
                    as: 'workspaceMember',
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['id', 'name', 'email', 'avatar_url']
                        }
                    ],
                    attributes: ['id', 'role']
                }
            ],
            limit,
            offset,
            order: [['added_at', 'ASC']]
        });

        const members = rows.map(member => ({
            id: member.id,
            user: member.workspaceMember.user,
            workspace_role: member.workspaceMember.role,
            project_role: member.project_role,
            added_at: member.added_at
        }));

        return {
            members,
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
    async updateMemberRole(projectId, memberId, newRole, userId) {
        const projectMember = await ProjectMember.findByPk(memberId);

        if (!projectMember || projectMember.project_id !== projectId) {
            throw new Error('Project member not found');
        }

        // Check permissions
        await this.checkProjectPermission(projectId, userId, ['lead']);

        // Cannot demote yourself if you're the only lead
        const userWorkspaceMember = await WorkspaceMember.findOne({
            where: { user_id: userId }
        });

        if (projectMember.workspace_member_id === userWorkspaceMember.id &&
            projectMember.project_role === 'lead' &&
            newRole !== 'lead') {
            const leadCount = await ProjectMember.count({
                where: { project_id: projectId, project_role: 'lead' }
            });

            if (leadCount === 1) {
                throw new Error('Cannot demote the only project lead');
            }
        }

        await projectMember.update({ project_role: newRole });

        return await ProjectMember.findByPk(memberId, {
            include: [
                {
                    model: WorkspaceMember,
                    as: 'workspaceMember',
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['id', 'name', 'email', 'avatar_url']
                        }
                    ]
                }
            ]
        });
    }

    /**
     * Remove member from project
     */
    async removeMember(projectId, memberId, userId) {
        const projectMember = await ProjectMember.findByPk(memberId);

        if (!projectMember || projectMember.project_id !== projectId) {
            throw new Error('Project member not found');
        }

        // Check permissions
        await this.checkProjectPermission(projectId, userId, ['lead']);

        // Cannot remove yourself (use leave endpoint)
        const userWorkspaceMember = await WorkspaceMember.findOne({
            where: { user_id: userId }
        });

        if (projectMember.workspace_member_id === userWorkspaceMember.id) {
            throw new Error('Cannot remove yourself. Use leave endpoint instead');
        }

        // TODO: Unassign from all tasks
        await projectMember.destroy();
    }

    /**
     * Leave project
     */
    async leaveProject(projectId, userId) {
        const workspaceMember = await WorkspaceMember.findOne({
            where: { user_id: userId }
        });

        const projectMember = await ProjectMember.findOne({
            where: {
                project_id: projectId,
                workspace_member_id: workspaceMember.id
            }
        });

        if (!projectMember) {
            throw new Error('You are not a member of this project');
        }

        // Cannot leave if you're the only lead
        if (projectMember.project_role === 'lead') {
            const leadCount = await ProjectMember.count({
                where: { project_id: projectId, project_role: 'lead' }
            });

            if (leadCount === 1) {
                throw new Error('Cannot leave as the only project lead. Assign another lead first');
            }
        }

        // TODO: Unassign from all tasks
        await projectMember.destroy();
    }

    /**
     * Create task status
     */
    async createStatus(projectId, data, userId) {
        // Check permissions
        await this.checkProjectPermission(projectId, userId, ['lead']);

        // Check for duplicate name
        const existing = await TaskStatus.findOne({
            where: { project_id: projectId, name: data.name }
        });

        if (existing) {
            throw new Error('A status with this name already exists');
        }

        // Get max position if not provided
        let position = data.position;
        if (position === undefined) {
            const maxPosition = await TaskStatus.max('position', {
                where: { project_id: projectId }
            });
            position = (maxPosition || -1) + 1;
        }

        return await TaskStatus.create({
            project_id: projectId,
            name: data.name,
            color: data.color || '#94A3B8',
            position,
            is_default: false
        });
    }

    /**
     * Get task statuses
     */
    async getStatuses(projectId) {
        return await TaskStatus.findAll({
            where: { project_id: projectId },
            order: [['position', 'ASC']]
        });
    }

    /**
     * Update task status
     */
    async updateStatus(projectId, statusId, data, userId) {
        const status = await TaskStatus.findByPk(statusId);

        if (!status || status.project_id !== projectId) {
            throw new Error('Task status not found');
        }

        // Check permissions
        await this.checkProjectPermission(projectId, userId, ['lead']);

        // Check for duplicate name if changing name
        if (data.name && data.name !== status.name) {
            const existing = await TaskStatus.findOne({
                where: {
                    project_id: projectId,
                    name: data.name,
                    id: { [Op.not]: statusId }
                }
            });

            if (existing) {
                throw new Error('A status with this name already exists');
            }
        }

        await status.update({
            name: data.name !== undefined ? data.name : status.name,
            color: data.color !== undefined ? data.color : status.color,
            position: data.position !== undefined ? data.position : status.position
        });

        return status;
    }

    /**
     * Delete task status
     */
    async deleteStatus(projectId, statusId, userId, moveToStatusId) {
        const status = await TaskStatus.findByPk(statusId);

        if (!status || status.project_id !== projectId) {
            throw new Error('Task status not found');
        }

        // Check permissions
        await this.checkProjectPermission(projectId, userId, ['lead']);

        // Check if tasks exist with this status
        const taskCount = await sequelize.models.Task?.count({
            where: { status_id: statusId }
        }) || 0;

        if (taskCount > 0) {
            if (!moveToStatusId) {
                throw new Error('Cannot delete status with tasks. Provide move_tasks_to_status_id');
            }

            // Verify target status exists
            const targetStatus = await TaskStatus.findByPk(moveToStatusId);
            if (!targetStatus || targetStatus.project_id !== projectId) {
                throw new Error('Invalid target status');
            }

            // Move tasks
            if (sequelize.models.Task) {
                await sequelize.models.Task.update(
                    { status_id: moveToStatusId },
                    { where: { status_id: statusId } }
                );
            }
        }

        await status.destroy();

        // Reorder remaining statuses
        const remainingStatuses = await TaskStatus.findAll({
            where: { project_id: projectId },
            order: [['position', 'ASC']]
        });

        for (let i = 0; i < remainingStatuses.length; i++) {
            await remainingStatuses[i].update({ position: i });
        }
    }

    /**
     * Create project label
     */
    async createLabel(projectId, data, userId) {
        // Check permissions
        await this.checkProjectPermission(projectId, userId, ['lead']);

        // Check for duplicate name
        const existing = await ProjectLabel.findOne({
            where: { project_id: projectId, name: data.name }
        });

        if (existing) {
            throw new Error('A label with this name already exists');
        }

        return await ProjectLabel.create({
            project_id: projectId,
            name: data.name,
            color: data.color
        });
    }

    /**
     * Get project labels
     */
    async getLabels(projectId) {
        return await ProjectLabel.findAll({
            where: { project_id: projectId },
            order: [['name', 'ASC']]
        });
    }

    /**
     * Update project label
     */
    async updateLabel(projectId, labelId, data, userId) {
        const label = await ProjectLabel.findByPk(labelId);

        if (!label || label.project_id !== projectId) {
            throw new Error('Label not found');
        }

        // Check permissions
        await this.checkProjectPermission(projectId, userId, ['lead']);

        // Check for duplicate name if changing name
        if (data.name && data.name !== label.name) {
            const existing = await ProjectLabel.findOne({
                where: {
                    project_id: projectId,
                    name: data.name,
                    id: { [Op.not]: labelId }
                }
            });

            if (existing) {
                throw new Error('A label with this name already exists');
            }
        }

        await label.update({
            name: data.name !== undefined ? data.name : label.name,
            color: data.color !== undefined ? data.color : label.color
        });

        return label;
    }

    /**
     * Delete project label
     */
    async deleteLabel(projectId, labelId, userId) {
        const label = await ProjectLabel.findByPk(labelId);

        if (!label || label.project_id !== projectId) {
            throw new Error('Label not found');
        }

        // Check permissions
        await this.checkProjectPermission(projectId, userId, ['lead']);

        // TODO: Remove label from all tasks
        await label.destroy();
    }

    /**
     * Helper: Check if user has required project permission
     */
    async checkProjectPermission(projectId, userId, allowedRoles = []) {
        const project = await Project.findByPk(projectId);

        if (!project) {
            throw new Error('Project not found');
        }

        const workspaceMember = await WorkspaceMember.findOne({
            where: { workspace_id: project.workspace_id, user_id: userId }
        });

        if (!workspaceMember) {
            throw new Error('Access denied');
        }

        // Workspace owner/admin have full access
        if (['owner', 'admin'].includes(workspaceMember.role)) {
            return true;
        }

        // Check project role
        const projectMember = await ProjectMember.findOne({
            where: {
                project_id: projectId,
                workspace_member_id: workspaceMember.id
            }
        });

        if (!projectMember) {
            throw new Error('You are not a member of this project');
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(projectMember.project_role)) {
            throw new Error('Insufficient permissions');
        }

        return true;
    }

    /**
     * Invite workspace member to project
     */
    async inviteMember(projectId, invitedWorkspaceMemberId, role, userId) {
        // Only Lead can invite
        await this.checkProjectPermission(projectId, userId, ['lead']);

        const project = await Project.findByPk(projectId);

        // Verify invited member is in the same workspace
        const workspaceMember = await WorkspaceMember.findByPk(invitedWorkspaceMemberId);
        if (!workspaceMember || workspaceMember.workspace_id !== project.workspace_id) {
            throw new Error('Invitee must be a member of the workspace');
        }

        // Check if already in project
        const existingMember = await ProjectMember.findOne({
            where: { project_id: projectId, workspace_member_id: invitedWorkspaceMemberId }
        });
        if (existingMember) {
            throw new Error('User is already a member of this project');
        }

        // Check for existing pending invitation
        const existingInvite = await ProjectInvitation.findOne({
            where: {
                project_id: projectId,
                workspace_member_id: invitedWorkspaceMemberId,
                status: 'pending'
            }
        });
        if (existingInvite) {
            throw new Error('User already has a pending invitation to this project');
        }

        // Create invitation with pre-generated UUID to ensure signal integrity
        const invitationId = uuidv4();
        const invitation = await ProjectInvitation.create({
            id: invitationId,
            project_id: projectId,
            workspace_member_id: invitedWorkspaceMemberId,
            invited_by: userId,
            role: role || 'member',
            status: 'pending'
        });

        // Trigger notification
        const inviter = await User.findByPk(userId);
        await notificationService.notifyProjectInvite(
            workspaceMember.user_id,
            project.name,
            inviter.name,
            project.id,
            invitationId
        );

        return invitation;
    }

    /**
     * Get project invitations
     */
    async getInvitations(projectId, userId) {
        const project = await Project.findByPk(projectId);
        if (!project) throw new Error('Project not found');

        // Check if user is workspace member
        const workspaceMember = await WorkspaceMember.findOne({
            where: { workspace_id: project.workspace_id, user_id: userId }
        });
        if (!workspaceMember) throw new Error('Access denied');

        // Check if project member
        const projectMember = await ProjectMember.findOne({
            where: { project_id: projectId, workspace_member_id: workspaceMember.id }
        });

        const whereClause = { project_id: projectId };

        // If not a lead, only see your own pending invitations
        if (!projectMember || projectMember.project_role !== 'lead') {
            // Check if workspace admin/owner
            if (!['owner', 'admin'].includes(workspaceMember.role)) {
                whereClause.workspace_member_id = workspaceMember.id;
                whereClause.status = 'pending';
            }
        }

        return await ProjectInvitation.findAll({
            where: whereClause,
            include: [
                {
                    model: WorkspaceMember,
                    as: 'invitee',
                    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatar_url'] }]
                },
                {
                    model: User,
                    as: 'inviter',
                    attributes: ['id', 'name']
                }
            ],
            order: [['created_at', 'DESC']]
        });
    }

    /**
     * Accept project invitation
     */
    async acceptInvitation(invitationId, userId, projectId = null) {
        let invite = null;

        if (invitationId && validateUuid(invitationId)) {
            invite = await ProjectInvitation.findByPk(invitationId);
        }

        // Signal Healer: If lookup by ID fails and we have a project ID, try finding pending invite for this user
        if (!invite && projectId) {
            console.log(`[Neural Healer] Fragmented signal detected for user ${userId} in project ${projectId}. Attempting recovery...`);
            invite = await ProjectInvitation.findOne({
                where: {
                    project_id: projectId,
                    status: 'pending'
                },
                include: [{
                    model: WorkspaceMember,
                    as: 'invitee',
                    where: { user_id: userId }
                }]
            });

            if (invite) {
                console.log(`[Neural Healer] Signal recovered. Localized invitation: ${invite.id}`);
            }
        }

        if (!invite) {
            throw new Error('Invitation not found or no longer active');
        }

        if (invite.status === 'accepted') {
            const workspaceMember = await WorkspaceMember.findByPk(invite.workspace_member_id);
            if (workspaceMember.user_id === userId) {
                return { message: 'Already joined project' };
            }
            throw new Error('Invitation has already been accepted by another specialist');
        }

        if (invite.status !== 'pending') {
            throw new Error('Invitation is no longer active');
        }

        const workspaceMember = await WorkspaceMember.findByPk(invite.workspace_member_id);
        if (workspaceMember.user_id !== userId) {
            throw new Error('This invitation was not sent to you');
        }

        const transaction = await sequelize.transaction();
        try {
            // Join project
            await ProjectMember.create({
                project_id: invite.project_id,
                workspace_member_id: invite.workspace_member_id,
                project_role: invite.role,
                added_at: new Date()
            }, { transaction });

            // Update invitation
            await invite.update({
                status: 'accepted',
                accepted_at: new Date()
            }, { transaction });

            // Mark notification as read if exists
            await Notification.update(
                { is_read: true },
                {
                    where: {
                        user_id: userId,
                        type: 'project_invite',
                        is_read: false
                    },
                    transaction
                }
            );

            await transaction.commit();

            // Trigger notification to inviter (lead)
            const specialist = await User.findByPk(userId);
            const project = await Project.findByPk(invite.project_id);
            await notificationService.notifyProjectInviteAccepted(
                invite.invited_by,
                specialist.name,
                project.name,
                project.id
            );

            return { message: 'Joined project successfully' };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

module.exports = new ProjectService();
