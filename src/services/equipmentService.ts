import { ConflictError } from '../errors/error.ts';
import {
	equipmentCheckIsExist,
	equipmentSaveData,
} from '../repositories/equipmentRepositories.ts';
import type { EquipmentType } from '../types.ts';

export const equipmentServiceCreate = async (
	body: Omit<EquipmentType, 'id'>,
) => {
	const id = crypto.randomUUID();
	const isExist = await equipmentCheckIsExist(body.serialNumber);
	if (isExist) {
		throw new ConflictError('Экипировка с таким номером уже существует');
	}
	const result = await equipmentSaveData({ id, ...body });
	return result;
};
