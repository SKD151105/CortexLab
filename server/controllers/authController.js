import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import RefreshToken from '../models/RefreshToken.js';
import User from '../models/User.js';

const ACCESS_TOKEN_EXPIRE = process.env.JWT_EXPIRE || '15m';
const REFRESH_TOKEN_EXPIRE_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRE_DAYS || 30);

const sanitizeUser = (user) => ({
    id: user._id,
    username: user.username,
    email: user.email,
    profileImage: user.profileImage,
    createdAt: user.createdAt,
});

const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRE,
    });
};

const generateRefreshTokenValue = () => crypto.randomBytes(64).toString('hex');

const getClientMeta = (req) => ({
    userAgent: req.get('user-agent') || '',
    ipAddress: req.ip || req.connection?.remoteAddress || '',
});

const issueAuthTokens = async (userId, req) => {
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshTokenValue();
    const tokenHash = RefreshToken.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60 * 1000);
    const { userAgent, ipAddress } = getClientMeta(req);

    await RefreshToken.create({
        userId,
        tokenHash,
        expiresAt,
        userAgent,
        ipAddress,
    });

    return { accessToken, refreshToken };
};

// @desc Register new user
// @route POST /api/auth/register
// @access Public
export const register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body || {};

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

        const { accessToken, refreshToken } = await issueAuthTokens(user._id, req);
        const userData = sanitizeUser(user);

        res.status(201).json({
            success: true,
            data: {
                user: userData,
                token: accessToken,
                accessToken,
                refreshToken,
            },
            user: userData,
            token: accessToken,
            accessToken,
            refreshToken,
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
        const { email, password } = req.body || {};

        // Validate user
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Please provide email and password',
                statusCode: 400
            });
        }

        // Find user by email (include password for verification)
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                statusCode: 401
            });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                statusCode: 401
            });
        }

        const { accessToken, refreshToken } = await issueAuthTokens(user._id, req);
        const userData = sanitizeUser(user);

        res.status(200).json({
            success: true,
            user: userData,
            data: {
                user: userData,
                token: accessToken,
                accessToken,
                refreshToken,
            },
            token: accessToken,
            accessToken,
            refreshToken,
            message: 'Login successful'
        });

    } catch (error) {
        next(error);
    }
};

// @desc Get user profile
// @route GET /api/auth/profile
// @access Private
export const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });

    } catch (error) {
        next(error);
    }
};

// @desc Update user profile
// @route PUT /api/auth/profile
// @access Private
export const updateProfile = async (req, res, next) => {
    try {
        const { username, email, profileImage } = req.body || {};
        const user = await User.findById(req.user._id);

        if (username) user.username = username;
        if (email) user.email = email;
        if (profileImage) user.profileImage = profileImage;

        await user.save();

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            },
            message: 'Profile updated successfully'
        });

    } catch (error) {
        next(error);
    }
};

// @desc Change user password
// @route POST /api/auth/change-password
// @access Private
export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body || {};
        const user = await User.findById(req.user._id).select('+password');

        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Please provide current and new password',
                statusCode: 400
            });
        }

        // Check if current password matches        
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Current password is incorrect',
                statusCode: 401
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();
        await RefreshToken.deleteMany({ userId: user._id });

        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });

    } catch (error) {
        next(error);
    }
};

// @desc Refresh access token
// @route POST /api/auth/refresh-token
// @access Public
export const refreshAccessToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body || {};

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                error: 'Refresh token is required',
                statusCode: 400,
            });
        }

        const tokenHash = RefreshToken.hashToken(refreshToken);
        const storedToken = await RefreshToken.findOne({
            tokenHash,
            revokedAt: null,
            expiresAt: { $gt: new Date() },
        });

        if (!storedToken) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired refresh token',
                statusCode: 401,
            });
        }

        const user = await User.findById(storedToken.userId);
        if (!user) {
            await RefreshToken.deleteOne({ _id: storedToken._id });
            return res.status(401).json({
                success: false,
                error: 'User not found',
                statusCode: 401,
            });
        }

        storedToken.revokedAt = new Date();
        await storedToken.save();

        const { accessToken, refreshToken: rotatedRefreshToken } = await issueAuthTokens(user._id, req);
        const userData = sanitizeUser(user);

        res.status(200).json({
            success: true,
            user: userData,
            token: accessToken,
            accessToken,
            refreshToken: rotatedRefreshToken,
            message: 'Token refreshed successfully',
        });
    } catch (error) {
        next(error);
    }
};

// @desc Logout user and revoke refresh token
// @route POST /api/auth/logout
// @access Private
export const logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body || {};

        if (refreshToken) {
            const tokenHash = RefreshToken.hashToken(refreshToken);
            await RefreshToken.deleteOne({ tokenHash, userId: req.user._id });
        } else {
            await RefreshToken.deleteMany({ userId: req.user._id });
        }

        res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        next(error);
    }
};