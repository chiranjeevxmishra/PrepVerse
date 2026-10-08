import express from 'express';
import healthRoutes from './healthRoutes.js';

const router = express.Router();

// Mount v1 resources
router.use('/health', healthRoutes);

export default router;
