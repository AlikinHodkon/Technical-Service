import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { MaintenanceRequest } from '../../models/maintenance-request.model.ts';
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

describe('GET /api/reports/equipment-load', () => {
	it('returns a row per equipment with counts and planned hours', async () => {
		const site = await createTestSite();
		const equipment = await createEquipmentFor(site.id, 'SN-LOAD-1');
		const technician = await createTestTechnician();

		const closedRequest = await createRequestFor(equipment.body.id, 'high');
		await request(app)
			.post(`/api/requests/${closedRequest.body.id}/assignees`)
			.set('Authorization', bearer(adminToken))
			.send([{ technicianId: technician.id, role: 'lead', hours: 6 }]);
		await request(app)
			.patch(`/api/requests/${closedRequest.body.id}/status`)
			.set('Authorization', bearer(adminToken))
			.send({ status: 'in_progress', author: 'Тест' });
		await request(app)
			.patch(`/api/requests/${closedRequest.body.id}/status`)
			.set('Authorization', bearer(adminToken))
			.send({ status: 'done', author: 'Тест' });

		await createRequestFor(equipment.body.id, 'low');

		const response = await request(app)
			.get('/api/reports/equipment-load')
			.set('Authorization', bearer(adminToken));

		expect(response.status).toBe(200);
		const row = response.body.find(
			(item: { equipmentId: string }) => item.equipmentId === equipment.body.id,
		);
		expect(row).toBeTruthy();
		expect(row.requestsCount).toBe(2);
		expect(row.closedCount).toBe(1);
		expect(row.plannedHoursSum).toBe(6);
	});

	it('filters by minRequests', async () => {
		const site = await createTestSite();
		const busyEquipment = await createEquipmentFor(site.id, 'SN-LOAD-BUSY');
		const idleEquipment = await createEquipmentFor(site.id, 'SN-LOAD-IDLE');
		await createRequestFor(busyEquipment.body.id, 'low');
		await createRequestFor(busyEquipment.body.id, 'low');

		const response = await request(app)
			.get('/api/reports/equipment-load')
			.set('Authorization', bearer(adminToken))
			.query({ minRequests: 2 });

		expect(response.status).toBe(200);
		const ids = response.body.map(
			(item: { equipmentId: string }) => item.equipmentId,
		);
		expect(ids).toContain(busyEquipment.body.id);
		expect(ids).not.toContain(idleEquipment.body.id);
	});

	it('filters by dateFrom/dateTo', async () => {
		const site = await createTestSite();
		const equipment = await createEquipmentFor(site.id, 'SN-LOAD-DATE');

		await MaintenanceRequest.create({
			equipmentId: equipment.body.id,
			title: 'Старая заявка',
			priorityCode: 'low',
			statusCode: 'new',
			author: 'Тест',
			createdAt: new Date('2020-01-01T00:00:00.000Z'),
			updatedAt: new Date('2020-01-01T00:00:00.000Z'),
		});
		await createRequestFor(equipment.body.id, 'low');

		const response = await request(app)
			.get('/api/reports/equipment-load')
			.set('Authorization', bearer(adminToken))
			.query({ dateFrom: '2024-01-01T00:00:00.000Z' });

		expect(response.status).toBe(200);
		const row = response.body.find(
			(item: { equipmentId: string }) => item.equipmentId === equipment.body.id,
		);
		expect(row.requestsCount).toBe(1);
	});

	it('returns 400 for an invalid minRequests', async () => {
		const response = await request(app)
			.get('/api/reports/equipment-load')
			.set('Authorization', bearer(adminToken))
			.query({ minRequests: -1 });

		expect(response.status).toBe(400);
	});

	it('returns 401 without a token', async () => {
		const response = await request(app).get('/api/reports/equipment-load');

		expect(response.status).toBe(401);
	});
});
