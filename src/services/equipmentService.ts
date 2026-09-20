import { ConflictError, NotFoundError } from '../errors/error.ts';
import {
	equipmentCheckIsExist,
	equipmentDeleteData,
	equipmentFindById,
	equipmentGetAllData,
	equipmentSaveData,
	equipmentUpdateData,
} from '../repositories/equipmentRepositories.ts';
import type { EquipmentType } from '../types.ts';
import { paginate, sortByField } from './listQuery.ts';
import { hasOpenRequestsForEquipment } from './requestsService.ts';

const SORTABLE_FIELDS = [
	'name',
	'type',
	'serialNumber',
	'status',
	'installedAt',
] as const;

export type EquipmentListQuery = {
	status?: string;
	type?: string;
	sort?: string;
	page?: string;
	limit?: string;
};

export const equipmentServiceCreate = async (
	body: Omit<EquipmentType, 'id'>,
) => {
	const id = crypto.randomUUID();
	const isExist = await equipmentCheckIsExist(body.serialNumber);
	if (isExist) {
		throw new ConflictError('Оборудование с таким номером уже существует');
	}
	const result = await equipmentSaveData({ id, ...body });
	return result;
};

const matchesFilters = (equipment: EquipmentType, query: EquipmentListQuery) =>
	(!query.status || equipment.status === query.status) &&
	(!query.type || equipment.type === query.type);

export const equipmentServiceGetAll = async (query: EquipmentListQuery) => {
	const data = await equipmentGetAllData();

	const filtered = data.filter((equipment) => matchesFilters(equipment, query));
	const sorted = sortByField(filtered, query.sort, SORTABLE_FIELDS);

	return paginate(sorted, query.page, query.limit);
};

export const equipmentServiceGetById = async (id: string) => {
	const equipment = await equipmentFindById(id);
	if (!equipment) throw new NotFoundError('Оборудование', 'не найдено');
	return equipment;
};

export const equipmentServiceUpdate = async (
	id: string,
	body: Partial<Omit<EquipmentType, 'id'>>,
) => {
	const { id: _ignoredId, ...updates } = body as Partial<EquipmentType>;

	if (updates.serialNumber) {
		const existing = await equipmentFindById(id);
		if (!existing) throw new NotFoundError('Оборудование', 'не найдено');

		if (updates.serialNumber !== existing.serialNumber) {
			const isExist = await equipmentCheckIsExist(updates.serialNumber);
			if (isExist) {
				throw new ConflictError('Оборудование с таким номером уже существует');
			}
		}
	}

	const updated = await equipmentUpdateData(id, updates);
	if (!updated) throw new NotFoundError('Оборудование', 'не найдено');
	return updated;
};

export const equipmentServiceDelete = async (id: string) => {
	if (await hasOpenRequestsForEquipment(id)) {
		throw new ConflictError(
			'Нельзя удалить оборудование, по которому есть незакрытые заявки',
		);
	}

	const deleted = await equipmentDeleteData(id);
	if (!deleted) throw new NotFoundError('Оборудование', 'не найдено');
};
