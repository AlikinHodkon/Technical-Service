import { UniqueConstraintError } from 'sequelize';
import { MaintenanceRequest } from '../../models/maintenance-request.model.ts';
import { RequestAssignee } from '../../models/request-assignee.model.ts';
import { Technician } from '../../models/technician.model.ts';
import { sequelize } from '../config/db.ts';
import {
	ConflictError,
	NotFoundError,
	ValidationError,
} from '../errors/error.ts';
import type { SetRequestAssigneesBody } from '../validators/requestAssignees.validator.ts';

export const requestAssigneesServiceSet = async (
	requestId: string,
	assignees: SetRequestAssigneesBody,
) => {
	const leadCount = assignees.filter(
		(assignee) => assignee.role === 'lead',
	).length;
	if (leadCount !== 1) {
		throw new ValidationError({
			issues: [
				{
					path: ['assignees'],
					code: 'custom',
					message: 'Требуется ровно один специалист с ролью lead',
				},
			],
		});
	}

	return sequelize.transaction(async (t) => {
		const request = await MaintenanceRequest.findByPk(requestId, {
			transaction: t,
			lock: t.LOCK.UPDATE,
		});
		if (!request) throw new NotFoundError('Заявка', 'не найдена');

		const technicianIds = assignees.map((assignee) => assignee.technicianId);
		const found = await Technician.count({
			where: { id: technicianIds },
			transaction: t,
		});
		if (found !== technicianIds.length) {
			throw new NotFoundError('Технический специалист', 'не найден');
		}

		await RequestAssignee.destroy({ where: { requestId }, transaction: t });

		try {
			await RequestAssignee.bulkCreate(
				assignees.map((assignee) => ({
					requestId,
					technicianId: assignee.technicianId,
					roleCode: assignee.role,
					hours: assignee.hours ?? null,
				})),
				{ transaction: t },
			);
		} catch (error) {
			if (error instanceof UniqueConstraintError) {
				throw new ConflictError(
					'Технический специалист назначен на заявку дважды',
				);
			}
			throw error;
		}

		return RequestAssignee.findAll({
			where: { requestId },
			include: [Technician],
			transaction: t,
		});
	});
};

export const requestAssigneesServiceRemove = async (
	requestId: string,
	technicianId: string,
) => {
	const count = await RequestAssignee.destroy({
		where: { requestId, technicianId },
	});
	if (!count) throw new NotFoundError('Назначение', 'не найдено');
};
