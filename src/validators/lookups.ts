export const EQUIPMENT_STATUS_CODES = [
	'operational',
	'maintenance',
	'fault',
	'decommissioned',
] as const;

export const EQUIPMENT_TYPE_CODES = [
	'turbine',
	'inverter',
	'sensor',
	'substation',
] as const;

export const REQUEST_STATUS_CODES = [
	'new',
	'in_progress',
	'done',
	'rejected',
] as const;

export const REQUEST_PRIORITY_CODES = [
	'low',
	'medium',
	'high',
	'critical',
] as const;

export const ASSIGNEE_ROLE_CODES = ['lead', 'member'] as const;

export type EquipmentStatusCode = (typeof EQUIPMENT_STATUS_CODES)[number];
export type EquipmentTypeCode = (typeof EQUIPMENT_TYPE_CODES)[number];
export type RequestStatusCode = (typeof REQUEST_STATUS_CODES)[number];
export type RequestPriorityCode = (typeof REQUEST_PRIORITY_CODES)[number];
export type AssigneeRoleCode = (typeof ASSIGNEE_ROLE_CODES)[number];
