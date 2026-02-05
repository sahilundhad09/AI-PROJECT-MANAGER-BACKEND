const express = require('express');
const router = express.Router();
const projectController = require('./project.controller');
const authenticate = require('../../shared/middleware/auth.middleware');
const { requireWorkspaceMembership } = require('../../shared/middleware/rbac.middleware');
const { validate } = require('../../shared/middleware/validator.middleware');
const {
    createProjectSchema,
    getWorkspaceProjectsSchema,
    getProjectByIdSchema,
    updateProjectSchema,
    archiveProjectSchema,
    deleteProjectSchema,
    addProjectMemberSchema,
    getProjectMembersSchema,
    updateProjectMemberRoleSchema,
    removeProjectMemberSchema,
    leaveProjectSchema,
    createTaskStatusSchema,
    getTaskStatusesSchema,
    updateTaskStatusSchema,
    deleteTaskStatusSchema,
    createProjectLabelSchema,
    getProjectLabelsSchema,
    updateProjectLabelSchema,
    deleteProjectLabelSchema
} = require('./project.validator');

// All routes require authentication
router.use(authenticate);

// ========== Project CRUD Routes ==========

// Create project in workspace
router.post(
    '/workspaces/:workspaceId/projects',
    requireWorkspaceMembership,
    validate(createProjectSchema),
    projectController.createProject
);

// Get all projects in workspace
router.get(
    '/workspaces/:workspaceId/projects',
    requireWorkspaceMembership,
    validate(getWorkspaceProjectsSchema),
    projectController.getWorkspaceProjects
);

// Get project by ID
router.get(
    '/projects/:projectId',
    validate(getProjectByIdSchema),
    projectController.getProjectById
);

// Update project
router.put(
    '/projects/:projectId',
    validate(updateProjectSchema),
    projectController.updateProject
);

// Archive/Unarchive project
router.patch(
    '/projects/:projectId/archive',
    validate(archiveProjectSchema),
    projectController.archiveProject
);

// Delete project
router.delete(
    '/projects/:projectId',
    validate(deleteProjectSchema),
    projectController.deleteProject
);

// ========== Project Member Routes ==========

// Add member to project
router.post(
    '/projects/:projectId/members',
    validate(addProjectMemberSchema),
    projectController.addProjectMember
);

// Get project members
router.get(
    '/projects/:projectId/members',
    validate(getProjectMembersSchema),
    projectController.getProjectMembers
);

// Update project member role
router.put(
    '/projects/:projectId/members/:memberId',
    validate(updateProjectMemberRoleSchema),
    projectController.updateProjectMemberRole
);

// Remove member from project
router.delete(
    '/projects/:projectId/members/:memberId',
    validate(removeProjectMemberSchema),
    projectController.removeProjectMember
);

// Leave project
router.post(
    '/projects/:projectId/leave',
    validate(leaveProjectSchema),
    projectController.leaveProject
);

// ========== Task Status Routes (Kanban Columns) ==========

// Create task status
router.post(
    '/projects/:projectId/statuses',
    validate(createTaskStatusSchema),
    projectController.createTaskStatus
);

// Get task statuses
router.get(
    '/projects/:projectId/statuses',
    validate(getTaskStatusesSchema),
    projectController.getTaskStatuses
);

// Update task status
router.put(
    '/projects/:projectId/statuses/:statusId',
    validate(updateTaskStatusSchema),
    projectController.updateTaskStatus
);

// Delete task status
router.delete(
    '/projects/:projectId/statuses/:statusId',
    validate(deleteTaskStatusSchema),
    projectController.deleteTaskStatus
);

// ========== Project Label Routes ==========

// Create label
router.post(
    '/projects/:projectId/labels',
    validate(createProjectLabelSchema),
    projectController.createProjectLabel
);

// Get labels
router.get(
    '/projects/:projectId/labels',
    validate(getProjectLabelsSchema),
    projectController.getProjectLabels
);

// Update label
router.put(
    '/projects/:projectId/labels/:labelId',
    validate(updateProjectLabelSchema),
    projectController.updateProjectLabel
);

// Delete label
router.delete(
    '/projects/:projectId/labels/:labelId',
    validate(deleteProjectLabelSchema),
    projectController.deleteProjectLabel
);

module.exports = router;
