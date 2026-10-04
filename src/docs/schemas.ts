import * as z from 'zod';
import {
	ASSIGNEE_ROLE_CODES,
	EQUIPMENT_STATUS_CODES,
	EQUIPMENT_TYPE_CODES,
	REQUEST_PRIORITY_CODES,
	REQUEST_STATUS_CODES,
} from '../validators/lookups.ts';

// Форма ответов для документации — в отличие от validators/*.ts, в валидации не участвуют.

export const errorDetailSchema = z
	.object({
		field: z.string(),
		code: z.string(),
		message: z.string(),
	})
	.meta({ id: 'ErrorDetail' });

export const problemDetailsSchema = z
	.object({
		type: z.string(),
		title: z.string(),
		status: z.number().int(),
		instance: z.string(),
		requestId: z.string(),
		errors: z
			.array(errorDetailSchema)
			.meta({ description: 'Пусто, если ошибка не связана с валидацией' }),
	})
	.meta({
		id: 'ProblemDetails',
		description: 'Единый формат ошибки, RFC 9457 (Problem Details)',
	});

const coordinatesSchema = z
	.object({ lat: z.number(), lon: z.number() })
	.meta({ id: 'Coordinates' });

export const siteSchema = z
	.object({
		id: z.uuid(),
		name: z.string(),
		code: z.string(),
		region: z.string().nullable(),
		coordinates: coordinatesSchema.nullable(),
	})
	.meta({ id: 'Site' });

export const equipmentSchema = z
	.object({
		id: z.uuid(),
		siteId: z.uuid(),
		name: z.string(),
		type: z.enum(EQUIPMENT_TYPE_CODES),
		serialNumber: z.string(),
		status: z.enum(EQUIPMENT_STATUS_CODES),
		installedAt: z.iso.date().nullable(),
	})
	.meta({ id: 'Equipment' });

export const requestSchema = z
	.object({
		id: z.uuid(),
		equipmentId: z.uuid(),
		title: z.string(),
		description: z.string().nullable(),
		priority: z.enum(REQUEST_PRIORITY_CODES),
		status: z.enum(REQUEST_STATUS_CODES),
		plannedAt: z.iso.datetime().nullable(),
		author: z.string(),
		createdAt: z.iso.datetime(),
		updatedAt: z.iso.datetime(),
	})
	.meta({ id: 'MaintenanceRequest' });

export const requestStatusHistoryEntrySchema = z
	.object({
		id: z.uuid(),
		requestId: z.uuid(),
		oldStatusCode: z.enum(REQUEST_STATUS_CODES).nullable(),
		newStatusCode: z.enum(REQUEST_STATUS_CODES),
		author: z.string(),
		comment: z.string().nullable(),
		changedAt: z.iso.datetime(),
	})
	.meta({ id: 'RequestStatusHistoryEntry' });

const technicianSchema = z
	.object({
		id: z.uuid(),
		fullName: z.string(),
		specialization: z.string().nullable(),
		employeeNumber: z.string(),
	})
	.meta({ id: 'Technician' });

export const requestAssigneeSchema = z
	.object({
		requestId: z.uuid(),
		technicianId: z.uuid(),
		roleCode: z.enum(ASSIGNEE_ROLE_CODES),
		hours: z.int().nullable(),
		technician: technicianSchema,
	})
	.meta({ id: 'RequestAssignee' });

export const dailyForecastSchema = z
	.object({
		date: z.iso.date(),
		temperatureMax: z.number(),
		temperatureMin: z.number(),
		precipitationSum: z.number(),
		windSpeedMax: z.number(),
		suitableForOutdoorWork: z.boolean(),
	})
	.meta({ id: 'DailyForecast' });

export const equipmentWeatherSchema = z
	.object({
		equipmentId: z.uuid(),
		location: coordinatesSchema,
		timezone: z.string(),
		days: z.array(dailyForecastSchema),
	})
	.meta({ id: 'EquipmentWeather' });

export const siteSummarySchema = z
	.object({
		site: siteSchema,
		byStatus: z.array(
			z.object({ code: z.enum(REQUEST_STATUS_CODES), count: z.number().int() }),
		),
		byPriority: z.array(
			z.object({
				code: z.enum(REQUEST_PRIORITY_CODES),
				count: z.number().int(),
			}),
		),
		avgResolutionHours: z.number().nullable(),
	})
	.meta({ id: 'SiteSummary' });

export const equipmentLoadRowSchema = z
	.object({
		equipmentId: z.uuid(),
		name: z.string(),
		requestsCount: z.number().int(),
		closedCount: z.number().int(),
		plannedHoursSum: z.number().int(),
		lastMaintenanceAt: z.iso.datetime().nullable(),
	})
	.meta({ id: 'EquipmentLoadRow' });

const paginationFields = {
	total: z.number().int(),
	page: z.number().int(),
	limit: z.number().int(),
};

export const paginatedEquipmentSchema = z
	.object({ data: z.array(equipmentSchema), ...paginationFields })
	.meta({ id: 'PaginatedEquipment' });

export const paginatedRequestsSchema = z
	.object({ data: z.array(requestSchema), ...paginationFields })
	.meta({ id: 'PaginatedRequests' });

export const bulkImportResultSchema = z
	.object({
		results: z.array(
			z.union([
				z.object({
					index: z.number().int(),
					status: z.literal('created'),
					data: requestSchema,
				}),
				z.object({
					index: z.number().int(),
					status: z.literal('error'),
					errors: z.array(errorDetailSchema),
				}),
			]),
		),
		summary: z.object({
			total: z.number().int(),
			created: z.number().int(),
			failed: z.number().int(),
		}),
	})
	.meta({ id: 'BulkImportResult' });

export const healthSchema = z
	.object({ status: z.literal('ok') })
	.meta({ id: 'Health' });

export const authUserSchema = z
	.object({
		id: z.uuid(),
		email: z.string(),
		role: z.enum(['viewer', 'technician', 'admin']),
	})
	.meta({ id: 'AuthUser' });

export const loginResponseSchema = z
	.object({
		accessToken: z.string(),
		user: authUserSchema,
	})
	.meta({ id: 'LoginResponse' });

export const refreshResponseSchema = z
	.object({ accessToken: z.string() })
	.meta({ id: 'RefreshResponse' });
