import type { RequestType } from '../types.ts';
import { dataType } from './constants.ts';
import { getFilePath, readJsonArray } from './utils.ts';

export const requestsFindByEquipmentId = async (equipmentId: string) => {
	const filePath = await getFilePath(dataType.REQUESTS);
	const data = await readJsonArray<RequestType>(filePath);
	return data.filter((request) => request.equipmentId === equipmentId);
};
