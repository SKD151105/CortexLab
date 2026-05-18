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
    authProvider: user.authProvider,
    profileImage: user.profileImage,
    createdAt: user.createdAt,
});

const ensureGoogleClientId = () => {
    if (!process.env.GOOGLE_CLIENT_ID) {
        const error = new Error('Google OAuth is not configured');
        error.statusCode = 503;
        throw error;
    }
};

const verifyGoogleCredential = async (credential) => {
    ensureGoogleClientId();

    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);

    if (!response.ok) {
        const error = new Error('Invalid Google credential');
        error.statusCode = 401;
        throw error;
    }

    const payload = await response.json();

    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
        const error = new Error('Google credential audience mismatch');
        error.statusCode = 401;
        throw error;
    }

    if (!payload.email || payload.email_verified !== 'true') {
        const error = new Error('Google account email is not verified');
        error.statusCode = 401;
        throw error;
    }

    return payload;
};

const createUsernameFromEmail = async (email) => {
    const normalizedBase = email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') || 'cortexlab';

    let username = normalizedBase.slice(0, 20);
    let suffix = 1;

    while (await User.findOne({ username })) {
        username = `${normalizedBase.slice(0, 16)}${suffix}`;
        suffix += 1;
    }

    return username;
};

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
export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body || {};
        const normalizedEmail = email?.toLowerCase?.().trim();
        const normalizedUsername = username?.trim?.();

        if (!normalizedEmail || !normalizedUsername || !password) {
            return res.status(400).json({
                success: false,
                error: 'Please provide username, email, and password',
                statusCode: 400
            });
        }

        // Check if user already exists 
        const userExists = await User.findOne({
            $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
        });
        if (userExists) {
            return res.status(400).json({
                success: false,
                error:
                    userExists.email === normalizedEmail
                        ? 'Email already in use'
                        : 'Username already in use',
                statusCode: 400
            });
        }

        // Create new user
        const user = await User.create({
            username: normalizedUsername,
            email: normalizedEmail,
            password,
        });

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
        throw error;
    }
};

// @desc Login user
// @route POST /api/auth/login
// @access Public
export const login = async (req, res) => {
    try {
        const { email, password } = req.body || {};
        const normalizedEmail = email?.toLowerCase?.().trim();

        // Validate user
        if (!normalizedEmail || !password) {
            return res.status(400).json({
                success: false,
                error: 'Please provide email and password',
                statusCode: 400
            });
        }

        // Find user by email (include password for verification)
        const user = await User.findOne({ email: normalizedEmail }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                statusCode: 401
            });
        }

        if (user.authProvider === 'google' && !user.password) {
            return res.status(401).json({
                success: false,
                error: 'This account uses Google sign-in',
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
        throw error;
    }
};

// @desc Sign in/up with Google
// @route POST /api/auth/google
// @access Public
export const googleAuth = async (req, res) => {
    try {
        const { credential, intent = 'login' } = req.body || {};

        if (!credential) {
            return res.status(400).json({
                success: false,
                error: 'Google credential is required',
                statusCode: 400
            });
        }

        if (!['login', 'register'].includes(intent)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid Google auth intent',
                statusCode: 400
            });
        }

        const payload = await verifyGoogleCredential(credential);
        const email = payload.email.toLowerCase();
        let user = await User.findOne({ email });

        if (intent === 'login') {
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'No Google account found for this email. Sign up with Google first.',
                    statusCode: 404
                });
            }

            if (!user.googleId || user.authProvider !== 'google') {
                return res.status(409).json({
                    success: false,
                    error: 'This account is not registered with Google. Sign in with email and password.',
                    statusCode: 409
                });
            }
        }

        if (!user) {
            user = await User.create({
                username: await createUsernameFromEmail(email),
                email,
                googleId: payload.sub,
                authProvider: 'google',
                profileImage: payload.picture || null,
            });
        } else if (!user.googleId || user.authProvider !== 'google') {
            return res.status(409).json({
                success: false,
                error:
                    intent === 'register'
                        ? 'An account with this email already exists. Sign in with email and password.'
                        : 'This account is not registered with Google. Sign in with email and password.',
                statusCode: 409
            });
        } else if (user.googleId && user.googleId !== payload.sub) {
            return res.status(409).json({
                success: false,
                error: 'Google account does not match the existing user',
                statusCode: 409
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
            message: 'Google sign-in successful'
        });
    } catch (error) {
        throw error;
    }
};

// @desc Get user profile
// @route GET /api/auth/profile
// @access Private
export const getProfile = async (req, res) => {
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
        throw error;
    }
};

// @desc Update user profile
// @route PUT /api/auth/profile
// @access Private
export const updateProfile = async (req, res) => {
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
        throw error;
    }
};

// @desc Change user password
// @route POST /api/auth/change-password
// @access Private
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body || {};
        const user = await User.findById(req.user._id).select('+password');

        if (!user.password) {
            return res.status(400).json({
                success: false,
                error: 'This account does not have a local password yet',
                statusCode: 400
            });
        }

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
        throw error;
    }
};

// @desc Refresh access token
// @route POST /api/auth/refresh-token
// @access Public
export const refreshAccessToken = async (req, res) => {
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
        throw error;
    }
};

// @desc Logout user and revoke refresh token
// @route POST /api/auth/logout
// @access Private
export const logout = async (req, res) => {
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
        throw error;
    }
};
