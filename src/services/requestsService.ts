import { ConflictError, NotFoundError } from '../errors/error.ts';
import { equipmentFindById } from '../repositories/equipmentRepositories.ts';
import {
	requestsDeleteData,
	requestsFindByEquipmentId,
	requestsFindById,
	requestsGetAllData,
	requestsMutateOne,
	requestsSaveData,
	requestsUpdateData,
} from '../repositories/requestsRepositories.ts';
import type { RequestType } from '../types.ts';
import { paginate, sortByField } from './listQuery.ts';

const CLOSED_REQUEST_STATUSES: RequestType['status'][] = ['done', 'rejected'];

const STATUS_TRANSITIONS: Record<
	RequestType['status'],
	RequestType['status'][]
> = {
	new: ['in_progress', 'rejected'],
	in_progress: ['done', 'rejected'],
	done: [],
	rejected: [],
};

const SORTABLE_FIELDS = [
	'createdAt',
	'updatedAt',
	'plannedAt',
	'priority',
	'title',
] as const;

const PRIORITY_RANK: Record<RequestType['priority'], number> = {
	low: 0,
	medium: 1,
	high: 2,
	critical: 3,
};

export type RequestListQuery = {
	status?: string;
	priority?: string;
	equipmentId?: string;
	dateFrom?: string;
	dateTo?: string;
	sort?: string;
	page?: string;
	limit?: string;
};

const matchesFilters = (request: RequestType, query: RequestListQuery) =>
	(!query.status || request.status === query.status) &&
	(!query.priority || request.priority === query.priority) &&
	(!query.equipmentId || request.equipmentId === query.equipmentId) &&
	(!query.dateFrom || request.createdAt >= query.dateFrom) &&
	(!query.dateTo || request.createdAt <= query.dateTo);

const sortRequests = (list: RequestType[], sort: string | undefined) =>
	sortByField(list, sort, SORTABLE_FIELDS, (item, field) =>
		field === 'priority' ? PRIORITY_RANK[item.priority] : (item[field] ?? ''),
	);

export const requestsServiceCreate = async (
	body: Omit<RequestType, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
) => {
	const equipment = await equipmentFindById(body.equipmentId);
	if (!equipment) throw new NotFoundError('Оборудование', 'не найдено');

	const now = new Date().toISOString();
	const newRequest: RequestType = {
		id: crypto.randomUUID(),
		...body,
		status: 'new',
		createdAt: now,
		updatedAt: now,
	};
	return requestsSaveData(newRequest);
};

export const requestsServiceGetAll = async (query: RequestListQuery) => {
	const data = await requestsGetAllData();

	const filtered = data.filter((request) => matchesFilters(request, query));
	const sorted = sortRequests(filtered, query.sort);

	return paginate(sorted, query.page, query.limit);
};

export const requestsServiceGetById = async (id: string) => {
	const requestItem = await requestsFindById(id);
	if (!requestItem) throw new NotFoundError('Заявка', 'не найдена');
	return requestItem;
};

export const requestsServiceUpdate = async (
	id: string,
	body: Partial<
		Pick<RequestType, 'title' | 'description' | 'priority' | 'plannedAt'>
	>,
) => {
	const updated = await requestsUpdateData(id, {
		...body,
		updatedAt: new Date().toISOString(),
	});
	if (!updated) throw new NotFoundError('Заявка', 'не найдена');
	return updated;
};

export const requestsServiceUpdateStatus = async (
	id: string,
	status: RequestType['status'],
) => {
	const updated = await requestsMutateOne(id, (current) => {
		const allowedTransitions = STATUS_TRANSITIONS[current.status];
		if (!allowedTransitions.includes(status)) {
			throw new ConflictError(
				`Недопустимый переход статуса: ${current.status} → ${status}`,
			);
		}
		return { ...current, status, updatedAt: new Date().toISOString() };
	});
	if (!updated) throw new NotFoundError('Заявка', 'не найдена');
	return updated;
};

export const requestsServiceDelete = async (id: string) => {
	const deleted = await requestsDeleteData(id);
	if (!deleted) throw new NotFoundError('Заявка', 'не найдена');
};

export const hasOpenRequestsForEquipment = async (equipmentId: string) => {
	const requests = await requestsFindByEquipmentId(equipmentId);
	return requests.some(
		(request) => !CLOSED_REQUEST_STATUSES.includes(request.status),
	);
};

export const requestsServiceGetByEquipmentId = async (
	equipmentId: string,
	query: RequestListQuery,
) => {
	const equipment = await equipmentFindById(equipmentId);
	if (!equipment) throw new NotFoundError('Оборудование', 'не найдено');

	const { equipmentId: _ignoredEquipmentId, ...rest } = query;
	return requestsServiceGetAll({ ...rest, equipmentId });
};
