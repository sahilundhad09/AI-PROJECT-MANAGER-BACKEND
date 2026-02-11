const analyticsService = require('./analytics.service');

class AnalyticsController {
    /**
     * Get project analytics/dashboard
     * GET /api/v1/projects/:projectId/analytics
     */
    async getProjectAnalytics(req, res, next) {
        try {
            const analytics = await analyticsService.getProjectAnalytics(
                req.params.projectId,
                req.user.id
            );

            res.json({
                success: true,
                data: analytics
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get workspace analytics/overview
     * GET /api/v1/workspaces/:workspaceId/analytics
     */
    async getWorkspaceAnalytics(req, res, next) {
        try {
            const analytics = await analyticsService.getWorkspaceAnalytics(
                req.params.workspaceId,
                req.user.id
            );

            res.json({
                success: true,
                data: analytics
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get user performance metrics
     * GET /api/v1/users/me/performance
     */
    async getUserPerformance(req, res, next) {
        try {
            const performance = await analyticsService.getUserPerformance(req.user.id);

            res.json({
                success: true,
                data: performance
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Analyze workspace with AI
     * GET /api/v1/workspaces/:workspaceId/analyze
     */
    async analyzeWorkspace(req, res, next) {
        try {
            const analysis = await analyticsService.analyzeWorkspace(
                req.params.workspaceId,
                req.user.id
            );

            res.json({
                success: true,
                data: analysis
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AnalyticsController();
