import { readFileSync } from 'node:fs';
import { Equipment } from '../models/equipment.model.ts';
import { MaintenanceRequest } from '../models/maintenance-request.model.ts';
import { Site } from '../models/site.model.ts';
import { sequelize } from '../src/config/db.ts';
import { logger } from '../src/config/logger.ts';

type LegacyEquipment = {
	id: string;
	name: string;
	type: string;
	serialNumber: string;
	status: string;
	installedAt?: string;
};

type LegacyRequest = {
	id: string;
	equipmentId: string;
	title: string;
	description?: string;
	priority: string;
	status: string;
	plannedAt?: string;
	author?: string;
	createdAt: string;
	updatedAt: string;
};

const readLegacyFile = <T>(path: string): T[] | null => {
	try {
		return JSON.parse(readFileSync(path, 'utf-8'));
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
			return null;
		}
		throw err;
	}
};

async function main() {
	const legacyEquipment = readLegacyFile<LegacyEquipment>(
		'./storage/equipment.json',
	);
	const legacyRequests = readLegacyFile<LegacyRequest>(
		'./storage/requests.json',
	);

	if (!legacyEquipment && !legacyRequests) {
		logger.info('Файлового хранилища Кейса 2 не найдено, переносить нечего');
		return;
	}

	await sequelize.transaction(async (t) => {
		const defaultSite = await Site.create(
			{
				name: 'Импортировано из Кейса 2',
				code: 'LEGACY',
				region: 'н/д',
				coordinates: { lat: 0, lon: 0 },
			},
			{ transaction: t },
		);

		const equipmentIdMap = new Map<string, string>();

		for (const oldEq of legacyEquipment ?? []) {
			const created = await Equipment.create(
				{
					siteId: defaultSite.id,
					name: oldEq.name,
					typeCode: oldEq.type,
					serialNumber: oldEq.serialNumber,
					statusCode: oldEq.status,
					installedAt: oldEq.installedAt ?? null,
				},
				{ transaction: t },
			);
			equipmentIdMap.set(oldEq.id, created.id);
		}

		for (const oldReq of legacyRequests ?? []) {
			const newEquipmentId = equipmentIdMap.get(oldReq.equipmentId);
			if (!newEquipmentId) {
				logger.warn(
					`Пропущена заявка ${oldReq.id}: оборудование ${oldReq.equipmentId} не найдено`,
				);
				continue;
			}
			await MaintenanceRequest.create(
				{
					equipmentId: newEquipmentId,
					title: oldReq.title,
					description: oldReq.description ?? null,
					priorityCode: oldReq.priority,
					statusCode: oldReq.status,
					plannedAt: oldReq.plannedAt ? new Date(oldReq.plannedAt) : null,
					author: oldReq.author ?? 'legacy-import',
					createdAt: new Date(oldReq.createdAt),
					updatedAt: new Date(oldReq.updatedAt),
				},
				{ transaction: t },
			);
		}
	});

	logger.info('Миграция данных завершена');
}

main()
	.catch((err) => {
		logger.error(err, 'Ошибка миграции данных');
		process.exitCode = 1;
	})
	.finally(() => sequelize.close());
