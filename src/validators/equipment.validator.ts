import * as z from 'zod';

export const createEquipmentSchema = z.object({
	name: z.string().min(3).max(100),
	type: z.enum(['turbine', 'inverter', 'sensor', 'substation']),
	serialNumber: z.string(),
	location: z.object({ lat: z.number(), lon: z.number() }),
	status: z.enum(['operational', 'maintenance', 'fault', 'decommissioned']),
	installedAt: z.iso.datetime(),
});

export const updateEquipmentSchema = createEquipmentSchema.partial();
