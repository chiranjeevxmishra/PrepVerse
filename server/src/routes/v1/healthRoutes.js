import express from 'express';
import { getDatabaseStatus } from '../../config/db.js';

const router = express.Router();

/**
 * @route   GET /api/v1/health
 * @desc    System health check & diagnostics
 * @access  Public
 */
router.get('/', (req, res) => {
  const dbStatus = getDatabaseStatus();

  res.status(200).json({
    success: true,
    service: 'PrepVerse API',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      connected: dbStatus === 'connected',
    },
    environment: process.env.NODE_ENV || 'development',
  });
});

export default router;
