import { config } from '../config/env.ts';
import { createRateLimiter } from './rateLimiter.ts';

// Отдельный, более строгий лимит именно на /login — защита от перебора
// паролей, не делим общий бюджет запросов с остальным API.
export const loginRateLimiter = createRateLimiter({
	windowMs: config.loginRateLimit.windowMs,
	limit: config.loginRateLimit.max,
});
