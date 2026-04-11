import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createMeetingSchema } from '../../types/schemas';
import { createMeeting, meetingsByCompany, meetingsByRep } from './meetings.controller';

const router = Router();
router.use(authenticate, requireRole('SUPER_ADMIN', 'ADMIN', 'VIEWER'));

router.post('/', requireRole('SUPER_ADMIN', 'ADMIN'), validate(createMeetingSchema), createMeeting);
router.get('/company/:companyId', meetingsByCompany);
router.get('/rep/:repId', meetingsByRep);

export default router;
