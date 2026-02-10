const jwt = require('jsonwebtoken');
const { User, RefreshToken } = require('../../database/models');
const { jwtSecret, jwtRefreshSecret, jwtExpiresIn, jwtRefreshExpiresIn } = require('../../config/jwt');
const { hashPassword, comparePassword, generateToken } = require('../../shared/utils/helpers');
const emailService = require('../../shared/services/email.service');

class AuthService {
    /**
     * Register a new user
     */
    async register(userData) {
        const { name, email, password } = userData;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            const error = new Error('User with this email already exists');
            error.statusCode = 409;
            throw error;
        }

        // Hash password
        const password_hash = await hashPassword(password);

        // Create user
        const user = await User.create({
            name,
            email,
            password_hash
        });

        // Generate tokens
        const tokens = await this.generateTokens(user.id);

        // Send welcome email (non-blocking)
        emailService.sendWelcomeEmail(user.email, user.name).catch(err => {
            console.error('Failed to send welcome email:', err.message);
        });

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar_url: user.avatar_url,
                is_verified: user.is_verified
            },
            ...tokens
        };
    }

    /**
     * Login user
     */
    async login(email, password) {
        // Find user
        const user = await User.findOne({ where: { email } });
        if (!user) {
            const error = new Error('Invalid credentials');
            error.statusCode = 401;
            throw error;
        }

        // Check password
        const isPasswordValid = await comparePassword(password, user.password_hash);
        if (!isPasswordValid) {
            const error = new Error('Invalid credentials');
            error.statusCode = 401;
            throw error;
        }

        // Check if user is active
        if (user.status !== 'active') {
            const error = new Error('Account is not active');
            error.statusCode = 403;
            throw error;
        }

        // Update last login
        await user.update({ last_login_at: new Date() });

        // Generate tokens
        const tokens = await this.generateTokens(user.id);

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar_url: user.avatar_url,
                is_verified: user.is_verified
            },
            ...tokens
        };
    }

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken) {
        try {
            // Verify refresh token
            const decoded = jwt.verify(refreshToken, jwtRefreshSecret);

            // Check if refresh token exists and is not revoked
            const tokenRecord = await RefreshToken.findOne({
                where: {
                    token: refreshToken,
                    user_id: decoded.userId,
                    revoked_at: null
                }
            });

            if (!tokenRecord) {
                const error = new Error('Invalid refresh token');
                error.statusCode = 401;
                throw error;
            }

            // Check if token is expired
            if (new Date() > tokenRecord.expires_at) {
                const error = new Error('Refresh token expired');
                error.statusCode = 401;
                throw error;
            }

            // Generate new access token
            const accessToken = this.generateAccessToken(decoded.userId);

            return { accessToken };
        } catch (error) {
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                const err = new Error('Invalid refresh token');
                err.statusCode = 401;
                throw err;
            }
            throw error;
        }
    }

    /**
     * Logout user (revoke refresh token)
     */
    async logout(refreshToken) {
        const tokenRecord = await RefreshToken.findOne({
            where: { token: refreshToken }
        });

        if (tokenRecord) {
            await tokenRecord.update({ revoked_at: new Date() });
        }

        return { message: 'Logged out successfully' };
    }

    /**
     * Get user profile
     */
    async getProfile(userId) {
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password_hash'] }
        });

        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        return user;
    }

    /**
     * Update user profile
     */
    async updateProfile(userId, updateData) {
        const user = await User.findByPk(userId);

        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        // Don't allow updating email or password through this method
        delete updateData.email;
        delete updateData.password;
        delete updateData.password_hash;

        await user.update(updateData);

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar_url: user.avatar_url,
            phone: user.phone
        };
    }

    /**
     * Change password
     */
    async changePassword(userId, currentPassword, newPassword) {
        const user = await User.findByPk(userId);

        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        // Verify current password
        const isPasswordValid = await comparePassword(currentPassword, user.password_hash);
        if (!isPasswordValid) {
            const error = new Error('Current password is incorrect');
            error.statusCode = 401;
            throw error;
        }

        // Hash new password
        const password_hash = await hashPassword(newPassword);

        // Update password
        await user.update({ password_hash });

        // Revoke all refresh tokens
        await RefreshToken.update(
            { revoked_at: new Date() },
            { where: { user_id: userId, revoked_at: null } }
        );

        return { message: 'Password changed successfully' };
    }

    /**
     * Generate access and refresh tokens
     */
    async generateTokens(userId) {
        const accessToken = this.generateAccessToken(userId);
        const refreshToken = this.generateRefreshToken(userId);

        // Calculate expiry date (7 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Revoke old refresh tokens for this user to prevent duplicates
        await RefreshToken.update(
            { revoked_at: new Date() },
            { where: { user_id: userId, revoked_at: null } }
        );

        // Store new refresh token
        await RefreshToken.create({
            user_id: userId,
            token: refreshToken,
            expires_at: expiresAt
        });

        return { accessToken, refreshToken };
    }

    /**
     * Generate access token
     */
    generateAccessToken(userId) {
        return jwt.sign({ userId }, jwtSecret, { expiresIn: jwtExpiresIn });
    }

    /**
     * Generate refresh token
     */
    generateRefreshToken(userId) {
        return jwt.sign({ userId }, jwtRefreshSecret, { expiresIn: jwtRefreshExpiresIn });
    }
}

module.exports = new AuthService();
