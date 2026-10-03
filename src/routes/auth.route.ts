import { Router } from 'express';
import { login, logout, me, refresh, register } from '../controllers/auth.ts';
import {
	authenticate,
	loginRateLimiter,
	validate,
} from '../middlewares/index.ts';
import { loginSchema, registerSchema } from '../validators/auth.validator.ts';

const router = Router();

router.post('/auth/register', validate({ body: registerSchema }), register);
router.post(
	'/auth/login',
	loginRateLimiter,
	validate({ body: loginSchema }),
	login,
);
router.post('/auth/refresh', refresh);
router.post('/auth/logout', authenticate, logout);
router.get('/auth/me', authenticate, me);

export default router;
