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
    const { credential, isDemo, email, name, avatar } = req.body;

    let googleProfile = null;

    // Case 1: Real Google ID Token provided
    if (credential && credential !== 'demo-token') {
      try {
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        const data = await response.json();

        if (data.error_description || !data.email) {
          return res.status(400).json({
            success: false,
            message: 'Invalid Google OAuth credential token.',
          });
        }

        googleProfile = {
          email: data.email,
          name: data.name || data.email.split('@')[0],
          avatar: data.picture || null,
          providerId: data.sub,
        };
      } catch (err) {
        return res.status(500).json({
          success: false,
          message: 'Failed to verify Google token with Google servers.',
        });
      }
    }
    // Case 2: Hackathon prototype demo mode (allows seamless testing without Google Cloud Console setup)
    else if (isDemo || credential === 'demo-token') {
      googleProfile = {
        email: email || 'student.demo@prepverse.dev',
        name: name || 'Demo Student',
        avatar: avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=PrepVerseStudent',
        providerId: 'google-demo-student-id-001',
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Google credential or demo payload is required.',
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email: googleProfile.email.toLowerCase() });

    if (user) {
      // Update avatar or providerId if not already set
      if (!user.providerId) {
        user.providerId = googleProfile.providerId;
        user.provider = 'google';
        if (googleProfile.avatar) user.avatar = googleProfile.avatar;
        await user.save();
      }
    } else {
      // Create new user via Google OAuth
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
