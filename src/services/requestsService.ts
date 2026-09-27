import { ForeignKeyConstraintError, Op, type WhereOptions } from 'sequelize';
import { MaintenanceRequest } from '../../models/maintenance-request.model.ts';
import { RequestAssignee } from '../../models/request-assignee.model.ts';
import { RequestStatusHistory } from '../../models/request-status-history.model.ts';
import { sequelize } from '../config/db.ts';
import { ConflictError, NotFoundError } from '../errors/error.ts';
import { equipmentFindById } from '../repositories/equipmentRepositories.ts';
import {
	requestsDeleteData,
	requestsFindByEquipmentId,
	requestsFindById,
	requestsFindMany,
	requestsSaveData,
	requestsUpdateData,
} from '../repositories/requestsRepositories.ts';
import type { RequestStatusCode } from '../validators/lookups.ts';
import type {
	CreateRequestBody,
	GetRequestsQuery,
	UpdateRequestBody,
	UpdateRequestStatusBody,
} from '../validators/requests.validator.ts';

const CLOSED_REQUEST_STATUSES: RequestStatusCode[] = ['done', 'rejected'];

const STATUS_TRANSITIONS: Record<RequestStatusCode, RequestStatusCode[]> = {
	new: ['in_progress', 'rejected'],
	in_progress: ['done', 'rejected'],
	done: [],
	rejected: [],
};

// Внешний контракт использует priority/status; priorityCode/statusCode
// заняты в модели под belongsTo-ассоциации, маппинг живёт тут, на границе.
const SORT_FIELD_MAP: Record<string, string> = {
	priority: 'priorityCode',
};

const toRequestResponse = (request: MaintenanceRequest) => {
	const { priorityCode, statusCode, ...rest } = request.toJSON();
	return { ...rest, priority: priorityCode, status: statusCode };
};

export const requestsServiceCreate = async (body: CreateRequestBody) => {
	const equipment = await equipmentFindById(body.equipmentId);
	if (!equipment) throw new NotFoundError('Оборудование', 'не найдено');

	const created = await requestsSaveData({
		equipmentId: body.equipmentId,
		title: body.title,
		description: body.description ?? null,
		priorityCode: body.priority,
		plannedAt: body.plannedAt ? new Date(body.plannedAt) : null,
		author: body.author,
		createdAt: new Date(),
		updatedAt: new Date(),
	});
	return toRequestResponse(created);
};

export const requestsServiceGetAll = async (query: GetRequestsQuery) => {
	const where: WhereOptions = {};
	if (query.status) where.statusCode = query.status;
	if (query.priority) where.priorityCode = query.priority;
	if (query.equipmentId) where.equipmentId = query.equipmentId;
	if (query.dateFrom || query.dateTo) {
		where.createdAt = {};
		if (query.dateFrom) where.createdAt[Op.gte] = query.dateFrom;
		if (query.dateTo) where.createdAt[Op.lte] = query.dateTo;
	}

	const sortField = SORT_FIELD_MAP[query.sort] ?? query.sort;
	const { count, rows } = await requestsFindMany({
		where,
		order: [[sortField, query.order]],
		limit: query.limit,
		offset: (query.page - 1) * query.limit,
	});
	return {
		data: rows.map(toRequestResponse),
		total: count,
		page: query.page,
		limit: query.limit,
	};
};

export const requestsServiceGetById = async (id: string) => {
	const requestItem = await requestsFindById(id);
	if (!requestItem) throw new NotFoundError('Заявка', 'не найдена');
	return toRequestResponse(requestItem);
};

export const requestsServiceUpdate = async (
	id: string,
	body: UpdateRequestBody,
) => {
	const { priority, ...rest } = body;
	const updated = await requestsUpdateData(id, {
		...rest,
		...(priority !== undefined && { priorityCode: priority }),
		plannedAt: body.plannedAt ? new Date(body.plannedAt) : undefined,
		updatedAt: new Date(),
	});
	if (!updated) throw new NotFoundError('Заявка', 'не найдена');
	return toRequestResponse(updated);
};

export const requestsServiceUpdateStatus = async (
	id: string,
	body: UpdateRequestStatusBody,
) => {
	return sequelize.transaction(async (t) => {
		// Лочим саму строку заявки без include — Postgres не разрешает
		// FOR UPDATE вместе с LEFT JOIN на BelongsToMany (нулевая сторона
		// внешнего джойна), поэтому число исполнителей считаем отдельным
		// запросом в той же транзакции.
		const current = await MaintenanceRequest.findByPk(id, {
			transaction: t,
			lock: t.LOCK.UPDATE,
		});
		if (!current) throw new NotFoundError('Заявка', 'не найдена');

		const allowedTransitions =
			STATUS_TRANSITIONS[current.statusCode as RequestStatusCode];
		if (!allowedTransitions?.includes(body.status)) {
			throw new ConflictError(
				`Недопустимый переход статуса: ${current.statusCode} → ${body.status}`,
			);
		}

		if (body.status === 'in_progress') {
			const assigneeCount = await RequestAssignee.count({
				where: { requestId: id },
				transaction: t,
			});
			if (assigneeCount === 0) {
				throw new ConflictError(
					'Нельзя перевести заявку в работу без назначенных исполнителей',
				);
			}
		}

		const oldStatusCode = current.statusCode;
		await current.update(
			{ statusCode: body.status, updatedAt: new Date() },
			{ transaction: t },
		);
		await RequestStatusHistory.create(
			{
				requestId: id,
				oldStatusCode,
				newStatusCode: body.status,
				author: body.author,
				changedAt: new Date(),
			},
			{ transaction: t },
		);
		return toRequestResponse(current);
	});
};

export const requestsServiceDelete = async (id: string) => {
	try {
		const count = await requestsDeleteData(id);
		if (!count) throw new NotFoundError('Заявка', 'не найдена');
		return count > 0;
	} catch (error) {
		if (error instanceof ForeignKeyConstraintError) {
			throw new ConflictError('Нельзя удалить заявку с историей статусов');
		}
		throw error;
	}
};

export const requestsServiceGetHistory = async (id: string) => {
	await requestsServiceGetById(id);
	return RequestStatusHistory.findAll({
		where: { requestId: id },
		order: [['changedAt', 'ASC']],
	});
};

export const hasOpenRequestsForEquipment = async (equipmentId: string) => {
	const requests = await requestsFindByEquipmentId(equipmentId);
	return requests.some(
		(request) =>
			!CLOSED_REQUEST_STATUSES.includes(
				request.statusCode as RequestStatusCode,
			),
	);
};

export const requestsServiceGetByEquipmentId = async (
	equipmentId: string,
	query: GetRequestsQuery,
) => {
	const equipment = await equipmentFindById(equipmentId);
	if (!equipment) throw new NotFoundError('Оборудование', 'не найдено');

	const { equipmentId: _ignoredEquipmentId, ...rest } = query;
	return requestsServiceGetAll({ ...rest, equipmentId });
};
