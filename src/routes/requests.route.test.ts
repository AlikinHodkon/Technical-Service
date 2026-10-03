import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../app.ts';
import { bearer, makeToken } from '../testUtils/authFixtures.ts';
import {
	createTestSite,
	createTestTechnician,
	resetDb,
} from '../testUtils/dbFixtures.ts';

const adminToken = makeToken('admin');
const viewerToken = makeToken('viewer');

const baseEquipment = (siteId: string) => ({
	siteId,
	name: 'Турбина №7',
	type: 'turbine',
	serialNumber: 'WT-2024-0007',
	status: 'operational',
	installedAt: '2024-06-01',
});

const baseRequest = {
	title: 'Заменить датчик вибрации',
	description: 'Датчик показывает нестабильные значения',
	priority: 'medium',
	author: 'Оператор',
};

const createEquipment = async (overrides: Record<string, unknown> = {}) => {
	const site = await createTestSite();
	return request(app)
		.post('/api/equipment')
		.set('Authorization', bearer(adminToken))
		.send({ ...baseEquipment(site.id), ...overrides });
};

const createRequestFor = (
	equipmentId: string,
	overrides: Record<string, unknown> = {},
) =>
	request(app)
		.post('/api/requests')
		.set('Authorization', bearer(adminToken))
		.send({ ...baseRequest, equipmentId, ...overrides });

const assignLead = async (requestId: string) => {
	const technician = await createTestTechnician();
	await request(app)
		.post(`/api/requests/${requestId}/assignees`)
		.set('Authorization', bearer(adminToken))
		.send([{ technicianId: technician.id, role: 'lead' }]);
	return technician;
};

beforeEach(async () => {
	await resetDb();
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
		const response = await createRequestFor(crypto.randomUUID());

		expect(response.status).toBe(404);
	});

	it('returns 422 when title is too short', async () => {
		const equipment = await createEquipment();

		const response = await createRequestFor(equipment.body.id, {
			title: 'abc',
		});

		expect(response.status).toBe(422);
	});

	it('returns 401 without a token', async () => {
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
			.set('Authorization', bearer(adminToken))
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
			.set('Authorization', bearer(adminToken))
			.send({
				requests: [{ ...baseRequest, equipmentId: equipment.body.id }],
			});

		const list = await request(app)
			.get('/api/requests')
			.set('Authorization', bearer(adminToken));
		expect(list.body.total).toBe(1);
	});

	it('returns 422 when the requests array is empty', async () => {
		const response = await request(app)
			.post('/api/requests/bulk')
			.set('Authorization', bearer(adminToken))
			.send({ requests: [] });

		expect(response.status).toBe(422);
	});

	it('returns 401 without a token', async () => {
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

		const response = await request(app)
			.get('/api/requests')
			.set('Authorization', bearer(adminToken));

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
			.set('Authorization', bearer(adminToken))
			.query({ priority: 'high', equipmentId: equipmentB.body.id });

		expect(response.status).toBe(200);
		expect(response.body.total).toBe(1);
		expect(response.body.data[0].priority).toBe('high');
	});
});

describe('GET /api/requests/:id', () => {
	it('returns the request card with assigned technicians', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);
		const technician = await assignLead(created.body.id);

		const response = await request(app)
			.get(`/api/requests/${created.body.id}`)
			.set('Authorization', bearer(adminToken));

		expect(response.status).toBe(200);
		expect(response.body.id).toBe(created.body.id);
		expect(response.body.technicians).toHaveLength(1);
		expect(response.body.technicians[0].id).toBe(technician.id);
	});

	it('returns 404 for unknown id', async () => {
		const response = await request(app)
			.get(`/api/requests/${crypto.randomUUID()}`)
			.set('Authorization', bearer(adminToken));

		expect(response.status).toBe(404);
	});

	it('returns 422 for a malformed id', async () => {
		const response = await request(app)
			.get('/api/requests/unknown-id')
			.set('Authorization', bearer(adminToken));

		expect(response.status).toBe(422);
	});
});

describe('PATCH /api/requests/:id', () => {
	it('updates regular fields', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);

		const response = await request(app)
			.patch(`/api/requests/${created.body.id}`)
			.set('Authorization', bearer(adminToken))
			.send({ priority: 'critical' });

		expect(response.status).toBe(200);
		expect(response.body.priority).toBe('critical');
	});

	it('ignores an attempt to change status through this endpoint', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);

		const response = await request(app)
			.patch(`/api/requests/${created.body.id}`)
			.set('Authorization', bearer(adminToken))
			.send({ status: 'done', priority: 'high' });

		expect(response.status).toBe(200);
		expect(response.body.status).toBe('new');
		expect(response.body.priority).toBe('high');
	});

	it('returns 404 for unknown id', async () => {
		const response = await request(app)
			.patch(`/api/requests/${crypto.randomUUID()}`)
			.set('Authorization', bearer(adminToken))
			.send({ priority: 'high' });

		expect(response.status).toBe(404);
	});

	it('returns 422 for a malformed id', async () => {
		const response = await request(app)
			.patch('/api/requests/unknown-id')
			.set('Authorization', bearer(adminToken))
			.send({ priority: 'high' });

		expect(response.status).toBe(422);
	});

	it('returns 401 without a token', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);

		const response = await request(app)
			.patch(`/api/requests/${created.body.id}`)
			.send({ priority: 'high' });

		expect(response.status).toBe(401);
	});

	it('returns 403 for a viewer', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);

		const response = await request(app)
			.patch(`/api/requests/${created.body.id}`)
			.set('Authorization', bearer(viewerToken))
			.send({ priority: 'high' });

		expect(response.status).toBe(403);
	});
});

describe('PATCH /api/requests/:id/status', () => {
	it('allows a valid transition when assignees are present', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);
		await assignLead(created.body.id);

		const response = await request(app)
			.patch(`/api/requests/${created.body.id}/status`)
			.set('Authorization', bearer(adminToken))
			.send({ status: 'in_progress', author: 'Тест' });

		expect(response.status).toBe(200);
		expect(response.body.status).toBe('in_progress');
	});

	it('returns 409 when moving to in_progress without assignees', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);

		const response = await request(app)
			.patch(`/api/requests/${created.body.id}/status`)
			.set('Authorization', bearer(adminToken))
			.send({ status: 'in_progress', author: 'Тест' });

		expect(response.status).toBe(409);
	});

	it('returns 409 on an invalid transition', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);

		const response = await request(app)
			.patch(`/api/requests/${created.body.id}/status`)
			.set('Authorization', bearer(adminToken))
			.send({ status: 'done', author: 'Тест' });

		expect(response.status).toBe(409);
	});

	it('returns 409 when transitioning from a closed status', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);
		await request(app)
			.patch(`/api/requests/${created.body.id}/status`)
			.set('Authorization', bearer(adminToken))
			.send({ status: 'rejected', author: 'Тест' });

		const response = await request(app)
			.patch(`/api/requests/${created.body.id}/status`)
			.set('Authorization', bearer(adminToken))
			.send({ status: 'in_progress', author: 'Тест' });

		expect(response.status).toBe(409);
	});

	it('records a status-history entry on a successful transition', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);
		await assignLead(created.body.id);
		await request(app)
			.patch(`/api/requests/${created.body.id}/status`)
			.set('Authorization', bearer(adminToken))
			.send({ status: 'in_progress', author: 'Тест' });

		const history = await request(app)
			.get(`/api/requests/${created.body.id}/history`)
			.set('Authorization', bearer(adminToken));

		expect(history.status).toBe(200);
		expect(history.body).toHaveLength(1);
		expect(history.body[0]).toMatchObject({
			oldStatusCode: 'new',
			newStatusCode: 'in_progress',
			author: 'Тест',
		});
	});

	it('returns 404 for unknown id', async () => {
		const response = await request(app)
			.patch(`/api/requests/${crypto.randomUUID()}/status`)
			.set('Authorization', bearer(adminToken))
			.send({ status: 'in_progress', author: 'Тест' });

		expect(response.status).toBe(404);
	});

	it('returns 422 for a malformed id', async () => {
		const response = await request(app)
			.patch('/api/requests/unknown-id/status')
			.set('Authorization', bearer(adminToken))
			.send({ status: 'in_progress', author: 'Тест' });

		expect(response.status).toBe(422);
	});

	it('returns 401 without a token', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);

		const response = await request(app)
			.patch(`/api/requests/${created.body.id}/status`)
			.send({ status: 'in_progress', author: 'Тест' });

		expect(response.status).toBe(401);
	});

	it('allows a technician assigned to the request (ABAC)', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);
		const technician = await assignLead(created.body.id);
		const technicianToken = makeToken('technician', {
			technicianId: technician.id,
		});

		const response = await request(app)
			.patch(`/api/requests/${created.body.id}/status`)
			.set('Authorization', bearer(technicianToken))
			.send({ status: 'in_progress', author: 'Тест' });

		expect(response.status).toBe(200);
		expect(response.body.status).toBe('in_progress');
	});

	it('returns 403 for a technician not assigned to the request (ABAC)', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);
		await assignLead(created.body.id);
		const otherTechnician = await createTestTechnician();
		const technicianToken = makeToken('technician', {
			technicianId: otherTechnician.id,
		});

		const response = await request(app)
			.patch(`/api/requests/${created.body.id}/status`)
			.set('Authorization', bearer(technicianToken))
			.send({ status: 'in_progress', author: 'Тест' });

		expect(response.status).toBe(403);
	});
});

describe('DELETE /api/requests/:id', () => {
	it('returns 204 and removes the request', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);

		const response = await request(app)
			.delete(`/api/requests/${created.body.id}`)
			.set('Authorization', bearer(adminToken));
		expect(response.status).toBe(204);

		const getResponse = await request(app)
			.get(`/api/requests/${created.body.id}`)
			.set('Authorization', bearer(adminToken));
		expect(getResponse.status).toBe(404);
	});

	it('returns 404 for unknown id', async () => {
		const response = await request(app)
			.delete(`/api/requests/${crypto.randomUUID()}`)
			.set('Authorization', bearer(adminToken));

		expect(response.status).toBe(404);
	});

	it('returns 422 for a malformed id', async () => {
		const response = await request(app)
			.delete('/api/requests/unknown-id')
			.set('Authorization', bearer(adminToken));

		expect(response.status).toBe(422);
	});

	it('returns 401 without a token', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);

		const response = await request(app).delete(
			`/api/requests/${created.body.id}`,
		);

		expect(response.status).toBe(401);
	});
});

describe('POST /api/requests/:id/assignees', () => {
	it('returns 200 and replaces the assignee list', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);
		const lead = await createTestTechnician();
		const member = await createTestTechnician();

		const response = await request(app)
			.post(`/api/requests/${created.body.id}/assignees`)
			.set('Authorization', bearer(adminToken))
			.send([
				{ technicianId: lead.id, role: 'lead', hours: 4 },
				{ technicianId: member.id, role: 'member' },
			]);

		expect(response.status).toBe(200);
		expect(response.body).toHaveLength(2);
	});

	it('returns 422 when there is no lead', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);
		const member = await createTestTechnician();

		const response = await request(app)
			.post(`/api/requests/${created.body.id}/assignees`)
			.set('Authorization', bearer(adminToken))
			.send([{ technicianId: member.id, role: 'member' }]);

		expect(response.status).toBe(422);
	});

	it('returns 422 when there are two leads', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);
		const leadA = await createTestTechnician();
		const leadB = await createTestTechnician();

		const response = await request(app)
			.post(`/api/requests/${created.body.id}/assignees`)
			.set('Authorization', bearer(adminToken))
			.send([
				{ technicianId: leadA.id, role: 'lead' },
				{ technicianId: leadB.id, role: 'lead' },
			]);

		expect(response.status).toBe(422);
	});

	it('returns 422 when the same technicianId repeats in the body', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);
		const technician = await createTestTechnician();

		const response = await request(app)
			.post(`/api/requests/${created.body.id}/assignees`)
			.set('Authorization', bearer(adminToken))
			.send([
				{ technicianId: technician.id, role: 'lead' },
				{ technicianId: technician.id, role: 'member' },
			]);

		expect(response.status).toBe(422);
	});

	it('returns 404 for an unknown request id', async () => {
		const technician = await createTestTechnician();

		const response = await request(app)
			.post(`/api/requests/${crypto.randomUUID()}/assignees`)
			.set('Authorization', bearer(adminToken))
			.send([{ technicianId: technician.id, role: 'lead' }]);

		expect(response.status).toBe(404);
	});

	it('returns 404 for an unknown technician id', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);

		const response = await request(app)
			.post(`/api/requests/${created.body.id}/assignees`)
			.set('Authorization', bearer(adminToken))
			.send([{ technicianId: crypto.randomUUID(), role: 'lead' }]);

		expect(response.status).toBe(404);
	});

	it('rolls back entirely when the request is invalid (no leftover assignees)', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);
		await assignLead(created.body.id);

		const member = await createTestTechnician();
		const badResponse = await request(app)
			.post(`/api/requests/${created.body.id}/assignees`)
			.set('Authorization', bearer(adminToken))
			.send([{ technicianId: member.id, role: 'member' }]);
		expect(badResponse.status).toBe(422);

		const requestCard = await request(app)
			.get(`/api/requests/${created.body.id}`)
			.set('Authorization', bearer(adminToken));
		expect(requestCard.body.technicians).toHaveLength(1);
	});

	it('returns 401 without a token', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);
		const technician = await createTestTechnician();

		const response = await request(app)
			.post(`/api/requests/${created.body.id}/assignees`)
			.send([{ technicianId: technician.id, role: 'lead' }]);

		expect(response.status).toBe(401);
	});

	it('returns 403 for a technician (admin-only)', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);
		const technician = await createTestTechnician();
		const technicianToken = makeToken('technician', {
			technicianId: technician.id,
		});

		const response = await request(app)
			.post(`/api/requests/${created.body.id}/assignees`)
			.set('Authorization', bearer(technicianToken))
			.send([{ technicianId: technician.id, role: 'lead' }]);

		expect(response.status).toBe(403);
	});
});

describe('DELETE /api/requests/:id/assignees/:userId', () => {
	it('returns 204 and removes the assignment', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);
		const technician = await assignLead(created.body.id);

		const response = await request(app)
			.delete(`/api/requests/${created.body.id}/assignees/${technician.id}`)
			.set('Authorization', bearer(adminToken));

		expect(response.status).toBe(204);
	});

	it('returns 404 when the assignment does not exist', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);
		const technician = await createTestTechnician();

		const response = await request(app)
			.delete(`/api/requests/${created.body.id}/assignees/${technician.id}`)
			.set('Authorization', bearer(adminToken));

		expect(response.status).toBe(404);
	});

	it('returns 401 without a token', async () => {
		const equipment = await createEquipment();
		const created = await createRequestFor(equipment.body.id);
		const technician = await assignLead(created.body.id);

		const response = await request(app).delete(
			`/api/requests/${created.body.id}/assignees/${technician.id}`,
		);

		expect(response.status).toBe(401);
	});
});

describe('GET /api/requests/:id/history', () => {
	it('returns 404 for unknown id', async () => {
		const response = await request(app)
			.get(`/api/requests/${crypto.randomUUID()}/history`)
			.set('Authorization', bearer(adminToken));

		expect(response.status).toBe(404);
	});
});
