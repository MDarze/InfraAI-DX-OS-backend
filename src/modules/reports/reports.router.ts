import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { listReports, getReport, generateReport } from './reports.controller';

const router = Router();
router.use(authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'VIEWER'));

router.get('/', listReports);
router.get('/:assessmentId', getReport);
router.post('/:assessmentId/generate', requireRole('SUPER_ADMIN', 'ADMIN'), generateReport);

export default router;
