import type {
	AssigneeRoleCode,
	EquipmentStatusCode,
	EquipmentTypeCode,
	RequestPriorityCode,
	RequestStatusCode,
} from './validators/lookups.ts';

export type ErrorDetail = {
	field: string;
	code: string;
	message: string;
};

export type RequestType = {
	id: string; // (uuid, генерируется сервером)
	equipmentId: string; // ссылка на существующее оборудование
	title: string; // 5–120 символов, обязательное
	description: string | null; // до 2000 символов, необязательное
	priorityCode: RequestPriorityCode;
	statusCode: RequestStatusCode; // (по умолчанию new)
	plannedAt: Date | null;
	author: string; // автор заявки, обязательное
	createdAt: Date; // проставляется сервером
	updatedAt: Date; // проставляется сервером
};

export type EquipmentType = {
	id: string; // (uuid, генерируется сервером)
	siteId: string; // ссылка на площадку
	name: string; // 3–100 символов, обязательное
	typeCode: EquipmentTypeCode;
	serialNumber: string; // уникальный в пределах системы
	statusCode: EquipmentStatusCode;
	installedAt: string | null; // ISO-дата, не в будущем
};

export type TechnicianType = {
	id: string;
	fullName: string;
	specialization: string | null;
	employeeNumber: string;
};

export type AssigneeType = {
	requestId: string;
	technicianId: string;
	roleCode: AssigneeRoleCode;
	hours: number | null;
};
