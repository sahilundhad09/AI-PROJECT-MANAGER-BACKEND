const authService = require('./auth.service');
const emailService = require('../../shared/services/email.service');

class AuthController {
    /**
     * Register a new user
     * POST /api/v1/auth/register
     */
    async register(req, res, next) {
        try {
            const result = await authService.register(req.body);

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Login user
     * POST /api/v1/auth/login
     */
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);

            // Send login notification (non-blocking)
            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.get('user-agent');
            emailService.sendLoginNotification(
                result.user.email,
                result.user.name,
                ipAddress,
                userAgent
            ).catch(err => {
                console.error('Failed to send login notification:', err.message);
            });

            res.json({
                success: true,
                message: 'Login successful',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Refresh access token
     * POST /api/v1/auth/refresh
     */
    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const result = await authService.refreshToken(refreshToken);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Logout user
     * POST /api/v1/auth/logout
     */
    async logout(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const result = await authService.logout(refreshToken);

            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get current user profile
     * GET /api/v1/auth/profile
     */
    async getProfile(req, res, next) {
        try {
            const user = await authService.getProfile(req.user.id);

            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update user profile
     * PUT /api/v1/auth/profile
     */
    async updateProfile(req, res, next) {
        try {
            const user = await authService.updateProfile(req.user.id, req.body);

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Change password
     * POST /api/v1/auth/change-password
     */
    async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body;
            const result = await authService.changePassword(req.user.id, currentPassword, newPassword);

            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();
