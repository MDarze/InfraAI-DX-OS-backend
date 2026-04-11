import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createAssessmentSchema, updateAssessmentSchema } from '../../types/schemas';
import {
  listAssessments,
  getAssessment,
  createAssessment,
  updateAssessment,
  deleteAssessment,
} from './assessments.controller';

const router = Router();
router.use(authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'VIEWER'));

router.get('/', listAssessments);
router.get('/:id', getAssessment);
router.post('/', requireRole('SUPER_ADMIN', 'ADMIN'), validate(createAssessmentSchema), createAssessment);
router.patch('/:id', requireRole('SUPER_ADMIN', 'ADMIN'), validate(updateAssessmentSchema), updateAssessment);
router.delete('/:id', requireRole('SUPER_ADMIN', 'ADMIN'), deleteAssessment);

export default router;
