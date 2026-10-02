import { Router } from 'express';
import { getCurrentCounts, getHistory, patchCounts } from '../controllers/staffCount.controller.js';
import { requireAdmin, requireAuth } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/', requireAuth, getCurrentCounts);
router.get('/history', requireAuth, getHistory);
router.patch('/', requireAuth, requireAdmin, patchCounts);
export default router;
