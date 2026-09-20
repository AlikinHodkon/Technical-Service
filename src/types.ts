export type ErrorDetail = {
	field: string;
	code: string;
	message: string;
};

export type RequestType = {
	id: string; // (uuid, генерируется сервером)
	equipmentId: string; // ссылка на существующее оборудование
	title: string; // 5–120 символов, обязательное
	description?: string; // до 2000 символов, необязательное
	priority: 'low' | 'medium' | 'high' | 'critical';
	status: 'new' | 'in_progress' | 'done' | 'rejected'; // (по умолчанию new)
	plannedAt?: string; // ISO-дата-время, необязательное
	createdAt: string; // ISO-дата-время (проставляется сервером)
	updatedAt: string; // ISO-дата-время (проставляется сервером)
};

export type EquipmentType = {
	id: string; // (uuid, генерируется сервером)
	name: string; // 3–100 символов, обязательное
	type: 'turbine' | 'inverter' | 'sensor' | 'substation';
	serialNumber: string; // уникальный в пределах системы
	location: { lat: number; lon: number };
	status: 'operational' | 'maintenance' | 'fault' | 'decommissioned';
	installedAt: string; // ISO-дата, не в будущем
};
