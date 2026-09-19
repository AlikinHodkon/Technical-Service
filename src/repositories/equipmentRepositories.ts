import type { EquipmentType } from '../types.ts';
import { dataType } from './constants.ts';
import { getFilePath, readJsonArray, writeJsonArray } from './utils.ts';

export const equipmentCheckIsExist = async (serialNumber: string) => {
	const filePath = await getFilePath(dataType.EQUIPMENT);
	const data = await readJsonArray<EquipmentType>(filePath);
	return data.some((equipment) => equipment.serialNumber === serialNumber);
};

export const equipmentSaveData = async (newEquipment: EquipmentType) => {
	const filePath = await getFilePath(dataType.EQUIPMENT);
	const data = await readJsonArray<EquipmentType>(filePath);
	await writeJsonArray(filePath, [...data, newEquipment]);
	return newEquipment;
};
