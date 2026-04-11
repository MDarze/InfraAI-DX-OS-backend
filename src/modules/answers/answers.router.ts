import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { submitAnswersSchema } from '../../types/schemas';
import { listAnswers, submitAnswers } from './answers.controller';

const router = Router({ mergeParams: true });
router.use(authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'VIEWER'));

router.get('/', listAnswers);
router.post('/', requireRole('SUPER_ADMIN', 'ADMIN'), validate(submitAnswersSchema), submitAnswers);

export default router;
