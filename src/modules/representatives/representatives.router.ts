import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createRepSchema, updateRepSchema } from '../../types/schemas';
import { listReps, createRep, updateRep, deactivateRep } from './representatives.controller';

const router = Router();
router.use(authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'VIEWER'));

router.get('/', listReps);
router.post('/', requireRole('SUPER_ADMIN', 'ADMIN'), validate(createRepSchema), createRep);
router.patch('/:id', requireRole('SUPER_ADMIN', 'ADMIN'), validate(updateRepSchema), updateRep);
router.delete('/:id', requireRole('SUPER_ADMIN'), deactivateRep);

export default router;
