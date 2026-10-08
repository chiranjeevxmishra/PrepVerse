import express from 'express';
import {
  addRecommendationToPlan,
  analyzeJob,
  getAnalyses,
  getAnalysis,
  removeAnalysis,
} from '../../controllers/jobController.js';
import { protect } from '../../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.post('/analyze', analyzeJob);
router.get('/', getAnalyses);
router.get('/:id', getAnalysis);
router.delete('/:id', removeAnalysis);
router.post('/:id/tasks/:recommendationIndex', addRecommendationToPlan);

export default router;
