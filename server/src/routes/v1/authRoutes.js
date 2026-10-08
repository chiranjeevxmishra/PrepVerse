import express from 'express';
import {
  register,
  login,
  googleAuth,
  getMe,
  logout,
} from '../../controllers/authController.js';
import { protect } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rateLimiter.js';

const router = express.Router();

// Public auth routes with rate limiting
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleAuth);
router.post('/logout', logout);

// Protected student profile route
router.get('/me', protect, getMe);

export default router;
