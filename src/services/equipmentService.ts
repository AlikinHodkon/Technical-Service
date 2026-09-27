import {
	DatabaseError,
	ForeignKeyConstraintError,
	Op,
	UniqueConstraintError,
	type WhereOptions,
} from 'sequelize';

// Postgres поднимает RESTRICT-нарушение при удалении родителя с кодом 23001
// (restrict_violation), а не 23503 (foreign_key_violation) — Sequelize не
// оборачивает его в ForeignKeyConstraintError, только в общий DatabaseError.
const isRestrictViolation = (err: unknown): boolean =>
	err instanceof DatabaseError &&
	(err as { original?: { code?: string } }).original?.code === '23001';

import type { Equipment } from '../../models/equipment.model.ts';
import { ConflictError, NotFoundError } from '../errors/error.ts';
import {
	equipmentCheckIsExist,
	equipmentDeleteData,
	equipmentFindById,
	equipmentFindMany,
	equipmentSaveData,
	equipmentUpdateData,
} from '../repositories/equipmentRepositories.ts';
import { sitesFindOrCreateUnspecified } from '../repositories/sitesRepositories.ts';
import type {
	CreateEquipmentBody,
	GetEquipmentQuery,
	UpdateEquipmentBody,
} from '../validators/equipment.validator.ts';

// Внешний контракт использует type/status; typeCode/statusCode заняты в
// модели под belongsTo-ассоциации, поэтому маппинг живёт тут, на границе.
const SORT_FIELD_MAP: Record<string, string> = {
	type: 'typeCode',
	status: 'statusCode',
};

const toEquipmentResponse = (equipment: Equipment) => {
	const { typeCode, statusCode, ...rest } = equipment.toJSON();
	return { ...rest, type: typeCode, status: statusCode };
};

export const equipmentServiceCreate = async (body: CreateEquipmentBody) => {
	try {
		const siteId = body.siteId ?? (await sitesFindOrCreateUnspecified()).id;
		const created = await equipmentSaveData({
			siteId,
			name: body.name,
			typeCode: body.type,
			serialNumber: body.serialNumber,
			statusCode: body.status,
			installedAt: body.installedAt ?? null,
		});
		return toEquipmentResponse(created);
	} catch (err) {
		if (err instanceof UniqueConstraintError) {
			throw new ConflictError('Оборудование с таким номером уже существует');
		}
		throw err;
	}
};

export const equipmentServiceGetAll = async (query: GetEquipmentQuery) => {
	const where: WhereOptions = {};
	if (query.status) where.statusCode = query.status;
	if (query.type) where.typeCode = query.type;
	if (query.siteId) where.siteId = query.siteId;
	if (query.search) where.name = { [Op.iLike]: `%${query.search}%` };

	const sortField = SORT_FIELD_MAP[query.sort] ?? query.sort;
	const { count, rows } = await equipmentFindMany({
		where,
		order: [[sortField, query.order]],
		limit: query.limit,
		offset: (query.page - 1) * query.limit,
	});
	return {
		data: rows.map(toEquipmentResponse),
		total: count,
		page: query.page,
		limit: query.limit,
	};
};

export const equipmentServiceGetById = async (id: string) => {
	const equipment = await equipmentFindById(id);
	if (!equipment) throw new NotFoundError('Оборудование', 'не найдено');
	return toEquipmentResponse(equipment);
};

export const equipmentServiceUpdate = async (
	id: string,
	body: UpdateEquipmentBody,
) => {
	if (body.serialNumber) {
		const existing = await equipmentFindById(id);
		if (!existing) throw new NotFoundError('Оборудование', 'не найдено');

		if (body.serialNumber !== existing.serialNumber) {
			const isExist = await equipmentCheckIsExist(body.serialNumber);
			if (isExist) {
				throw new ConflictError('Оборудование с таким номером уже существует');
			}
		}
	}

	const { type, status, ...rest } = body;
	const updated = await equipmentUpdateData(id, {
		...rest,
		...(type !== undefined && { typeCode: type }),
		...(status !== undefined && { statusCode: status }),
	});
	if (!updated) throw new NotFoundError('Оборудование', 'не найдено');
	return toEquipmentResponse(updated);
};

export const equipmentServiceDelete = async (id: string) => {
	try {
		const count = await equipmentDeleteData(id);
		if (!count) throw new NotFoundError('Оборудование', 'не найдено');
		return count > 0;
	} catch (err) {
		if (err instanceof ForeignKeyConstraintError || isRestrictViolation(err)) {
			throw new ConflictError(
				'Нельзя удалить оборудование, по которому есть незакрытые заявки',
			);
		}
		throw err;
	}
};
