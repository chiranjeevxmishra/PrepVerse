import express from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';

const router = express.Router();

// Mount v1 resources
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

export default router;
