import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createCompanySchema, updateCompanySchema } from '../../types/schemas';
import {
  listCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
} from './companies.controller';

const router = Router();
router.use(authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'VIEWER'));

router.get('/', listCompanies);
router.get('/:id', getCompany);
router.post('/', requireRole('SUPER_ADMIN', 'ADMIN'), validate(createCompanySchema), createCompany);
router.patch('/:id', requireRole('SUPER_ADMIN', 'ADMIN'), validate(updateCompanySchema), updateCompany);
router.delete('/:id', requireRole('SUPER_ADMIN', 'ADMIN'), deleteCompany);

export default router;
