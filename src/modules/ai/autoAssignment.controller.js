const autoAssignmentService = require('./autoAssignment.service');

const suggestAssignment = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { taskId, title, description } = req.body;
        const userId = req.user.id;

        const result = await autoAssignmentService.suggestAssignment(projectId, userId, taskId, {
            title,
            description
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    suggestAssignment
};
