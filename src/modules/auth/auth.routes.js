const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');
const { validateBody } = require('../../shared/middleware/validator.middleware');
const { authLimiter } = require('../../shared/middleware/rateLimiter.middleware');
const {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
    updateProfileSchema,
    changePasswordSchema
} = require('./auth.validator');

// Public routes (with rate limiting)
router.post('/register', authLimiter, validateBody(registerSchema), authController.register);
router.post('/login', authLimiter, validateBody(loginSchema), authController.login);
router.post('/refresh', validateBody(refreshTokenSchema), authController.refreshToken);
router.post('/logout', validateBody(refreshTokenSchema), authController.logout);

// Protected routes (require authentication)
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, validateBody(updateProfileSchema), authController.updateProfile);
router.post('/change-password', authMiddleware, validateBody(changePasswordSchema), authController.changePassword);

module.exports = router;
