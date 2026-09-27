import * as z from 'zod';
import { REQUEST_PRIORITY_CODES, REQUEST_STATUS_CODES } from './lookups.ts';

const SORTABLE_FIELDS = [
	'createdAt',
	'updatedAt',
	'plannedAt',
	'priority',
	'title',
] as const;

export const createRequestSchema = z.object({
	equipmentId: z.uuid(),
	title: z.string().min(5).max(120),
	description: z.string().max(2000).optional(),
	priority: z.enum(REQUEST_PRIORITY_CODES),
	plannedAt: z.iso.datetime().optional(),
	author: z.string().min(1).max(200),
});

export const updateRequestSchema = z.object({
	title: z.string().min(5).max(120).optional(),
	description: z.string().max(2000).optional(),
	priority: z.enum(REQUEST_PRIORITY_CODES).optional(),
	plannedAt: z.iso.datetime().optional(),
});

export const updateRequestStatusSchema = z.object({
	status: z.enum(REQUEST_STATUS_CODES),
	author: z.string().min(1).max(200),
});

export const bulkCreateRequestsSchema = z.object({
	requests: z.array(z.unknown()).min(1).max(100),
});

export const getRequestsQuerySchema = z.object({
	status: z.enum(REQUEST_STATUS_CODES).optional(),
	priority: z.enum(REQUEST_PRIORITY_CODES).optional(),
	equipmentId: z.uuid().optional(),
	dateFrom: z.iso.datetime().optional(),
	dateTo: z.iso.datetime().optional(),
	sort: z.enum(SORTABLE_FIELDS).optional().default('createdAt'),
	order: z.enum(['ASC', 'DESC']).optional().default('DESC'),
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateRequestBody = z.infer<typeof createRequestSchema>;
export type BulkCreateRequestsBody = z.infer<typeof bulkCreateRequestsSchema>;
export type UpdateRequestBody = z.infer<typeof updateRequestSchema>;
export type UpdateRequestStatusBody = z.infer<typeof updateRequestStatusSchema>;
export type GetRequestsQuery = z.infer<typeof getRequestsQuerySchema>;
