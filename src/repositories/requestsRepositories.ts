import type { WhereOptions } from 'sequelize';
import { MaintenanceRequest } from '../../models/maintenance-request.model.ts';
import { Technician } from '../../models/technician.model.ts';
import type { RequestType } from '../types.ts';

const DETAILS_INCLUDE = [
	{ model: Technician, through: { attributes: ['roleCode', 'hours'] } },
];

export const requestsFindById = async (id: string) => {
	return MaintenanceRequest.findByPk(id, { include: DETAILS_INCLUDE });
};

export const requestsFindByEquipmentId = async (equipmentId: string) => {
	return MaintenanceRequest.findAll({ where: { equipmentId } });
};

export const requestsSaveData = async (
	newRequest: Omit<RequestType, 'id' | 'statusCode'>,
) => {
	return MaintenanceRequest.create(newRequest);
};

export const requestsUpdateData = async (
	id: string,
	updates: Partial<Omit<RequestType, 'id'>>,
) => {
	const instance = await MaintenanceRequest.findByPk(id);
	const updated = await instance?.update(updates);
	return updated;
};

export const requestsDeleteData = async (id: string) => {
	return MaintenanceRequest.destroy({ where: { id } });
};

export const requestsFindMany = async (options: {
	where: WhereOptions;
	order: [string, 'ASC' | 'DESC'][];
	limit: number;
	offset: number;
}) => {
	return MaintenanceRequest.findAndCountAll({
		...options,
		include: DETAILS_INCLUDE,
		distinct: true,
	});
};
