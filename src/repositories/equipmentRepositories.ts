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

export const equipmentGetAllData = async () => {
	const filePath = await getFilePath(dataType.EQUIPMENT);
	return readJsonArray<EquipmentType>(filePath);
};

export const equipmentFindById = async (id: string) => {
	const data = await equipmentGetAllData();
	return data.find((equipment) => equipment.id === id) ?? null;
};

export const equipmentUpdateData = async (
	id: string,
	updates: Partial<Omit<EquipmentType, 'id'>>,
) => {
	const filePath = await getFilePath(dataType.EQUIPMENT);
	const data = await readJsonArray<EquipmentType>(filePath);
	const index = data.findIndex((equipment) => equipment.id === id);
	const current = data[index];
	if (!current) return null;

	const updated = { ...current, ...updates, id };
	data[index] = updated;
	await writeJsonArray(filePath, data);
	return updated;
};

export const equipmentDeleteData = async (id: string) => {
	const filePath = await getFilePath(dataType.EQUIPMENT);
	const data = await readJsonArray<EquipmentType>(filePath);
	const index = data.findIndex((equipment) => equipment.id === id);
	if (index === -1) return false;

	data.splice(index, 1);
	await writeJsonArray(filePath, data);
	return true;
};
