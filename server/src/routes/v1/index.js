import express from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import profileRoutes from './profileRoutes.js';
import assessmentRoutes from './assessmentRoutes.js';

const router = express.Router();

// Mount v1 resources
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/assessment', assessmentRoutes);

export default router;
