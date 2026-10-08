import express from 'express';
import {
  completeSession,
  getSession,
  getSessions,
  startSession,
  submitAnswer,
} from '../../controllers/practiceController.js';
import { protect } from '../../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.post('/sessions', startSession);
router.get('/sessions', getSessions);
router.get('/sessions/:id', getSession);
router.post('/sessions/:id/answers', submitAnswer);
router.post('/sessions/:id/complete', completeSession);

export default router;
