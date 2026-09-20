import { type Options, rateLimit } from 'express-rate-limit';
import { config } from '../config/env.ts';
import { TooManyRequestsError } from '../errors/error.ts';

export const createRateLimiter = (overrides: Partial<Options> = {}) =>
	rateLimit({
		windowMs: config.rateLimit.windowMs,
		limit: config.rateLimit.max,
		standardHeaders: true,
		legacyHeaders: false,
		handler: (_req, _res, next) => next(new TooManyRequestsError()),
		...overrides,
	});

export const rateLimiter = createRateLimiter();
