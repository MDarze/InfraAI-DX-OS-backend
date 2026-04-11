import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { clientRegisterSchema, clientSubmitSchema } from '../../types/schemas';
import { register, getAssessmentStructure, submitAssessment } from './client.controller';

const router = Router();

router.post('/register', validate(clientRegisterSchema), register);
router.get('/assessment/:id', getAssessmentStructure);
router.post('/assessment/:id/submit', validate(clientSubmitSchema), submitAssessment);

export default router;
