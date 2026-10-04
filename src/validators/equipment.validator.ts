import * as z from 'zod';
import { EQUIPMENT_STATUS_CODES, EQUIPMENT_TYPE_CODES } from './lookups.ts';

const isNotInFuture = (isoDate: string) =>
	new Date(isoDate).getTime() <= Date.now();

const SORTABLE_FIELDS = [
	'name',
	'type',
	'serialNumber',
	'status',
	'installedAt',
] as const;

// type/status наружу; typeCode/statusCode внутри — имена заняты под belongsTo в моделях.
const equipmentBaseSchema = z.object({
	siteId: z.uuid().optional(),
	name: z.string().min(3).max(100),
	type: z.enum(EQUIPMENT_TYPE_CODES),
	serialNumber: z.string(),
	status: z.enum(EQUIPMENT_STATUS_CODES),
	installedAt: z.iso.date().optional(),
});

export const createEquipmentSchema = equipmentBaseSchema.refine(
	(data) => data.installedAt === undefined || isNotInFuture(data.installedAt),
	{ message: 'Дата установки не может быть в будущем', path: ['installedAt'] },
);

export const updateEquipmentSchema = equipmentBaseSchema
	.partial()
	.refine(
		(data) => data.installedAt === undefined || isNotInFuture(data.installedAt),
		{
			message: 'Дата установки не может быть в будущем',
			path: ['installedAt'],
		},
	);

export const getEquipmentQuerySchema = z.object({
	type: z.enum(EQUIPMENT_TYPE_CODES).optional(),
	status: z.enum(EQUIPMENT_STATUS_CODES).optional(),
	siteId: z.uuid().optional(),
	search: z.string().min(1).max(100).optional(),
	sort: z.enum(SORTABLE_FIELDS).optional().default('installedAt'),
	order: z.enum(['ASC', 'DESC']).optional().default('DESC'),
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateEquipmentBody = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentBody = z.infer<typeof updateEquipmentSchema>;
export type GetEquipmentQuery = z.infer<typeof getEquipmentQuerySchema>;
