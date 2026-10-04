import * as z from 'zod';
import { createDocument } from 'zod-openapi';
import { loginSchema } from '../validators/auth.validator.ts';
import { idParamSchema } from '../validators/common.validator.ts';
import {
	createEquipmentSchema,
	getEquipmentQuerySchema,
	updateEquipmentSchema,
} from '../validators/equipment.validator.ts';
import { getEquipmentLoadQuerySchema } from '../validators/reports.validator.ts';
import {
	requestAssigneeParamsSchema,
	setRequestAssigneesSchema,
} from '../validators/requestAssignees.validator.ts';
import {
	bulkCreateRequestsSchema,
	createRequestSchema,
	getRequestsQuerySchema,
	updateRequestSchema,
	updateRequestStatusSchema,
} from '../validators/requests.validator.ts';
import {
	authUserSchema,
	bulkImportResultSchema,
	equipmentLoadRowSchema,
	equipmentSchema,
	equipmentWeatherSchema,
	healthSchema,
	loginResponseSchema,
	paginatedEquipmentSchema,
	paginatedRequestsSchema,
	problemDetailsSchema,
	refreshResponseSchema,
	requestAssigneeSchema,
	requestSchema,
	requestStatusHistoryEntrySchema,
	siteSummarySchema,
} from './schemas.ts';

const jsonContent = (schema: z.ZodType) => ({
	content: { 'application/json': { schema } },
});

const errorResponse = (description: string) => ({
	description,
	...jsonContent(problemDetailsSchema),
});

const NOT_FOUND = errorResponse('Ресурс не найден');
const VALIDATION_FAILED = errorResponse('Ошибка валидации тела/параметров');
const BAD_REQUEST = errorResponse('Некорректные query-параметры');
const UNAUTHORIZED = errorResponse('Запрос без API-ключа');
const CONFLICT = errorResponse('Конфликт состояния ресурса');

export const openapiDocument = createDocument({
	openapi: '3.1.0',
	info: {
		title: 'Technical Service API',
		version: '1.0.0',
		description:
			'Учёт оборудования и заявок на обслуживание. Спецификация собрана из тех же Zod-схем, что валидируют запросы в src/validators.',
	},
	servers: [{ url: '/api' }],
	components: {
		securitySchemes: {
			bearerAuth: {
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
				description:
					'Access-токен из ответа /auth/login или /auth/refresh, передаётся как Authorization: Bearer <token>',
			},
		},
	},
	paths: {
		'/health/live': {
			get: {
				summary: 'Жизнеспособность процесса',
				responses: {
					'200': { description: 'OK', ...jsonContent(healthSchema) },
				},
			},
		},
		'/health/ready': {
			get: {
				summary: 'Готовность к обслуживанию (проверяет доступность БД)',
				responses: {
					'200': { description: 'OK', ...jsonContent(healthSchema) },
					'503': {
						description: 'БД недоступна',
						...jsonContent(z.object({ status: z.literal('error') })),
					},
				},
			},
		},
		'/auth/register': {
			post: {
				summary: 'Регистрация пользователя (роль всегда viewer)',
				responses: {
					'201': {
						description: 'Пользователь создан',
						...jsonContent(authUserSchema),
					},
					'409': errorResponse('Email занят'),
					'422': VALIDATION_FAILED,
				},
			},
		},
		'/auth/login': {
			post: {
				summary: 'Вход: выдаёт access-токен и устанавливает refresh-cookie',
				requestBody: {
					content: { 'application/json': { schema: loginSchema } },
				},
				responses: {
					'200': {
						description: 'Успешный вход',
						...jsonContent(loginResponseSchema),
					},
					'401': UNAUTHORIZED,
					'422': VALIDATION_FAILED,
					'429': errorResponse('Слишком много попыток входа'),
				},
			},
		},
		'/auth/refresh': {
			post: {
				summary: 'Обновление access-токена по refresh-cookie',
				responses: {
					'200': {
						description: 'Новый access-токен',
						...jsonContent(refreshResponseSchema),
					},
					'401': UNAUTHORIZED,
				},
			},
		},
		'/auth/logout': {
			post: {
				summary: 'Завершение сессии, отзыв refresh-токена',
				security: [{ bearerAuth: [] }],
				responses: {
					'204': { description: 'Сессия завершена' },
					'401': UNAUTHORIZED,
				},
			},
		},
		'/auth/me': {
			get: {
				summary: 'Текущий пользователь и его роль',
				security: [{ bearerAuth: [] }],
				responses: {
					'200': {
						description: 'Текущий пользователь',
						...jsonContent(authUserSchema),
					},
					'401': UNAUTHORIZED,
				},
			},
		},
		'/equipment': {
			get: {
				summary: 'Список оборудования',
				security: [{ bearerAuth: [] }],
				requestParams: { query: getEquipmentQuerySchema },
				responses: {
					'200': {
						description: 'Страница списка',
						...jsonContent(paginatedEquipmentSchema),
					},
					'400': BAD_REQUEST,
					'401': UNAUTHORIZED,
				},
			},
			post: {
				summary: 'Создать единицу оборудования',
				security: [{ bearerAuth: [] }],
				requestBody: {
					content: { 'application/json': { schema: createEquipmentSchema } },
				},
				responses: {
					'201': { description: 'Создано', ...jsonContent(equipmentSchema) },
					'401': UNAUTHORIZED,
					'409': CONFLICT,
					'422': VALIDATION_FAILED,
				},
			},
		},
		'/equipment/{id}': {
			get: {
				summary: 'Карточка оборудования',
				security: [{ bearerAuth: [] }],
				requestParams: { path: idParamSchema },
				responses: {
					'200': {
						description: 'Оборудование',
						...jsonContent(equipmentSchema),
					},
					'401': UNAUTHORIZED,
					'404': NOT_FOUND,
					'422': VALIDATION_FAILED,
				},
			},
			patch: {
				summary: 'Частичное обновление оборудования',
				security: [{ bearerAuth: [] }],
				requestParams: { path: idParamSchema },
				requestBody: {
					content: { 'application/json': { schema: updateEquipmentSchema } },
				},
				responses: {
					'200': { description: 'Обновлено', ...jsonContent(equipmentSchema) },
					'401': UNAUTHORIZED,
					'404': NOT_FOUND,
					'409': CONFLICT,
					'422': VALIDATION_FAILED,
				},
			},
			delete: {
				summary: 'Удалить единицу оборудования',
				security: [{ bearerAuth: [] }],
				requestParams: { path: idParamSchema },
				responses: {
					'204': { description: 'Удалено' },
					'401': UNAUTHORIZED,
					'404': NOT_FOUND,
					'409': CONFLICT,
					'422': VALIDATION_FAILED,
				},
			},
		},
		'/equipment/{id}/requests': {
			get: {
				summary: 'Заявки по конкретной единице оборудования',
				security: [{ bearerAuth: [] }],
				requestParams: { path: idParamSchema, query: getRequestsQuerySchema },
				responses: {
					'200': {
						description: 'Страница списка',
						...jsonContent(paginatedRequestsSchema),
					},
					'401': UNAUTHORIZED,
					'404': NOT_FOUND,
					'422': VALIDATION_FAILED,
				},
			},
		},
		'/equipment/{id}/weather': {
			get: {
				summary: 'Прогноз погоды по координатам объекта',
				security: [{ bearerAuth: [] }],
				requestParams: { path: idParamSchema },
				responses: {
					'200': {
						description: 'Прогноз на 3 дня',
						...jsonContent(equipmentWeatherSchema),
					},
					'401': UNAUTHORIZED,
					'404': NOT_FOUND,
					'422': VALIDATION_FAILED,
					'503': errorResponse('Погодное API недоступно или ответило ошибкой'),
				},
			},
		},
		'/requests': {
			get: {
				summary: 'Список заявок',
				security: [{ bearerAuth: [] }],
				requestParams: { query: getRequestsQuerySchema },
				responses: {
					'200': {
						description: 'Страница списка',
						...jsonContent(paginatedRequestsSchema),
					},
					'400': BAD_REQUEST,
					'401': UNAUTHORIZED,
				},
			},
			post: {
				summary: 'Создать заявку',
				security: [{ bearerAuth: [] }],
				requestBody: {
					content: { 'application/json': { schema: createRequestSchema } },
				},
				responses: {
					'201': { description: 'Создано', ...jsonContent(requestSchema) },
					'401': UNAUTHORIZED,
					'404': NOT_FOUND,
					'422': VALIDATION_FAILED,
				},
			},
		},
		'/requests/bulk': {
			post: {
				summary: 'Массовый импорт заявок с частичным успехом',
				security: [{ bearerAuth: [] }],
				requestBody: {
					content: { 'application/json': { schema: bulkCreateRequestsSchema } },
				},
				responses: {
					'207': {
						description: 'Отчёт по каждой записи (часть могла не создаться)',
						...jsonContent(bulkImportResultSchema),
					},
					'401': UNAUTHORIZED,
					'422': VALIDATION_FAILED,
				},
			},
		},
		'/requests/{id}': {
			get: {
				summary: 'Карточка заявки',
				security: [{ bearerAuth: [] }],
				requestParams: { path: idParamSchema },
				responses: {
					'200': { description: 'Заявка', ...jsonContent(requestSchema) },
					'401': UNAUTHORIZED,
					'404': NOT_FOUND,
					'422': VALIDATION_FAILED,
				},
			},
			patch: {
				summary: 'Редактирование полей заявки (без смены статуса)',
				security: [{ bearerAuth: [] }],
				requestParams: { path: idParamSchema },
				requestBody: {
					content: { 'application/json': { schema: updateRequestSchema } },
				},
				responses: {
					'200': { description: 'Обновлено', ...jsonContent(requestSchema) },
					'401': UNAUTHORIZED,
					'404': NOT_FOUND,
					'422': VALIDATION_FAILED,
				},
			},
			delete: {
				summary: 'Удалить заявку',
				security: [{ bearerAuth: [] }],
				requestParams: { path: idParamSchema },
				responses: {
					'204': { description: 'Удалено' },
					'401': UNAUTHORIZED,
					'404': NOT_FOUND,
					'409': CONFLICT,
					'422': VALIDATION_FAILED,
				},
			},
		},
		'/requests/{id}/status': {
			patch: {
				summary: 'Смена статуса заявки с проверкой допустимости перехода',
				security: [{ bearerAuth: [] }],
				requestParams: { path: idParamSchema },
				requestBody: {
					content: {
						'application/json': { schema: updateRequestStatusSchema },
					},
				},
				responses: {
					'200': {
						description: 'Статус изменён',
						...jsonContent(requestSchema),
					},
					'401': UNAUTHORIZED,
					'404': NOT_FOUND,
					'409': errorResponse(
						'Недопустимый переход статуса либо нет назначенных исполнителей',
					),
					'422': VALIDATION_FAILED,
				},
			},
		},
		'/requests/{id}/history': {
			get: {
				summary: 'История смены статусов заявки',
				security: [{ bearerAuth: [] }],
				requestParams: { path: idParamSchema },
				responses: {
					'200': {
						description: 'Список переходов, от старых к новым',
						...jsonContent(z.array(requestStatusHistoryEntrySchema)),
					},
					'401': UNAUTHORIZED,
					'404': NOT_FOUND,
					'422': VALIDATION_FAILED,
				},
			},
		},
		'/requests/{id}/assignees': {
			post: {
				summary: 'Назначить бригаду на заявку (полностью заменяет список)',
				security: [{ bearerAuth: [] }],
				requestParams: { path: idParamSchema },
				requestBody: {
					content: {
						'application/json': { schema: setRequestAssigneesSchema },
					},
				},
				responses: {
					'200': {
						description: 'Новый список назначений',
						...jsonContent(z.array(requestAssigneeSchema)),
					},
					'401': UNAUTHORIZED,
					'404': NOT_FOUND,
					'422': VALIDATION_FAILED,
				},
			},
		},
		'/requests/{id}/assignees/{userId}': {
			delete: {
				summary: 'Снять специалиста с заявки',
				security: [{ bearerAuth: [] }],
				requestParams: { path: requestAssigneeParamsSchema },
				responses: {
					'204': { description: 'Удалено' },
					'401': UNAUTHORIZED,
					'404': NOT_FOUND,
					'422': VALIDATION_FAILED,
				},
			},
		},
		'/sites/{id}/summary': {
			get: {
				summary:
					'Сводка по площадке: заявки по статусам/приоритетам, среднее время закрытия',
				security: [{ bearerAuth: [] }],
				requestParams: { path: idParamSchema },
				responses: {
					'200': { description: 'Сводка', ...jsonContent(siteSummarySchema) },
					'401': UNAUTHORIZED,
					'404': NOT_FOUND,
					'422': VALIDATION_FAILED,
				},
			},
		},
		'/reports/equipment-load': {
			get: {
				summary:
					'Нагрузка на оборудование: число заявок, плановые часы, последнее обслуживание',
				security: [{ bearerAuth: [] }],
				requestParams: { query: getEquipmentLoadQuerySchema },
				responses: {
					'200': {
						description: 'Строка на единицу оборудования',
						...jsonContent(z.array(equipmentLoadRowSchema)),
					},
					'400': BAD_REQUEST,
					'401': UNAUTHORIZED,
				},
			},
		},
	},
});
