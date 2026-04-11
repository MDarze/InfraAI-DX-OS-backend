import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, refresh, logout } from './auth.controller';
import { validate } from '../../middleware/validate';
import { loginSchema, refreshSchema } from '../../types/schemas';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many requests, please try again later' },
});

router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/logout', logout);

export default router;
