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
     * POST /api/v1/auth/refresh-token
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

    /**
     * Forgot password
     * POST /api/v1/auth/forgot-password
     */
    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            const result = await authService.forgotPassword(email);

            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Verify reset OTP
     * POST /api/v1/auth/verify-reset-otp
     */
    async verifyResetOTP(req, res, next) {
        try {
            const { email, otp } = req.body;
            const result = await authService.verifyResetOTP(email, otp);

            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Reset password
     * POST /api/v1/auth/reset-password
     */
    async resetPassword(req, res, next) {
        try {
            const { email, otp, newPassword } = req.body;
            const result = await authService.resetPassword(email, otp, newPassword);

            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update user avatar
     * POST /api/v1/auth/profile/avatar
     */
    async updateAvatar(req, res, next) {
        try {
            if (!req.file) {
                const error = new Error('No avatar file provided');
                error.statusCode = 400;
                throw error;
            }

            const avatarUrl = req.file.path; // Cloudinary URL returned by multer-storage-cloudinary
            const user = await authService.updateAvatar(req.user.id, avatarUrl);

            res.json({
                success: true,
                message: 'Avatar updated successfully',
                data: user
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();
