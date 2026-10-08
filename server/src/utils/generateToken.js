import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

/**
 * Sign JWT Token
 * @param {string} id - User ID
 * @param {string} role - User role
 * @returns {string} - JWT string
 */
export const signToken = (id, role) => {
  return jwt.sign({ id, role }, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN,
  });
};

/**
 * Send Token Response with HTTP-only cookie and JSON payload
 * @param {object} user - User document
 * @param {number} statusCode - HTTP status code
 * @param {object} res - Express response
 * @param {string} message - Optional status message
 */
export const sendTokenResponse = (user, statusCode, res, message = 'Authenticated successfully') => {
  const token = signToken(user._id, user.role);

  // Cookie expiration (7 days default)
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  res.cookie('token', token, cookieOptions);

  return res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      provider: user.provider,
      hasCompletedOnboarding: user.hasCompletedOnboarding || false,
      hasCompletedAssessment: user.hasCompletedAssessment || false,
      createdAt: user.createdAt,
    },
  });
};
