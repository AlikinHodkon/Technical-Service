import * as z from 'zod';
import { createDocument } from 'zod-openapi';
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
	bulkImportResultSchema,
	equipmentLoadRowSchema,
	equipmentSchema,
	equipmentWeatherSchema,
	healthSchema,
	paginatedEquipmentSchema,
	paginatedRequestsSchema,
	problemDetailsSchema,
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
	paths: {
		'/health': {
			get: {
				summary: 'Проверка доступности сервиса',
				responses: {
					'200': { description: 'OK', ...jsonContent(healthSchema) },
				},
			},
		},
		'/equipment': {
			get: {
				summary: 'Список оборудования',
				requestParams: { query: getEquipmentQuerySchema },
				responses: {
					'200': {
						description: 'Страница списка',
						...jsonContent(paginatedEquipmentSchema),
					},
					'400': BAD_REQUEST,
				},
			},
			post: {
				summary: 'Создать единицу оборудования',
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
				requestParams: { path: idParamSchema },
				responses: {
					'200': {
						description: 'Оборудование',
						...jsonContent(equipmentSchema),
					},
					'404': NOT_FOUND,
					'422': VALIDATION_FAILED,
				},
			},
			patch: {
				summary: 'Частичное обновление оборудования',
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
				requestParams: { path: idParamSchema, query: getRequestsQuerySchema },
				responses: {
					'200': {
						description: 'Страница списка',
						...jsonContent(paginatedRequestsSchema),
					},
					'404': NOT_FOUND,
					'422': VALIDATION_FAILED,
				},
			},
		},
		'/equipment/{id}/weather': {
			get: {
				summary: 'Прогноз погоды по координатам объекта',
				requestParams: { path: idParamSchema },
				responses: {
					'200': {
						description: 'Прогноз на 3 дня',
						...jsonContent(equipmentWeatherSchema),
					},
					'404': NOT_FOUND,
					'422': VALIDATION_FAILED,
					'503': errorResponse('Погодное API недоступно или ответило ошибкой'),
				},
			},
		},
		'/requests': {
			get: {
				summary: 'Список заявок',
				requestParams: { query: getRequestsQuerySchema },
				responses: {
					'200': {
						description: 'Страница списка',
						...jsonContent(paginatedRequestsSchema),
					},
					'400': BAD_REQUEST,
				},
			},
			post: {
				summary: 'Создать заявку',
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
				requestParams: { path: idParamSchema },
				responses: {
					'200': { description: 'Заявка', ...jsonContent(requestSchema) },
					'404': NOT_FOUND,
					'422': VALIDATION_FAILED,
				},
			},
			patch: {
				summary: 'Редактирование полей заявки (без смены статуса)',
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
				requestParams: { path: idParamSchema },
				responses: {
					'200': {
						description: 'Список переходов, от старых к новым',
						...jsonContent(z.array(requestStatusHistoryEntrySchema)),
					},
					'404': NOT_FOUND,
					'422': VALIDATION_FAILED,
				},
			},
		},
		'/requests/{id}/assignees': {
			post: {
				summary: 'Назначить бригаду на заявку (полностью заменяет список)',
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
				requestParams: { path: idParamSchema },
				responses: {
					'200': { description: 'Сводка', ...jsonContent(siteSummarySchema) },
					'404': NOT_FOUND,
					'422': VALIDATION_FAILED,
				},
			},
		},
		'/reports/equipment-load': {
			get: {
				summary:
					'Нагрузка на оборудование: число заявок, плановые часы, последнее обслуживание',
				requestParams: { query: getEquipmentLoadQuerySchema },
				responses: {
					'200': {
						description: 'Строка на единицу оборудования',
						...jsonContent(z.array(equipmentLoadRowSchema)),
					},
					'400': BAD_REQUEST,
				},
			},
		},
	},
});
