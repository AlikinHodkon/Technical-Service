import { rm } from 'node:fs/promises';
import path from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import app from '../app.ts';

const testStorageDir = path.join(process.cwd(), 'storage-test');

beforeEach(async () => {
	await rm(testStorageDir, { recursive: true, force: true });
});

afterEach(async () => {
	await rm(testStorageDir, { recursive: true, force: true });
});

describe('POST /api/equipment', () => {
	it('returns 201 status', async () => {
		const response = await request(app)
			.post('/api/equipment')
			.send({
				name: 'Турбина №7',
				type: 'turbine',
				serialNumber: 'WT-2024-0007',
				location: { lat: 55.75, lon: 37.62 },
				status: 'operational',
				installedAt: '2024-06-01T00:00:00.000Z',
			});

		expect(response.status).toBe(201);
		expect(typeof response.body.id).toBe('string');
		expect(response.body).toMatchObject({
			name: 'Турбина №7',
			type: 'turbine',
			serialNumber: 'WT-2024-0007',
			location: { lat: 55.75, lon: 37.62 },
			status: 'operational',
			installedAt: '2024-06-01T00:00:00.000Z',
		});
	});
});
