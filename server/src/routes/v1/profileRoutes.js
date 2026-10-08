import express from 'express';
import { getMyProfile, saveOnboarding } from '../../controllers/profileController.js';
import { protect } from '../../middleware/auth.js';

const router = express.Router();

router.use(protect); // All profile operations require authentication

router.get('/me', getMyProfile);
router.post('/onboarding', saveOnboarding);

export default router;
