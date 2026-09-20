import * as z from 'zod';

const PRIORITY_VALUES = ['low', 'medium', 'high', 'critical'] as const;
const STATUS_VALUES = ['new', 'in_progress', 'done', 'rejected'] as const;

export const createRequestSchema = z.object({
	equipmentId: z.string(),
	title: z.string().min(5).max(120),
	description: z.string().max(2000).optional(),
	priority: z.enum(PRIORITY_VALUES),
	plannedAt: z.iso.datetime().optional(),
});

export const updateRequestSchema = z.object({
	title: z.string().min(5).max(120).optional(),
	description: z.string().max(2000).optional(),
	priority: z.enum(PRIORITY_VALUES).optional(),
	plannedAt: z.iso.datetime().optional(),
});

export const updateRequestStatusSchema = z.object({
	status: z.enum(STATUS_VALUES),
});

export const getRequestsQuerySchema = z.object({
	status: z.enum(STATUS_VALUES).optional(),
	priority: z.enum(PRIORITY_VALUES).optional(),
	equipmentId: z.string().optional(),
	dateFrom: z.iso.datetime().optional(),
	dateTo: z.iso.datetime().optional(),
	sort: z.coerce.string().optional(),
	page: z.coerce.string().default('1'),
	limit: z.coerce.string().default('20'),
});

export type CreateRequestBody = z.infer<typeof createRequestSchema>;
export type UpdateRequestBody = z.infer<typeof updateRequestSchema>;
export type UpdateRequestStatusBody = z.infer<typeof updateRequestStatusSchema>;
export type GetRequestsQuery = z.infer<typeof getRequestsQuerySchema>;
