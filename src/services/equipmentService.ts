import { ConflictError, NotFoundError } from '../errors/error.ts';
import {
	equipmentCheckIsExist,
	equipmentDeleteData,
	equipmentFindById,
	equipmentGetAllData,
	equipmentSaveData,
	equipmentUpdateData,
} from '../repositories/equipmentRepositories.ts';
import { requestsFindByEquipmentId } from '../repositories/requestsRepositories.ts';
import type { EquipmentType } from '../types.ts';

const SORTABLE_FIELDS = [
	'name',
	'type',
	'serialNumber',
	'status',
	'installedAt',
] as const;

const CLOSED_REQUEST_STATUSES = ['done', 'rejected'];

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

const sortEquipment = (list: EquipmentType[], sort: string | undefined) => {
	if (!sort) return list;

	const isDescending = sort.startsWith('-');
	const field = (
		isDescending ? sort.slice(1) : sort
	) as (typeof SORTABLE_FIELDS)[number];
	if (!SORTABLE_FIELDS.includes(field)) return list;

	return list.toSorted((a, b) => {
		const direction = a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0;
		return isDescending ? -direction : direction;
	});
};

export const equipmentServiceGetAll = async (query: EquipmentListQuery) => {
	const data = await equipmentGetAllData();

	const filtered = data.filter((equipment) => matchesFilters(equipment, query));
	const sorted = sortEquipment(filtered, query.sort);

	const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
	const limit = Math.max(Number.parseInt(query.limit ?? '20', 10) || 1, 1);
	const start = (page - 1) * limit;

	return {
		data: sorted.slice(start, start + limit),
		total: sorted.length,
		page,
		limit,
	};
};

export const equipmentServiceGetById = async (id: string) => {
	const equipment = await equipmentFindById(id);
	if (!equipment) throw new NotFoundError('Оборудование');
	return equipment;
};

export const equipmentServiceUpdate = async (
	id: string,
	body: Partial<Omit<EquipmentType, 'id'>>,
) => {
	const existing = await equipmentFindById(id);
	if (!existing) throw new NotFoundError('Оборудование');

	const { id: _ignoredId, ...updates } = body as Partial<EquipmentType>;

	if (updates.serialNumber && updates.serialNumber !== existing.serialNumber) {
		const isExist = await equipmentCheckIsExist(updates.serialNumber);
		if (isExist) {
			throw new ConflictError('Оборудование с таким номером уже существует');
		}
	}

	const updated = await equipmentUpdateData(id, updates);
	return updated as EquipmentType;
};

export const equipmentServiceDelete = async (id: string) => {
	const existing = await equipmentFindById(id);
	if (!existing) throw new NotFoundError('Оборудование');

	const requests = await requestsFindByEquipmentId(id);
	const hasOpenRequests = requests.some(
		(request) => !CLOSED_REQUEST_STATUSES.includes(request.status),
	);
	if (hasOpenRequests) {
		throw new ConflictError(
			'Нельзя удалить оборудование, по которому есть незакрытые заявки',
		);
	}

	await equipmentDeleteData(id);
};
