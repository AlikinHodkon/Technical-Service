import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../app.ts';

describe('GET /api/openapi.json', () => {
	it('returns a valid OpenAPI document covering the existing endpoints', async () => {
		const response = await request(app).get('/api/openapi.json');

		expect(response.status).toBe(200);
		expect(response.body.openapi).toBe('3.1.0');
		expect(response.body.paths).toHaveProperty('/equipment');
		expect(response.body.paths).toHaveProperty('/requests');
		expect(response.body.paths).toHaveProperty('/requests/{id}/status');
		expect(response.body.paths).toHaveProperty('/sites/{id}/summary');
	});
});

describe('GET /api/docs', () => {
	it('serves the Swagger UI page', async () => {
		const response = await request(app).get('/api/docs/');

		expect(response.status).toBe(200);
		expect(response.type).toBe('text/html');
	});

	it('does not send a Content-Security-Policy header that would block the inline bootstrap script', async () => {
		const response = await request(app).get('/api/docs/');

		expect(response.headers['content-security-policy']).toBeUndefined();
	});
});
