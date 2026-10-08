import User from '../models/User.js';
import { sendTokenResponse } from '../utils/generateToken.js';
import { ENV } from '../config/env.js';

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new student account
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      provider: 'local',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`,
    });

    return sendTokenResponse(user, 201, res, 'Account created successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate student with email and password
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // Query user and explicitly select password field
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // If account was created with OAuth only (no password set)
    if (!user.password && user.provider !== 'local') {
      return res.status(400).json({
        success: false,
        message: `This account was registered using ${user.provider}. Please sign in with ${user.provider}.`,
      });
    }

    // Check password match
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    return sendTokenResponse(user, 200, res, 'Logged in successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/auth/google
 * @desc    Google OAuth sign in or verification
 * @access  Public
 */
export const googleAuth = async (req, res, next) => {
  try {
    if (!ENV.GOOGLE_CLIENT_ID) {
      return res.status(503).json({
        success: false,
        message: 'Google sign-in is not configured. Set GOOGLE_CLIENT_ID on the server.',
      });
    }

    const credential = typeof req.body?.credential === 'string' ? req.body.credential : '';
    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'A Google ID token credential is required.',
      });
    }

    let payload;
    try {
      const query = new URLSearchParams({ id_token: credential });
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?${query.toString()}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) {
        return res.status(401).json({ success: false, message: 'Invalid or expired Google credential.' });
      }
      payload = await response.json();
    } catch {
      return res.status(502).json({ success: false, message: 'Google credential verification is temporarily unavailable.' });
    }

    const issuerIsValid = ['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss);
    const tokenIsCurrent = Number(payload.exp) * 1000 > Date.now();
    if (
      payload.aud !== ENV.GOOGLE_CLIENT_ID ||
      !issuerIsValid ||
      !tokenIsCurrent ||
      !payload.sub ||
      !payload.email ||
      payload.email_verified !== 'true'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Google credential is invalid, unverified, or was issued for another application.',
      });
    }

    const googleProfile = {
      email: payload.email.trim().toLowerCase(),
      name: payload.name?.trim() || payload.email.split('@')[0],
      avatar: payload.picture || null,
      providerId: payload.sub,
    };

    // Match the stable Google subject first, then link an existing verified-email account.
    let user = await User.findOne({ provider: 'google', providerId: googleProfile.providerId });
    if (!user) user = await User.findOne({ email: googleProfile.email });

    if (user) {
      if (user.providerId && user.providerId !== googleProfile.providerId) {
        return res.status(409).json({
          success: false,
          message: 'This email is already linked to a different Google account.',
        });
      }
      user.providerId = googleProfile.providerId;
      user.provider = 'google';
      user.name = googleProfile.name;
      if (googleProfile.avatar) user.avatar = googleProfile.avatar;
      await user.save();
    } else {
      user = await User.create({
        name: googleProfile.name,
        email: googleProfile.email.toLowerCase(),
        avatar: googleProfile.avatar,
        provider: 'google',
        providerId: googleProfile.providerId,
        role: 'student',
      });
    }

    return sendTokenResponse(user, 200, res, 'Google authentication successful.');
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this Google email already exists. Please try signing in again.',
      });
    }
    next(error);
  }
};

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get currently authenticated student profile
 * @access  Private
 */
export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      role: req.user.role,
      provider: req.user.provider,
      hasCompletedOnboarding: req.user.hasCompletedOnboarding || false,
      hasCompletedAssessment: req.user.hasCompletedAssessment || false,
      createdAt: req.user.createdAt,
    },
  });
};

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Clear session cookie and logout user
 * @access  Public / Private
 */
export const logout = async (req, res) => {
  res.cookie('token', '', {
    expires: new Date(0),
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};
