const taskGenerationService = require('./taskGeneration.service');

// Generate tasks
const generateTasks = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { prompt, count } = req.body;
        const userId = req.user.id;

        const result = await taskGenerationService.generateTasks(projectId, userId, prompt, count);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// Accept generated tasks
const acceptTasks = async (req, res, next) => {
    try {
        const { projectId, generationId } = req.params;
        const { task_indices } = req.body;
        const userId = req.user.id;

        const result = await taskGenerationService.acceptTasks(projectId, userId, generationId, task_indices);

        res.status(201).json({
            success: true,
            message: `${result.count} tasks created successfully`,
            data: result.created_tasks
        });
    } catch (error) {
        next(error);
    }
};

// Get generation history
const getGenerations = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;
        const filters = {
            page: req.query.page ? parseInt(req.query.page) : 1,
            limit: req.query.limit ? parseInt(req.query.limit) : 10
        };

        const result = await taskGenerationService.getGenerations(projectId, userId, filters);

        res.json({
            success: true,
            data: result.generations,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    generateTasks,
    acceptTasks,
    getGenerations
};
