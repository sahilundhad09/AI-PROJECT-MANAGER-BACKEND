const { z } = require('zod');

// Register validation schema
const registerSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters').max(120),
        email: z.string().email('Invalid email address'),
        password: z.string().min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number')
    })
});

// Login validation schema
const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(1, 'Password is required')
    })
});

// Refresh token validation schema
const refreshTokenSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(1, 'Refresh token is required')
    })
});

// Update profile validation schema
const updateProfileSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(120).optional(),
        phone: z.string().max(20).optional().nullable().or(z.literal('')),
        avatar_url: z.string().url().optional().nullable().or(z.literal(''))
    })
});

// Change password validation schema
const changePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z.string().min(8, 'New password must be at least 8 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number')
    })
});

// Forgot password validation schema
const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address')
    })
});

// Verify reset OTP validation schema
const verifyResetOTPSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        otp: z.string().length(6, 'OTP must be 6 digits')
    })
});

// Reset password validation schema
const resetPasswordSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        otp: z.string().length(6, 'OTP must be 6 digits'),
        newPassword: z.string().min(8, 'New password must be at least 8 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number')
    })
});

module.exports = {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
    updateProfileSchema,
    changePasswordSchema,
    forgotPasswordSchema,
    verifyResetOTPSchema,
    resetPasswordSchema
};
