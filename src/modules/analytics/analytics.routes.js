const express = require('express');
const router = express.Router();
const analyticsController = require('./analytics.controller');
const authenticate = require('../../shared/middleware/auth.middleware');

/**
 * @route   GET /api/v1/projects/:projectId/analytics
 * @desc    Get project dashboard analytics
 * @access  Private (project member)
 */
router.get(
    '/projects/:projectId/analytics',
    authenticate,
    analyticsController.getProjectAnalytics
);

/**
 * @route   GET /api/v1/workspaces/:workspaceId/analytics
 * @desc    Get workspace overview analytics
 * @access  Private (workspace member)
 */
router.get(
    '/workspaces/:workspaceId/analytics',
    authenticate,
    analyticsController.getWorkspaceAnalytics
);

/**
 * @route   GET /api/v1/users/me/performance
 * @desc    Get user performance metrics
 * @access  Private
 */
router.get(
    '/users/me/performance',
    authenticate,
    analyticsController.getUserPerformance
);

/**
 * @route   GET /api/v1/workspaces/:workspaceId/analyze
 * @desc    Analyze workspace with AI
 * @access  Private (workspace member)
 */
router.get(
    '/workspaces/:workspaceId/analyze',
    authenticate,
    analyticsController.analyzeWorkspace
);

/**
 * @route   GET /api/v1/analytics/growth/me
 * @desc    Get personal growth metrics
 * @access  Private
 */
router.get(
    '/analytics/growth/me',
    authenticate,
    analyticsController.getIndividualGrowth
);

/**
 * @route   GET /api/v1/workspaces/:workspaceId/analytics/growth
 * @desc    Get workspace-wide member growth
 * @access  Private (Owner/Admin)
 */
router.get(
    '/workspaces/:workspaceId/analytics/growth',
    authenticate,
    analyticsController.getWorkspaceGrowth
);

/**
 * @route   GET /api/v1/projects/:projectId/analytics/growth
 * @desc    Get project-specific member growth
 * @access  Private (Project Lead)
 */
router.get(
    '/projects/:projectId/analytics/growth',
    authenticate,
    analyticsController.getProjectGrowth
);

module.exports = router;
