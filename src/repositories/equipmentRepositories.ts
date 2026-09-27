import type { WhereOptions } from 'sequelize';
import { Equipment } from '../../models/equipment.model.ts';
import { EquipmentPassport } from '../../models/equipment-passport.model.ts';
import { Site } from '../../models/site.model.ts';
import type { EquipmentType } from '../types.ts';

const DETAILS_INCLUDE = [EquipmentPassport, Site];

export const equipmentCheckIsExist = async (serialNumber: string) => {
	const count = await Equipment.count({ where: { serialNumber } });
	return count > 0;
};

export const equipmentFindById = async (id: string) => {
	return Equipment.findByPk(id, { include: DETAILS_INCLUDE });
};

export const equipmentSaveData = async (
	newEquipment: Omit<EquipmentType, 'id'>,
) => {
	return Equipment.create(newEquipment);
};

export const equipmentUpdateData = async (
	id: string,
	updates: Partial<Omit<EquipmentType, 'id'>>,
) => {
	const instance = await Equipment.findByPk(id);
	const updated = await instance?.update(updates);
	return updated;
};

export const equipmentDeleteData = async (id: string) => {
	return await Equipment.destroy({ where: { id } });
};

export const equipmentFindMany = async (options: {
	where: WhereOptions;
	order: [string, 'ASC' | 'DESC'][];
	limit: number;
	offset: number;
}) => {
	return Equipment.findAndCountAll({
		...options,
		include: DETAILS_INCLUDE,
		distinct: true,
	});
};
