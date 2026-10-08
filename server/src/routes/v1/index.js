import express from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import profileRoutes from './profileRoutes.js';
import assessmentRoutes from './assessmentRoutes.js';
import planRoutes from './planRoutes.js';
import jobRoutes from './jobRoutes.js';
import practiceRoutes from './practiceRoutes.js';
import collaborationRoutes from './collaborationRoutes.js';

const router = express.Router();

// Mount v1 resources
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/assessment', assessmentRoutes);
router.use('/plan', planRoutes);
router.use('/jobs', jobRoutes);
router.use('/practice', practiceRoutes);
router.use('/collaboration', collaborationRoutes);

export default router;
