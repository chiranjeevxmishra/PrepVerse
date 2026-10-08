import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ENV } from '../config/env.js';

/**
 * Protect routes: ensures request has valid JWT token in cookie or Authorization header
 */
export const protect = async (req, res, next) => {
  let token;

  // 1. Check HTTP-only cookie first
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Fallback to Authorization: Bearer <token> header
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token found
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please authenticate to access this resource.',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, ENV.JWT_SECRET);

    // Fetch user from DB (excluding password)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The account associated with this token no longer exists.',
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    let message = 'Invalid authentication token.';
    if (error.name === 'TokenExpiredError') {
      message = 'Your session has expired. Please log in again.';
    }

    return res.status(401).json({
      success: false,
      message,
    });
  }
};

/**
 * Grant access to specific roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user.role}' is not authorized to access this resource.`,
      });
    }
    next();
  };
};
