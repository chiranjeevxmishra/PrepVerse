import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication endpoints to prevent brute-force attacks
 * Limits each IP to 25 requests per 15 minutes window
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // Limit each IP to 25 requests per windowMs
  standardHeaders: true, // Return standard RateLimit headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
  },
});
