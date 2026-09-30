import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import app from '../app.ts';
import { sequelize } from '../config/db.ts';

describe('GET /api/health/live', () => {
	it('returns ok status', async () => {
		const response = await request(app).get('/api/health/live');

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ status: 'ok' });
	});
});

describe('GET /api/health/ready', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('return 200 when the database is reachable', async () => {
		const response = await request(app).get('/api/health/ready');

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ status: 'ok' });
	});

	it('return 503 when the database is unreachable', async () => {
		vi.spyOn(sequelize, 'authenticate').mockRejectedValueOnce(
			new Error('connection refused'),
		);

		const response = await request(app).get('/api/health/ready');

		expect(response.status).toBe(503);
		expect(response.body).toEqual({ status: 'error' });
	});
});
