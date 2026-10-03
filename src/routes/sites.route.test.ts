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

beforeEach(async () => {
	await resetDb();
});

const createEquipmentFor = (siteId: string, serialNumber: string) =>
	request(app)
		.post('/api/equipment')
		.set('Authorization', bearer(adminToken))
		.send({
			siteId,
			name: 'Турбина',
			type: 'turbine',
			serialNumber,
			status: 'operational',
			installedAt: '2024-06-01',
		});

const createRequestFor = (equipmentId: string, priority: string) =>
	request(app)
		.post('/api/requests')
		.set('Authorization', bearer(adminToken))
		.send({
			equipmentId,
			title: 'Плановое обслуживание',
			priority,
			author: 'Тест',
		});

const setStatus = (requestId: string, status: string) =>
	request(app)
		.patch(`/api/requests/${requestId}/status`)
		.set('Authorization', bearer(adminToken))
		.send({ status, author: 'Тест' });

describe('GET /api/sites/:id/summary', () => {
	it('returns 404 for unknown site id', async () => {
		const response = await request(app)
			.get(`/api/sites/${crypto.randomUUID()}/summary`)
			.set('Authorization', bearer(adminToken));

		expect(response.status).toBe(404);
	});

	it('returns 422 for a malformed site id', async () => {
		const response = await request(app)
			.get('/api/sites/unknown-id/summary')
			.set('Authorization', bearer(adminToken));

		expect(response.status).toBe(422);
	});

	it('returns 401 without a token', async () => {
		const site = await createTestSite();
		const response = await request(app).get(`/api/sites/${site.id}/summary`);

		expect(response.status).toBe(401);
	});

	it('groups requests by status/priority and computes avg resolution time', async () => {
		const site = await createTestSite();
		const equipment = await createEquipmentFor(site.id, 'SN-SUMMARY-1');
		const technician = await createTestTechnician();

		const closedRequest = await createRequestFor(equipment.body.id, 'high');
		await request(app)
			.post(`/api/requests/${closedRequest.body.id}/assignees`)
			.set('Authorization', bearer(adminToken))
			.send([{ technicianId: technician.id, role: 'lead' }]);
		await setStatus(closedRequest.body.id, 'in_progress');
		await setStatus(closedRequest.body.id, 'done');

		await createRequestFor(equipment.body.id, 'low');

		const response = await request(app)
			.get(`/api/sites/${site.id}/summary`)
			.set('Authorization', bearer(adminToken));

		expect(response.status).toBe(200);
		expect(response.body.site.id).toBe(site.id);

		const byStatus = Object.fromEntries(
			response.body.byStatus.map((row: { code: string; count: number }) => [
				row.code,
				row.count,
			]),
		);
		expect(byStatus.done).toBe(1);
		expect(byStatus.new).toBe(1);

		const byPriority = Object.fromEntries(
			response.body.byPriority.map((row: { code: string; count: number }) => [
				row.code,
				row.count,
			]),
		);
		expect(byPriority.high).toBe(1);
		expect(byPriority.low).toBe(1);

		expect(response.body.avgResolutionHours).toBeGreaterThanOrEqual(0);
	});

	it('returns avgResolutionHours null when nothing is closed yet', async () => {
		const site = await createTestSite();
		const equipment = await createEquipmentFor(site.id, 'SN-SUMMARY-2');
		await createRequestFor(equipment.body.id, 'low');

		const response = await request(app)
			.get(`/api/sites/${site.id}/summary`)
			.set('Authorization', bearer(adminToken));

		expect(response.status).toBe(200);
		expect(response.body.avgResolutionHours).toBeNull();
	});

	it('scopes counts to the requested site only', async () => {
		const siteA = await createTestSite();
		const siteB = await createTestSite();
		const equipmentA = await createEquipmentFor(siteA.id, 'SN-SUMMARY-A');
		const equipmentB = await createEquipmentFor(siteB.id, 'SN-SUMMARY-B');
		await createRequestFor(equipmentA.body.id, 'low');
		await createRequestFor(equipmentB.body.id, 'low');
		await createRequestFor(equipmentB.body.id, 'low');

		const response = await request(app)
			.get(`/api/sites/${siteA.id}/summary`)
			.set('Authorization', bearer(adminToken));

		const total = response.body.byStatus.reduce(
			(sum: number, row: { count: number }) => sum + row.count,
			0,
		);
		expect(total).toBe(1);
	});
});
