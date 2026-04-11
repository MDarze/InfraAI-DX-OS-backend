import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createRespondentSchema, updateRespondentSchema } from '../../types/schemas';
import {
  listRespondents,
  createRespondent,
  updateRespondent,
  deleteRespondent,
} from './respondents.controller';

const router = Router({ mergeParams: true });
router.use(authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'VIEWER'));

router.get('/', listRespondents);
router.post('/', requireRole('SUPER_ADMIN', 'ADMIN'), validate(createRespondentSchema), createRespondent);
router.patch('/:respondentId', requireRole('SUPER_ADMIN', 'ADMIN'), validate(updateRespondentSchema), updateRespondent);
router.delete('/:respondentId', requireRole('SUPER_ADMIN', 'ADMIN'), deleteRespondent);

export default router;
