import * as z from 'zod';

export const getEquipmentLoadQuerySchema = z.object({
	dateFrom: z.iso.datetime().optional(),
	dateTo: z.iso.datetime().optional(),
	minRequests: z.coerce.number().int().nonnegative().default(0),
});

export type GetEquipmentLoadQuery = z.infer<typeof getEquipmentLoadQuerySchema>;
