import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.toLowerCase().startsWith('bearer ')) {
        try {
            token = req.headers.authorization.split(' ')[1]?.trim();

            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'Not authorized, no token'
                });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'User not found'
                });
            }
            return next();

        } catch (error) {
            console.error('Auth middleware error:', error.message);
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Not authorized, token expired'
                });
            }

            return res.status(401).json({
                success: false,
                error:
                    process.env.NODE_ENV === 'development'
                        ? `Not authorized, token failed: ${error.message}`
                        : 'Not authorized, token failed'
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Not authorized, no token'
        });
    }
};

export default protect;