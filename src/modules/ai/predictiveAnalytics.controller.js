const predictiveAnalyticsService = require('./predictiveAnalytics.service');

const getProjectPulse = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const result = await predictiveAnalyticsService.analyzeProjectPulse(projectId);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProjectPulse
};
