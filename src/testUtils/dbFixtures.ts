import { Equipment } from '../../models/equipment.model.ts';
import { MaintenanceRequest } from '../../models/maintenance-request.model.ts';
import { Site } from '../../models/site.model.ts';
import { Technician } from '../../models/technician.model.ts';
import { User } from '../../models/user.model.ts';
import { sequelize } from '../config/db.ts';

// request_status_history/request_assignees/equipment_passports не чистим напрямую —
// ON DELETE CASCADE на родителей (app_user и так не может писать в историю).
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
	await User.destroy({ where: {}, force: true });
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
