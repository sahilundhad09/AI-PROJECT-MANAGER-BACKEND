const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const authValidator = require('./auth.validator');
const { validate } = require('../../shared/middleware/validator.middleware');
const authenticate = require('../../shared/middleware/auth.middleware');
const upload = require('../../shared/utils/fileUpload');

// Public routes
router.post('/register', validate(authValidator.registerSchema), authController.register);
router.post('/login', validate(authValidator.loginSchema), authController.login);
router.post('/refresh-token', validate(authValidator.refreshTokenSchema), authController.refreshToken);
router.post('/logout', authController.logout);

// Password recovery routes
router.post('/forgot-password', validate(authValidator.forgotPasswordSchema), authController.forgotPassword);
router.post('/verify-reset-otp', validate(authValidator.verifyResetOTPSchema), authController.verifyResetOTP);
router.post('/reset-password', validate(authValidator.resetPasswordSchema), authController.resetPassword);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, validate(authValidator.updateProfileSchema), authController.updateProfile);
router.post('/change-password', authenticate, validate(authValidator.changePasswordSchema), authController.changePassword);

// Image Upload
router.post('/profile/avatar', authenticate, upload.single('avatar'), authController.updateAvatar);

module.exports = router;
