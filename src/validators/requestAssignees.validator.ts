import * as z from 'zod';
import { ASSIGNEE_ROLE_CODES } from './lookups.ts';

const assigneeSchema = z.object({
	technicianId: z.uuid(),
	role: z.enum(ASSIGNEE_ROLE_CODES),
	hours: z.coerce.number().int().nonnegative().optional(),
});

export const setRequestAssigneesSchema = z
	.array(assigneeSchema)
	.min(1)
	.refine(
		(items) =>
			new Set(items.map((item) => item.technicianId)).size === items.length,
		{ message: 'Дублирующийся technicianId в списке назначений' },
	);

export const requestAssigneeParamsSchema = z.object({
	id: z.uuid(),
	userId: z.uuid(),
});

export type SetRequestAssigneesBody = z.infer<typeof setRequestAssigneesSchema>;
