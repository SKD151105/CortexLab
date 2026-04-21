import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || "7d",
    });
};

// @desc Register new user
// @route POST /api/auth/register
// @access Public
export const register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists 
        const userExists = await User.findOne({ $or: [{ email, username }] });
        if (userExists) {
            return res.status(400).json({
                success: false,
                error:
                    userExists.email === email
                        ? 'Email already in use'
                        : 'Username already in use',
                statusCode: 400
            });
        }

        // Create new user
        const user = await User.create({ username, email, password });

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    profileImage: user.profileImage,
                    createdAt: user.createdAt
                },
                token,
            },
            message: 'User registered successfully',
        });

    } catch (error) {
        next(error);
    }
};

// @desc Login user
// @route POST /api/auth/login
// @access Public
export const login = async (req, res, next) => {
    try {

    } catch (error) {
        next(error);
    }
};

// @desc Get user profile
// @route GET /api/auth/profile
// @access Private
export const getProfile = async (req, res, next) => {
    try {

    } catch (error) {
        next(error);
    }
};

// @desc Update user profile
// @route PUT /api/auth/profile
// @access Private
export const updateProfile = async (req, res, next) => {
    try {

    } catch (error) {
        next(error);
    }
};

// @desc Change user password
// @route POST /api/auth/change-password
// @access Private
export const changePassword = async (req, res, next) => {
    try {

    } catch (error) {
        next(error);
    }
};