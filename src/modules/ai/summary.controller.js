const summaryService = require('./summary.service');

// Generate project summary
const generateSummary = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { summary_type, date_range_start, date_range_end } = req.body;
        const userId = req.user.id;

        const result = await summaryService.generateSummary(
            projectId,
            userId,
            summary_type,
            date_range_start,
            date_range_end
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// Get project summaries
const getSummaries = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;
        const filters = {
            page: req.query.page ? parseInt(req.query.page) : 1,
            limit: req.query.limit ? parseInt(req.query.limit) : 10,
            summary_type: req.query.summary_type
        };

        const result = await summaryService.getSummaries(projectId, userId, filters);

        res.json({
            success: true,
            data: result.summaries,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    generateSummary,
    getSummaries
};
