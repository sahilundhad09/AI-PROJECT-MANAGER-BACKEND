const taskService = require('./task.service');

// Task CRUD Controllers

const createTask = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;
        const task = await taskService.createTask(projectId, userId, req.body);
        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            data: task
        });
    } catch (error) {
        next(error);
    }
};

const getProjectTasks = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;
        const result = await taskService.getProjectTasks(projectId, userId, req.query);
        res.json({
            success: true,
            data: result.tasks,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

const getTaskDetails = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.id;
        const task = await taskService.getTaskById(taskId, userId);
        res.json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
};

const updateTask = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.id;
        const task = await taskService.updateTask(taskId, userId, req.body);
        res.json({
            success: true,
            message: 'Task updated successfully',
            data: task
        });
    } catch (error) {
        next(error);
    }
};

const moveTask = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const { status_id, position } = req.body;
        const userId = req.user.id;
        const task = await taskService.moveTask(taskId, status_id, position, userId);
        res.json({
            success: true,
            message: 'Task moved successfully',
            data: task
        });
    } catch (error) {
        next(error);
    }
};

const archiveTask = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const { archived } = req.body;
        const userId = req.user.id;
        const task = await taskService.archiveTask(taskId, userId, archived);
        res.json({
            success: true,
            message: archived ? 'Task archived successfully' : 'Task unarchived successfully',
            data: task
        });
    } catch (error) {
        next(error);
    }
};

const deleteTask = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.id;
        await taskService.deleteTask(taskId, userId);
        res.json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Task Assignee Controllers

const assignMembers = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const { project_member_ids } = req.body;
        const userId = req.user.id;
        const assignees = await taskService.assignMembers(taskId, project_member_ids, userId);
        res.status(201).json({
            success: true,
            message: 'Members assigned successfully',
            data: assignees
        });
    } catch (error) {
        next(error);
    }
};

const getTaskAssignees = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const assignees = await taskService.getAssignees(taskId);
        res.json({
            success: true,
            data: assignees
        });
    } catch (error) {
        next(error);
    }
};

const removeAssignee = async (req, res, next) => {
    try {
        const { taskId, assigneeId } = req.params;
        const userId = req.user.id;
        await taskService.removeAssignee(taskId, assigneeId, userId);
        res.json({
            success: true,
            message: 'Assignee removed successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Task Dependency Controllers

const addDependency = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const { depends_on_task_id, dependency_type } = req.body;
        const userId = req.user.id;
        const dependency = await taskService.addDependency(taskId, depends_on_task_id, dependency_type, userId);
        res.status(201).json({
            success: true,
            message: 'Dependency added successfully',
            data: dependency
        });
    } catch (error) {
        next(error);
    }
};

const getTaskDependencies = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const dependencies = await taskService.getDependencies(taskId);
        res.json({
            success: true,
            data: dependencies
        });
    } catch (error) {
        next(error);
    }
};

const removeDependency = async (req, res, next) => {
    try {
        const { taskId, dependencyId } = req.params;
        const userId = req.user.id;
        await taskService.removeDependency(taskId, dependencyId, userId);
        res.json({
            success: true,
            message: 'Dependency removed successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Task Tag Controllers

const addTags = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const { label_ids } = req.body;
        const userId = req.user.id;
        const tags = await taskService.addTags(taskId, label_ids, userId);
        res.status(201).json({
            success: true,
            message: 'Tags added successfully',
            data: tags
        });
    } catch (error) {
        next(error);
    }
};

const getTaskTags = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const tags = await taskService.getTags(taskId);
        res.json({
            success: true,
            data: tags
        });
    } catch (error) {
        next(error);
    }
};

const removeTag = async (req, res, next) => {
    try {
        const { taskId, tagId } = req.params;
        const userId = req.user.id;
        await taskService.removeTag(taskId, tagId, userId);
        res.json({
            success: true,
            message: 'Tag removed successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Search & Filter Controllers

const searchTasks = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { q, ...filters } = req.query;
        const result = await taskService.searchTasks(projectId, q, filters);
        res.json({
            success: true,
            data: result.tasks,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

const getMyTasks = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const result = await taskService.getMyTasks(userId, req.query);
        res.json({
            success: true,
            data: result.tasks,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

// Subtask Controllers

const createSubtask = async (req, res, next) => {
    try {
        const { parentTaskId } = req.params;
        const userId = req.user.id;
        const subtask = await taskService.createSubtask(parentTaskId, userId, req.body);
        res.status(201).json({
            success: true,
            message: 'Subtask created successfully',
            data: subtask
        });
    } catch (error) {
        next(error);
    }
};

const getSubtasks = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const subtasks = await taskService.getSubtasks(taskId);
        res.json({
            success: true,
            data: subtasks
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createTask,
    getProjectTasks,
    getTaskDetails,
    updateTask,
    moveTask,
    archiveTask,
    deleteTask,
    assignMembers,
    getTaskAssignees,
    removeAssignee,
    addDependency,
    getTaskDependencies,
    removeDependency,
    addTags,
    getTaskTags,
    removeTag,
    searchTasks,
    getMyTasks,
    createSubtask,
    getSubtasks
};
