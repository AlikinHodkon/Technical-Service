import * as z from 'zod';

const isNotInFuture = (isoDate: string) =>
	new Date(isoDate).getTime() <= Date.now();

const equipmentBaseSchema = z.object({
	name: z.string().min(3).max(100),
	type: z.enum(['turbine', 'inverter', 'sensor', 'substation']),
	serialNumber: z.string(),
	location: z.object({ lat: z.number(), lon: z.number() }),
	status: z.enum(['operational', 'maintenance', 'fault', 'decommissioned']),
	installedAt: z.iso.datetime(),
});

export const createEquipmentSchema = equipmentBaseSchema.refine(
	(data) => isNotInFuture(data.installedAt),
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
	type: z.enum(['turbine', 'inverter', 'sensor', 'substation']).optional(),
	status: z
		.enum(['operational', 'maintenance', 'fault', 'decommissioned'])
		.optional(),
	page: z.coerce.string().default('1'),
	sort: z.coerce.string().optional(),
	limit: z.coerce.string().default('20'),
});

export type CreateEquipmentBody = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentBody = z.infer<typeof updateEquipmentSchema>;
export type GetEquipmentQuery = z.infer<typeof getEquipmentQuerySchema>;
