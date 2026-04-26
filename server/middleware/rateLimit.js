import { rateLimit } from 'express-rate-limit';

const standardRateLimitResponse = {
  success: false,
  error: 'Too many requests. Please try again later.',
};

export const globalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 500),
  standardHeaders: true,
  legacyHeaders: false,
  message: standardRateLimitResponse,
});

export const authLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please wait before retrying.',
  },
});