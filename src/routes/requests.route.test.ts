import { rm } from 'node:fs/promises';
import path from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import app from '../app.ts';

const testStorageDir = path.join(process.cwd(), 'storage-test');
const API_KEY = 'dev-api-key';

const baseEquipment = {
	name: 'Турбина №7',
	type: 'turbine',
	serialNumber: 'WT-2024-0007',
	location: { lat: 55.75, lon: 37.62 },
	status: 'operational',
	installedAt: '2024-06-01T00:00:00.000Z',
};

const baseRequest = {
	title: 'Заменить датчик вибрации',
	description: 'Датчик показывает нестабильные значения',
	priority: 'medium',
};

const createEquipment = (overrides: Partial<typeof baseEquipment> = {}) =>
	request(app)
		.post('/api/equipment')
		.set('X-API-Key', API_KEY)
		.send({ ...baseEquipment, ...overrides });

const createRequestFor = (
	equipmentId: string,
	overrides: Partial<typeof baseRequest> = {},
) =>
	request(app)
		.post('/api/requests')
		.set('X-API-Key', API_KEY)
		.send({ ...baseRequest, equipmentId, ...overrides });

beforeEach(async () => {
	await rm(testStorageDir, { recursive: true, force: true });
});

afterEach(async () => {
	await rm(testStorageDir, { recursive: true, force: true });
});

describe('POST /api/requests', () => {
	it('returns 201 and defaults status to new', async () => {
		const equipment = await createEquipment();

		const response = await createRequestFor(equipment.body.id);

		expect(response.status).toBe(201);
		expect(typeof response.body.id).toBe('string');
		expect(response.body.status).toBe('new');
		expect(response.body.equipmentId).toBe(equipment.body.id);
	});

	it('returns 404 when equipmentId does not exist', async () => {
		const response = await createRequestFor('unknown-equipment-id');

		expect(response.status).toBe(404);
	});

	it('returns 422 when title is too short', async () => {
		const equipment = await createEquipment();

		const response = await createRequestFor(equipment.body.id, {
			title: 'abc',
		});

		expect(response.status).toBe(422);
	});

	it('returns 401 without an API key', async () => {
		const equipment = await createEquipment();

		const response = await request(app)
			.post('/api/requests')
			.send({ ...baseRequest, equipmentId: equipment.body.id });

		expect(response.status).toBe(401);
	});
});

describe('POST /api/requests/bulk', () => {
	it('returns 207 with a per-item report on a mixed batch', async () => {
		const equipment = await createEquipment();

		const response = await request(app)
			.post('/api/requests/bulk')
			.set('X-API-Key', API_KEY)
			.send({
				requests: [
					{ ...baseRequest, equipmentId: equipment.body.id },
					{ ...baseRequest, equipmentId: equipment.body.id, title: 'abc' },
					{ ...baseRequest, equipmentId: crypto.randomUUID() },
				],
			});

		expect(response.status).toBe(207);
		expect(response.body.summary).toEqual({ total: 3, created: 1, failed: 2 });

		expect(response.body.results[0]).toMatchObject({
			index: 0,
			status: 'created',
		});
		expect(response.body.results[1]).toMatchObject({
			index: 1,
			status: 'error',
		});
		expect(response.body.results[1].errors[0].field).toBe('title');
		expect(response.body.results[2]).toMatchObject({
			index: 2,
			status: 'error',
		});
	});

	it('persists the successfully created items', async () => {
		const equipment = await createEquipment();

		await request(app)
			.post('/api/requests/bulk')
			.set('X-API-Key', API_KEY)
			.send({
				requests: [{ ...baseRequest, equipmentId: equipment.body.id }],
			});

		const list = await request(app).get('/api/requests');
		expect(list.body.total).toBe(1);
	});

	it('returns 422 when the requests array is empty', async () => {
		const response = await request(app)
			.post('/api/requests/bulk')
			.set('X-API-Key', API_KEY)
			.send({ requests: [] });

		expect(response.status).toBe(422);
	});

	it('returns 401 without an API key', async () => {
		const equipment = await createEquipment();

		const response = await request(app)
			.post('/api/requests/bulk')
			.send({
				requests: [{ ...baseRequest, equipmentId: equipment.body.id }],
			});

		expect(response.status).toBe(401);
	});
});

describe('GET /api/requests', () => {
	it('returns list with pagination metadata', async () => {
		const equipment = await createEquipment();
		await createRequestFor(equipment.body.id, { priority: 'low' });
		await createRequestFor(equipment.body.id, { priority: 'high' });

		const response = await request(app).get('/api/requests');

		expect(response.status).toBe(200);
		expect(response.body.total).toBe(2);
		expect(response.body.data).toHaveLength(2);
	});

	it('filters by priority and equipmentId', async () => {
		const equipmentA = await createEquipment({ serialNumber: 'WT-2024-0001' });
		const equipmentB = await createEquipment({ serialNumber: 'WT-2024-0002' });
		await createRequestFor(equipmentA.body.id, { priority: 'low' });
		await createRequestFor(equipmentB.body.id, { priority: 'high' });

		const response = await request(app)
			.get('/api/requests')
			.query({ priority: 'high', equipmentId: equipmentB.body.id });

		expect(response.status).toBe(200);
		expect(response.body.total).toBe(1);
		expect(response.body.data[0].priority).toBe('high');
	});
});

describe('GET /api/requests/:id', () => {
	it('returns the request card', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);

		const response = await request(app).get(`/api/requests/${created.body.id}`);

		expect(response.status).toBe(200);
		expect(response.body.id).toBe(created.body.id);
	});

	it('returns 404 for unknown id', async () => {
		const response = await request(app).get(
			`/api/requests/${crypto.randomUUID()}`,
		);

		expect(response.status).toBe(404);
	});

	it('returns 422 for a malformed id', async () => {
		const response = await request(app).get('/api/requests/unknown-id');

		expect(response.status).toBe(422);
	});
});

describe('PATCH /api/requests/:id', () => {
	it('updates regular fields', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);

		const response = await request(app)
			.patch(`/api/requests/${created.body.id}`)
			.set('X-API-Key', API_KEY)
			.send({ priority: 'critical' });

		expect(response.status).toBe(200);
		expect(response.body.priority).toBe('critical');
	});

	it('ignores an attempt to change status through this endpoint', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);

		const response = await request(app)
			.patch(`/api/requests/${created.body.id}`)
			.set('X-API-Key', API_KEY)
			.send({ status: 'done', priority: 'high' });

		expect(response.status).toBe(200);
		expect(response.body.status).toBe('new');
		expect(response.body.priority).toBe('high');
	});

	it('returns 404 for unknown id', async () => {
		const response = await request(app)
			.patch(`/api/requests/${crypto.randomUUID()}`)
			.set('X-API-Key', API_KEY)
			.send({ priority: 'high' });

		expect(response.status).toBe(404);
	});

	it('returns 422 for a malformed id', async () => {
		const response = await request(app)
			.patch('/api/requests/unknown-id')
			.set('X-API-Key', API_KEY)
			.send({ priority: 'high' });

		expect(response.status).toBe(422);
	});

	it('returns 401 without an API key', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);

		const response = await request(app)
			.patch(`/api/requests/${created.body.id}`)
			.send({ priority: 'high' });

		expect(response.status).toBe(401);
	});
});

describe('PATCH /api/requests/:id/status', () => {
	it('allows a valid transition', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);

		const response = await request(app)
			.patch(`/api/requests/${created.body.id}/status`)
			.set('X-API-Key', API_KEY)
			.send({ status: 'in_progress' });

		expect(response.status).toBe(200);
		expect(response.body.status).toBe('in_progress');
	});

	it('returns 409 on an invalid transition', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);

		const response = await request(app)
			.patch(`/api/requests/${created.body.id}/status`)
			.set('X-API-Key', API_KEY)
			.send({ status: 'done' });

		expect(response.status).toBe(409);
	});

	it('returns 409 when transitioning from a closed status', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);
		await request(app)
			.patch(`/api/requests/${created.body.id}/status`)
			.set('X-API-Key', API_KEY)
			.send({ status: 'rejected' });

		const response = await request(app)
			.patch(`/api/requests/${created.body.id}/status`)
			.set('X-API-Key', API_KEY)
			.send({ status: 'in_progress' });

		expect(response.status).toBe(409);
	});

	it('returns 404 for unknown id', async () => {
		const response = await request(app)
			.patch(`/api/requests/${crypto.randomUUID()}/status`)
			.set('X-API-Key', API_KEY)
			.send({ status: 'in_progress' });

		expect(response.status).toBe(404);
	});

	it('returns 422 for a malformed id', async () => {
		const response = await request(app)
			.patch('/api/requests/unknown-id/status')
			.set('X-API-Key', API_KEY)
			.send({ status: 'in_progress' });

		expect(response.status).toBe(422);
	});

	it('returns 401 without an API key', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);

		const response = await request(app)
			.patch(`/api/requests/${created.body.id}/status`)
			.send({ status: 'in_progress' });

		expect(response.status).toBe(401);
	});
});

describe('DELETE /api/requests/:id', () => {
	it('returns 204 and removes the request', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);

		const response = await request(app)
			.delete(`/api/requests/${created.body.id}`)
			.set('X-API-Key', API_KEY);
		expect(response.status).toBe(204);

		const getResponse = await request(app).get(
			`/api/requests/${created.body.id}`,
		);
		expect(getResponse.status).toBe(404);
	});

	it('returns 404 for unknown id', async () => {
		const response = await request(app)
			.delete(`/api/requests/${crypto.randomUUID()}`)
			.set('X-API-Key', API_KEY);

		expect(response.status).toBe(404);
	});

	it('returns 422 for a malformed id', async () => {
		const response = await request(app)
			.delete('/api/requests/unknown-id')
			.set('X-API-Key', API_KEY);

		expect(response.status).toBe(422);
	});

	it('returns 401 without an API key', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);

		const response = await request(app).delete(
			`/api/requests/${created.body.id}`,
		);

		expect(response.status).toBe(401);
	});
});
