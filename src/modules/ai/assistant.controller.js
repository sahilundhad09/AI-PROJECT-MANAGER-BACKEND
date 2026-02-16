const assistantService = require('./assistant.service');

// Detail a task
const detailTask = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { title, description } = req.body;
        const userId = req.user.id;

        const result = await assistantService.detailTask(projectId, userId, {
            title,
            currentDescription: description
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// Summarize comments
const summarizeComments = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { comments } = req.body;
        const userId = req.user.id;

        const result = await assistantService.summarizeComments(projectId, userId, comments);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    detailTask,
    summarizeComments
};
