const express = require('express');
const router = express.Router();
const taskController = require('./task.controller');
const authenticate = require('../../shared/middleware/auth.middleware');
const { validate } = require('../../shared/middleware/validator.middleware');
const taskValidator = require('./task.validator');

// Task CRUD Routes

// Create task
router.post(
    '/projects/:projectId/tasks',
    authenticate,
    validate(taskValidator.createTaskSchema),
    taskController.createTask
);

// Get project tasks
router.get(
    '/projects/:projectId/tasks',
    authenticate,
    validate(taskValidator.getProjectTasksSchema),
    taskController.getProjectTasks
);

// Get my tasks (cross-project) - MUST come before /tasks/:taskId
router.get(
    '/tasks/my-tasks',
    authenticate,
    validate(taskValidator.getMyTasksSchema),
    taskController.getMyTasks
);

// Get task details
router.get(
    '/tasks/:taskId',
    authenticate,
    validate(taskValidator.getTaskDetailsSchema),
    taskController.getTaskDetails
);

// Update task
router.put(
    '/tasks/:taskId',
    authenticate,
    validate(taskValidator.updateTaskSchema),
    taskController.updateTask
);

// Move task (drag & drop)
router.patch(
    '/tasks/:taskId/move',
    authenticate,
    validate(taskValidator.moveTaskSchema),
    taskController.moveTask
);

// Archive/unarchive task
router.patch(
    '/tasks/:taskId/archive',
    authenticate,
    validate(taskValidator.archiveTaskSchema),
    taskController.archiveTask
);

// Delete task
router.delete(
    '/tasks/:taskId',
    authenticate,
    validate(taskValidator.deleteTaskSchema),
    taskController.deleteTask
);

// Task Assignee Routes

// Assign members to task
router.post(
    '/tasks/:taskId/assignees',
    authenticate,
    validate(taskValidator.assignMembersSchema),
    taskController.assignMembers
);

// Get task assignees
router.get(
    '/tasks/:taskId/assignees',
    authenticate,
    validate(taskValidator.getTaskAssigneesSchema),
    taskController.getTaskAssignees
);

// Remove assignee
router.delete(
    '/tasks/:taskId/assignees/:assigneeId',
    authenticate,
    validate(taskValidator.removeAssigneeSchema),
    taskController.removeAssignee
);

// Task Dependency Routes

// Add dependency
router.post(
    '/tasks/:taskId/dependencies',
    authenticate,
    validate(taskValidator.addDependencySchema),
    taskController.addDependency
);

// Get task dependencies
router.get(
    '/tasks/:taskId/dependencies',
    authenticate,
    validate(taskValidator.getTaskDependenciesSchema),
    taskController.getTaskDependencies
);

// Remove dependency
router.delete(
    '/tasks/:taskId/dependencies/:dependencyId',
    authenticate,
    validate(taskValidator.removeDependencySchema),
    taskController.removeDependency
);

// Task Tag Routes

// Add tags to task
router.post(
    '/tasks/:taskId/tags',
    authenticate,
    validate(taskValidator.addTagsSchema),
    taskController.addTags
);

// Get task tags
router.get(
    '/tasks/:taskId/tags',
    authenticate,
    validate(taskValidator.getTaskTagsSchema),
    taskController.getTaskTags
);

// Remove tag from task
router.delete(
    '/tasks/:taskId/tags/:tagId',
    authenticate,
    validate(taskValidator.removeTagSchema),
    taskController.removeTag
);

// Search & Filter Routes

// Search tasks in project
router.get(
    '/projects/:projectId/tasks/search',
    authenticate,
    validate(taskValidator.searchTasksSchema),
    taskController.searchTasks
);

// Subtask Routes

// Create subtask
router.post(
    '/tasks/:parentTaskId/subtasks',
    authenticate,
    validate(taskValidator.createSubtaskSchema),
    taskController.createSubtask
);

// Get subtasks
router.get(
    '/tasks/:taskId/subtasks',
    authenticate,
    validate(taskValidator.getSubtasksSchema),
    taskController.getSubtasks
);

module.exports = router;
