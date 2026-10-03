import { Equipment } from '../../models/equipment.model.ts';
import { MaintenanceRequest } from '../../models/maintenance-request.model.ts';
import { Site } from '../../models/site.model.ts';
import { Technician } from '../../models/technician.model.ts';
import { sequelize } from '../config/db.ts';

// app_user намеренно не может UPDATE/DELETE request_status_history (см.
// миграцию create-app-role-and-grants — история неизменяема), поэтому здесь
// её не трогаем напрямую: request_assignees и request_status_history оба
// объявлены с ON DELETE CASCADE на maintenance_requests.id, так что удаление
// заявок каскадно подчищает и то, и другое. Аналогично equipment_passports
// каскадно уходит вместе с equipment.
export const resetDb = async () => {
	const dbName = sequelize.getDatabaseName();
	if (!dbName.includes('test')) {
		throw new Error(
			`resetDb() вызван против БД "${dbName}" — похоже, это не тестовая база. Проверь POSTGRES_DB/NODE_ENV.`,
		);
	}
	await MaintenanceRequest.destroy({ where: {}, force: true });
	await Equipment.destroy({ where: {}, force: true });
	await Technician.destroy({ where: {}, force: true });
	await Site.destroy({ where: {}, force: true });
};

export const createTestSite = (
	overrides: Partial<Parameters<typeof Site.create>[0]> = {},
) =>
	Site.create({
		name: 'Тестовая площадка',
		code: `SITE-${crypto.randomUUID().slice(0, 8)}`,
		region: 'Тестовый регион',
		coordinates: { lat: 55.75, lon: 37.62 },
		...overrides,
	});

export const createTestTechnician = (
	overrides: Partial<Parameters<typeof Technician.create>[0]> = {},
) =>
	Technician.create({
		fullName: 'Тестовый специалист',
		specialization: 'Тест',
		employeeNumber: `EMP-TEST-${crypto.randomUUID().slice(0, 8)}`,
		...overrides,
	});
