const projectService = require('./project.service');

// Project CRUD Controllers

const createProject = async (req, res, next) => {
    try {
        const { workspaceId } = req.params;
        const userId = req.user.id;
        const project = await projectService.createProject(workspaceId, userId, req.body);

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: project
        });
    } catch (error) {
        next(error);
    }
};

const getWorkspaceProjects = async (req, res, next) => {
    try {
        const { workspaceId } = req.params;
        const userId = req.user.id;
        const result = await projectService.getWorkspaceProjects(workspaceId, userId, req.query);

        res.json({
            success: true,
            data: result.projects,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

const getProjectById = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;
        const project = await projectService.getProjectById(projectId, userId);

        res.json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
};

const updateProject = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;
        const project = await projectService.updateProject(projectId, userId, req.body);

        res.json({
            success: true,
            message: 'Project updated successfully',
            data: project
        });
    } catch (error) {
        next(error);
    }
};

const archiveProject = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;
        const { archived } = req.body;
        const project = await projectService.archiveProject(projectId, userId, archived);

        res.json({
            success: true,
            message: archived ? 'Project archived successfully' : 'Project unarchived successfully',
            data: project
        });
    } catch (error) {
        next(error);
    }
};

const deleteProject = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;
        await projectService.deleteProject(projectId, userId);

        res.json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Project Member Controllers

const addProjectMember = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;
        const { workspace_member_id, project_role } = req.body;

        const member = await projectService.addMember(projectId, workspace_member_id, project_role, userId);

        res.status(201).json({
            success: true,
            message: 'Member added to project successfully',
            data: member
        });
    } catch (error) {
        next(error);
    }
};

const getProjectMembers = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const result = await projectService.getMembers(projectId, req.query);

        res.json({
            success: true,
            data: result.members,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

const updateProjectMemberRole = async (req, res, next) => {
    try {
        const { projectId, memberId } = req.params;
        const userId = req.user.id;
        const { project_role } = req.body;

        const member = await projectService.updateMemberRole(projectId, memberId, project_role, userId);

        res.json({
            success: true,
            message: 'Member role updated successfully',
            data: member
        });
    } catch (error) {
        next(error);
    }
};

const removeProjectMember = async (req, res, next) => {
    try {
        const { projectId, memberId } = req.params;
        const userId = req.user.id;
        await projectService.removeMember(projectId, memberId, userId);

        res.json({
            success: true,
            message: 'Member removed from project successfully'
        });
    } catch (error) {
        next(error);
    }
};

const leaveProject = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;
        await projectService.leaveProject(projectId, userId);

        res.json({
            success: true,
            message: 'Left project successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Task Status Controllers

const createTaskStatus = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;
        const status = await projectService.createStatus(projectId, req.body, userId);

        res.status(201).json({
            success: true,
            message: 'Task status created successfully',
            data: status
        });
    } catch (error) {
        next(error);
    }
};

const getTaskStatuses = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const statuses = await projectService.getStatuses(projectId);

        res.json({
            success: true,
            data: statuses
        });
    } catch (error) {
        next(error);
    }
};

const updateTaskStatus = async (req, res, next) => {
    try {
        const { projectId, statusId } = req.params;
        const userId = req.user.id;
        const status = await projectService.updateStatus(projectId, statusId, req.body, userId);

        res.json({
            success: true,
            message: 'Task status updated successfully',
            data: status
        });
    } catch (error) {
        next(error);
    }
};

const deleteTaskStatus = async (req, res, next) => {
    try {
        const { projectId, statusId } = req.params;
        const userId = req.user.id;
        const { move_tasks_to_status_id } = req.query;

        await projectService.deleteStatus(projectId, statusId, userId, move_tasks_to_status_id);

        res.json({
            success: true,
            message: 'Task status deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Project Label Controllers

const createProjectLabel = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;
        const label = await projectService.createLabel(projectId, req.body, userId);

        res.status(201).json({
            success: true,
            message: 'Label created successfully',
            data: label
        });
    } catch (error) {
        next(error);
    }
};

const getProjectLabels = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const labels = await projectService.getLabels(projectId);

        res.json({
            success: true,
            data: labels
        });
    } catch (error) {
        next(error);
    }
};

const updateProjectLabel = async (req, res, next) => {
    try {
        const { projectId, labelId } = req.params;
        const userId = req.user.id;
        const label = await projectService.updateLabel(projectId, labelId, req.body, userId);

        res.json({
            success: true,
            message: 'Label updated successfully',
            data: label
        });
    } catch (error) {
        next(error);
    }
};

const deleteProjectLabel = async (req, res, next) => {
    try {
        const { projectId, labelId } = req.params;
        const userId = req.user.id;
        await projectService.deleteLabel(projectId, labelId, userId);

        res.json({
            success: true,
            message: 'Label deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

const inviteProjectMember = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { workspace_member_id, project_role } = req.body;
        const userId = req.user.id;
        const invitation = await projectService.inviteMember(projectId, workspace_member_id, project_role, userId);

        res.status(201).json({
            success: true,
            message: 'Invitation sent successfully',
            data: invitation
        });
    } catch (error) {
        next(error);
    }
};

const getProjectInvitations = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;
        const invitations = await projectService.getInvitations(projectId, userId);

        res.json({
            success: true,
            data: invitations
        });
    } catch (error) {
        next(error);
    }
};

const acceptProjectInvitation = async (req, res, next) => {
    try {
        const { invitationId, projectId } = req.params;
        const userId = req.user.id;
        const result = await projectService.acceptInvitation(invitationId, userId, projectId);

        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    // Project CRUD
    createProject,
    getWorkspaceProjects,
    getProjectById,
    updateProject,
    archiveProject,
    deleteProject,

    // Project Members
    addProjectMember,
    getProjectMembers,
    updateProjectMemberRole,
    removeProjectMember,
    leaveProject,

    // Task Statuses
    createTaskStatus,
    getTaskStatuses,
    updateTaskStatus,
    deleteTaskStatus,

    // Project Labels
    createProjectLabel,
    getProjectLabels,
    updateProjectLabel,
    deleteProjectLabel,

    // Project Invitations
    inviteProjectMember,
    getProjectInvitations,
    acceptProjectInvitation
};
