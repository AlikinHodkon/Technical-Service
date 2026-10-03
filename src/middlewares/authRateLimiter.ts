import { config } from '../config/env.ts';
import { createRateLimiter } from './rateLimiter.ts';

// Отдельный, более строгий лимит на /login и /register — защита от перебора
// паролей и от спам-регистрации, не делим общий бюджет запросов с остальным
// API. Фабрика, а не общий экземпляр: у каждого маршрута свой счётчик,
// иначе брутфорс логина исчерпал бы и лимит на регистрацию (и наоборот).
export const createAuthRateLimiter = () =>
	createRateLimiter({
		windowMs: config.authRateLimit.windowMs,
		limit: config.authRateLimit.max,
	});
