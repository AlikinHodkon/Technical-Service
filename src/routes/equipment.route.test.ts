import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import app from '../app.ts';

const testStorageDir = path.join(process.cwd(), 'storage-test');

const baseEquipment = {
	name: 'Турбина №7',
	type: 'turbine',
	serialNumber: 'WT-2024-0007',
	location: { lat: 55.75, lon: 37.62 },
	status: 'operational',
	installedAt: '2024-06-01T00:00:00.000Z',
};

const createEquipment = (overrides: Partial<typeof baseEquipment> = {}) =>
	request(app)
		.post('/api/equipment')
		.send({ ...baseEquipment, ...overrides });

const writeRequests = async (requests: unknown[]) => {
	await mkdir(testStorageDir, { recursive: true });
	await writeFile(
		path.join(testStorageDir, 'requests.json'),
		JSON.stringify(requests, null, 2),
	);
};

beforeEach(async () => {
	await rm(testStorageDir, { recursive: true, force: true });
});

afterEach(async () => {
	await rm(testStorageDir, { recursive: true, force: true });
});

describe('POST /api/equipment', () => {
	it('returns 201 status', async () => {
		const response = await createEquipment();

		expect(response.status).toBe(201);
		expect(typeof response.body.id).toBe('string');
		expect(response.body).toMatchObject(baseEquipment);
	});

	it('returns 409 when serialNumber already exists', async () => {
		await createEquipment();
		const response = await createEquipment();

		expect(response.status).toBe(409);
	});
});

describe('GET /api/equipment', () => {
	it('returns list with pagination metadata', async () => {
		await createEquipment({
			serialNumber: 'WT-2024-0001',
			status: 'operational',
		});
		await createEquipment({
			serialNumber: 'WT-2024-0002',
			status: 'maintenance',
		});

		const response = await request(app).get('/api/equipment');

		expect(response.status).toBe(200);
		expect(response.body.total).toBe(2);
		expect(response.body.page).toBe(1);
		expect(response.body.data).toHaveLength(2);
	});

	it('filters by status', async () => {
		await createEquipment({
			serialNumber: 'WT-2024-0001',
			status: 'operational',
		});
		await createEquipment({
			serialNumber: 'WT-2024-0002',
			status: 'maintenance',
		});

		const response = await request(app)
			.get('/api/equipment')
			.query({ status: 'maintenance' });

		expect(response.status).toBe(200);
		expect(response.body.total).toBe(1);
		expect(response.body.data[0].status).toBe('maintenance');
	});
});

describe('GET /api/equipment/:id', () => {
	it('returns the equipment card', async () => {
		const created = await createEquipment();

		const response = await request(app).get(
			`/api/equipment/${created.body.id}`,
		);

		expect(response.status).toBe(200);
		expect(response.body).toMatchObject(baseEquipment);
	});

	it('returns 404 for unknown id', async () => {
		const response = await request(app).get('/api/equipment/unknown-id');

		expect(response.status).toBe(404);
	});
});

describe('PATCH /api/equipment/:id', () => {
	it('updates allowed fields', async () => {
		const created = await createEquipment();

		const response = await request(app)
			.patch(`/api/equipment/${created.body.id}`)
			.send({ status: 'maintenance' });

		expect(response.status).toBe(200);
		expect(response.body.status).toBe('maintenance');
		expect(response.body.id).toBe(created.body.id);
	});

	it('ignores an attempt to change id', async () => {
		const created = await createEquipment();

		const response = await request(app)
			.patch(`/api/equipment/${created.body.id}`)
			.send({ id: 'hacked-id', status: 'maintenance' });

		expect(response.status).toBe(200);
		expect(response.body.id).toBe(created.body.id);
	});

	it('returns 404 for unknown id', async () => {
		const response = await request(app)
			.patch('/api/equipment/unknown-id')
			.send({ status: 'maintenance' });

		expect(response.status).toBe(404);
	});

	it('returns 409 when new serialNumber is already taken', async () => {
		await createEquipment({ serialNumber: 'WT-2024-0001' });
		const second = await createEquipment({ serialNumber: 'WT-2024-0002' });

		const response = await request(app)
			.patch(`/api/equipment/${second.body.id}`)
			.send({ serialNumber: 'WT-2024-0001' });

		expect(response.status).toBe(409);
	});
});

describe('DELETE /api/equipment/:id', () => {
	it('returns 204 and removes the equipment', async () => {
		const created = await createEquipment();

		const response = await request(app).delete(
			`/api/equipment/${created.body.id}`,
		);
		expect(response.status).toBe(204);

		const getResponse = await request(app).get(
			`/api/equipment/${created.body.id}`,
		);
		expect(getResponse.status).toBe(404);
	});

	it('returns 404 for unknown id', async () => {
		const response = await request(app).delete('/api/equipment/unknown-id');

		expect(response.status).toBe(404);
	});

	it('returns 409 when equipment has open requests', async () => {
		const created = await createEquipment();
		await writeRequests([
			{
				id: 'req-1',
				equipmentId: created.body.id,
				title: 'Заменить датчик',
				description: '',
				priority: 'medium',
				status: 'in_progress',
				createdAt: '2024-06-01T00:00:00.000Z',
				updatedAt: '2024-06-01T00:00:00.000Z',
			},
		]);

		const response = await request(app).delete(
			`/api/equipment/${created.body.id}`,
		);

		expect(response.status).toBe(409);
	});
});

describe('GET /api/equipment/:id/requests', () => {
	it('returns requests scoped to the equipment', async () => {
		const equipmentA = await createEquipment({ serialNumber: 'WT-2024-0001' });
		const equipmentB = await createEquipment({ serialNumber: 'WT-2024-0002' });
		await writeRequests([
			{
				id: 'req-1',
				equipmentId: equipmentA.body.id,
				title: 'Заменить датчик',
				description: '',
				priority: 'medium',
				status: 'new',
				createdAt: '2024-06-01T00:00:00.000Z',
				updatedAt: '2024-06-01T00:00:00.000Z',
			},
			{
				id: 'req-2',
				equipmentId: equipmentB.body.id,
				title: 'Проверить инвертор',
				description: '',
				priority: 'low',
				status: 'new',
				createdAt: '2024-06-01T00:00:00.000Z',
				updatedAt: '2024-06-01T00:00:00.000Z',
			},
		]);

		const response = await request(app).get(
			`/api/equipment/${equipmentA.body.id}/requests`,
		);

		expect(response.status).toBe(200);
		expect(response.body.total).toBe(1);
		expect(response.body.data[0].id).toBe('req-1');
	});

	it('returns 404 for unknown equipment id', async () => {
		const response = await request(app).get(
			'/api/equipment/unknown-id/requests',
		);

		expect(response.status).toBe(404);
	});
});
