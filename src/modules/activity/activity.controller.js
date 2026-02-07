const activityService = require('./activity.service');

// Get workspace activity
const getWorkspaceActivity = async (req, res, next) => {
    try {
        const { workspaceId } = req.params;
        const userId = req.user.id;
        const filters = {
            page: req.query.page ? parseInt(req.query.page) : 1,
            limit: req.query.limit ? parseInt(req.query.limit) : 50
        };

        const result = await activityService.getWorkspaceActivity(workspaceId, userId, filters);
        res.json({
            success: true,
            data: result.activities,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

// Get project activity
const getProjectActivity = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;
        const filters = {
            page: req.query.page ? parseInt(req.query.page) : 1,
            limit: req.query.limit ? parseInt(req.query.limit) : 50
        };

        const result = await activityService.getProjectActivity(projectId, userId, filters);
        res.json({
            success: true,
            data: result.activities,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

// Get task activity
const getTaskActivity = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.id;
        const activities = await activityService.getTaskActivity(taskId, userId);
        res.json({
            success: true,
            data: activities
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getWorkspaceActivity,
    getProjectActivity,
    getTaskActivity
};
