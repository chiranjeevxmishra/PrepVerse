import express from 'express';
import {
  getTodaysPlan,
  completeTask,
  getPlanHistory,
} from '../../controllers/planController.js';
import { protect } from '../../middleware/auth.js';

const router = express.Router();

router.use(protect); // All plan routes require authentication

router.get('/today', getTodaysPlan);
router.patch('/tasks/:id/complete', completeTask);
router.get('/history', getPlanHistory);

export default router;
