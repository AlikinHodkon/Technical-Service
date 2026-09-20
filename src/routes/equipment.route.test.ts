import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

const createEquipment = (overrides: Partial<typeof baseEquipment> = {}) =>
	request(app)
		.post('/api/equipment')
		.set('X-API-Key', API_KEY)
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
	vi.unstubAllGlobals();
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

	it('returns 422 when installedAt is in the future', async () => {
		const response = await createEquipment({
			installedAt: '2099-01-01T00:00:00.000Z',
		});

		expect(response.status).toBe(422);
		expect(response.body.errors[0].field).toBe('installedAt');
	});

	it('returns 401 without an API key', async () => {
		const response = await request(app)
			.post('/api/equipment')
			.send(baseEquipment);

		expect(response.status).toBe(401);
	});

	it('returns 401 with a wrong API key', async () => {
		const response = await request(app)
			.post('/api/equipment')
			.set('X-API-Key', 'wrong-key')
			.send(baseEquipment);

		expect(response.status).toBe(401);
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

	it('falls back to the default limit when limit is not a number', async () => {
		await createEquipment();

		const response = await request(app)
			.get('/api/equipment')
			.query({ limit: 'xyz' });

		expect(response.status).toBe(200);
		expect(response.body.limit).toBe(20);
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
		const response = await request(app).get(
			`/api/equipment/${crypto.randomUUID()}`,
		);

		expect(response.status).toBe(404);
	});

	it('returns 422 for a malformed id', async () => {
		const response = await request(app).get('/api/equipment/unknown-id');

		expect(response.status).toBe(422);
	});
});

describe('PATCH /api/equipment/:id', () => {
	it('updates allowed fields', async () => {
		const created = await createEquipment();

		const response = await request(app)
			.patch(`/api/equipment/${created.body.id}`)
			.set('X-API-Key', API_KEY)
			.send({ status: 'maintenance' });

		expect(response.status).toBe(200);
		expect(response.body.status).toBe('maintenance');
		expect(response.body.id).toBe(created.body.id);
	});

	it('ignores an attempt to change id', async () => {
		const created = await createEquipment();

		const response = await request(app)
			.patch(`/api/equipment/${created.body.id}`)
			.set('X-API-Key', API_KEY)
			.send({ id: 'hacked-id', status: 'maintenance' });

		expect(response.status).toBe(200);
		expect(response.body.id).toBe(created.body.id);
	});

	it('returns 404 for unknown id', async () => {
		const response = await request(app)
			.patch(`/api/equipment/${crypto.randomUUID()}`)
			.set('X-API-Key', API_KEY)
			.send({ status: 'maintenance' });

		expect(response.status).toBe(404);
	});

	it('returns 422 for a malformed id', async () => {
		const response = await request(app)
			.patch('/api/equipment/unknown-id')
			.set('X-API-Key', API_KEY)
			.send({ status: 'maintenance' });

		expect(response.status).toBe(422);
	});

	it('returns 409 when new serialNumber is already taken', async () => {
		await createEquipment({ serialNumber: 'WT-2024-0001' });
		const second = await createEquipment({ serialNumber: 'WT-2024-0002' });

		const response = await request(app)
			.patch(`/api/equipment/${second.body.id}`)
			.set('X-API-Key', API_KEY)
			.send({ serialNumber: 'WT-2024-0001' });

		expect(response.status).toBe(409);
	});

	it('returns 401 without an API key', async () => {
		const created = await createEquipment();

		const response = await request(app)
			.patch(`/api/equipment/${created.body.id}`)
			.send({ status: 'maintenance' });

		expect(response.status).toBe(401);
	});
});

describe('DELETE /api/equipment/:id', () => {
	it('returns 204 and removes the equipment', async () => {
		const created = await createEquipment();

		const response = await request(app)
			.delete(`/api/equipment/${created.body.id}`)
			.set('X-API-Key', API_KEY);
		expect(response.status).toBe(204);

		const getResponse = await request(app).get(
			`/api/equipment/${created.body.id}`,
		);
		expect(getResponse.status).toBe(404);
	});

	it('returns 404 for unknown id', async () => {
		const response = await request(app)
			.delete(`/api/equipment/${crypto.randomUUID()}`)
			.set('X-API-Key', API_KEY);

		expect(response.status).toBe(404);
	});

	it('returns 422 for a malformed id', async () => {
		const response = await request(app)
			.delete('/api/equipment/unknown-id')
			.set('X-API-Key', API_KEY);

		expect(response.status).toBe(422);
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

		const response = await request(app)
			.delete(`/api/equipment/${created.body.id}`)
			.set('X-API-Key', API_KEY);

		expect(response.status).toBe(409);
	});

	it('returns 401 without an API key', async () => {
		const created = await createEquipment();

		const response = await request(app).delete(
			`/api/equipment/${created.body.id}`,
		);

		expect(response.status).toBe(401);
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
			`/api/equipment/${crypto.randomUUID()}/requests`,
		);

		expect(response.status).toBe(404);
	});

	it('returns 422 for a malformed equipment id', async () => {
		const response = await request(app).get(
			'/api/equipment/unknown-id/requests',
		);

		expect(response.status).toBe(422);
	});
});

const okForecastResponse = () => ({
	latitude: 55.75,
	longitude: 37.62,
	timezone: 'Europe/Moscow',
	daily_units: {
		time: 'iso8601',
		temperature_2m_max: '°C',
		temperature_2m_min: '°C',
		precipitation_sum: 'mm',
		wind_speed_10m_max: 'km/h',
	},
	daily: {
		time: ['2024-06-01', '2024-06-02', '2024-06-03'],
		temperature_2m_max: [20, 22, 18],
		temperature_2m_min: [10, 12, 9],
		precipitation_sum: [0, 3, 0],
		wind_speed_10m_max: [12, 15, 25],
	},
});

describe('GET /api/equipment/:id/weather', () => {
	it('returns per-day forecast with suitability flags', async () => {
		const equipment = await createEquipment();
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => okForecastResponse(),
			}),
		);

		const response = await request(app).get(
			`/api/equipment/${equipment.body.id}/weather`,
		);

		expect(response.status).toBe(200);
		expect(response.body.equipmentId).toBe(equipment.body.id);
		expect(response.body.days).toHaveLength(3);
		expect(response.body.days[0]).toMatchObject({
			precipitationSum: 0,
			windSpeedMax: 12,
			suitableForOutdoorWork: true,
		});
		expect(response.body.days[1].suitableForOutdoorWork).toBe(false); // осадки
		expect(response.body.days[2].suitableForOutdoorWork).toBe(false); // сильный ветер
	});

	it('returns 404 for unknown equipment id without calling the weather API', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);

		const response = await request(app).get(
			`/api/equipment/${crypto.randomUUID()}/weather`,
		);

		expect(response.status).toBe(404);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('returns 422 for a malformed equipment id without calling the weather API', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);

		const response = await request(app).get(
			'/api/equipment/unknown-id/weather',
		);

		expect(response.status).toBe(422);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('returns 503 without crashing the service when the API is unreachable', async () => {
		const equipment = await createEquipment();
		vi.stubGlobal(
			'fetch',
			vi.fn().mockRejectedValue(new TypeError('fetch failed')),
		);

		const response = await request(app).get(
			`/api/equipment/${equipment.body.id}/weather`,
		);
		expect(response.status).toBe(503);

		vi.unstubAllGlobals();
		const health = await request(app).get('/api/health');
		expect(health.status).toBe(200);
	});

	it('returns 503 when the API request times out', async () => {
		const equipment = await createEquipment();
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockRejectedValue(
					Object.assign(new Error('aborted'), { name: 'AbortError' }),
				),
		);

		const response = await request(app).get(
			`/api/equipment/${equipment.body.id}/weather`,
		);

		expect(response.status).toBe(503);
	});

	it('returns 503 when the API responds with an error status', async () => {
		const equipment = await createEquipment();
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({ ok: false, status: 500 }),
		);

		const response = await request(app).get(
			`/api/equipment/${equipment.body.id}/weather`,
		);

		expect(response.status).toBe(503);
	});
});
