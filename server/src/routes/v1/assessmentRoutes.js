import express from 'express';
import {
  getAssessmentQuestions,
  submitAssessment,
  getLatestResults,
} from '../../controllers/assessmentController.js';
import { protect } from '../../middleware/auth.js';

const router = express.Router();

router.use(protect); // All assessment endpoints require authentication

router.get('/questions', getAssessmentQuestions);
router.post('/submit', submitAssessment);
router.get('/results', getLatestResults);

export default router;
