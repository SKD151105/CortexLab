import express from 'express';
import { body } from 'express-validator';
import {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    refreshAccessToken,
    logout,
} from '../controllers/authController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const registerValidation = [
    body('username')
        .trim()
        .isLength({ min: 3 })
        .withMessage('Username must be at least 3 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
];

const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

    const refreshValidation = [
        body('refreshToken')
        .notEmpty()
        .withMessage('Refresh token is required')
    ];

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh-token', refreshValidation, refreshAccessToken);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);
router.post('/logout', protect, logout);

export default router;
