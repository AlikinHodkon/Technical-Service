import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from './app.ts';
import { errorHandler } from './middlewares/index.ts';
import { createRateLimiter } from './middlewares/rateLimiter.ts';

describe('security headers', () => {
	it('sets helmet protective headers', async () => {
		const response = await request(app).get('/api/health');

		expect(response.headers['x-content-type-options']).toBe('nosniff');
		expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
	});
});

describe('CORS allow-list', () => {
	it('allows requests without an Origin header', async () => {
		const response = await request(app).get('/api/health');

		expect(response.status).toBe(200);
	});

	it('rejects a disallowed Origin with 403', async () => {
		const response = await request(app)
			.get('/api/health')
			.set('Origin', 'https://not-allowed.example');

		expect(response.status).toBe(403);
	});
});

describe('rate limiting', () => {
	it('returns 429 with rate-limit headers once the limit is exceeded', async () => {
		const limitedApp = express();
		limitedApp.use(createRateLimiter({ windowMs: 60_000, limit: 2 }));
		limitedApp.get('/probe', (_req, res) => res.json({ ok: true }));
		limitedApp.use(errorHandler);

		await request(limitedApp).get('/probe');
		await request(limitedApp).get('/probe');
		const response = await request(limitedApp).get('/probe');

		expect(response.status).toBe(429);
		expect(response.headers['ratelimit-limit']).toBe('2');
	});
});
