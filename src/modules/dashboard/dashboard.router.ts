import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { getStats } from './dashboard.controller';

const router = Router();
router.use(authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'VIEWER'));
router.get('/stats', getStats);

export default router;
