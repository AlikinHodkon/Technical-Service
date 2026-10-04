import { config } from '../config/env.ts';
import { createRateLimiter } from './rateLimiter.ts';

// Фабрика, не общий экземпляр — у /login и /register свои счётчики, иначе один исчерпал бы лимит другого.
export const createAuthRateLimiter = () =>
	createRateLimiter({
		windowMs: config.authRateLimit.windowMs,
		limit: config.authRateLimit.max,
	});
