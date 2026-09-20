import type { EquipmentType } from '../types.ts';
import { dataType } from './constants.ts';
import {
	getFilePath,
	readJsonArray,
	withFileLock,
	writeJsonArray,
} from './utils.ts';

export const equipmentGetAllData = async () => {
	const filePath = await getFilePath(dataType.EQUIPMENT);
	return readJsonArray<EquipmentType>(filePath);
};

export const equipmentCheckIsExist = async (serialNumber: string) => {
	const data = await equipmentGetAllData();
	return data.some((equipment) => equipment.serialNumber === serialNumber);
};

export const equipmentFindById = async (id: string) => {
	const data = await equipmentGetAllData();
	return data.find((equipment) => equipment.id === id) ?? null;
};

export const equipmentSaveData = async (newEquipment: EquipmentType) => {
	const filePath = await getFilePath(dataType.EQUIPMENT);
	return withFileLock(filePath, async () => {
		const data = await readJsonArray<EquipmentType>(filePath);
		await writeJsonArray(filePath, [...data, newEquipment]);
		return newEquipment;
	});
};

export const equipmentMutateOne = async (
	id: string,
	mutate: (current: EquipmentType) => EquipmentType,
): Promise<EquipmentType | null> => {
	const filePath = await getFilePath(dataType.EQUIPMENT);
	return withFileLock(filePath, async () => {
		const data = await readJsonArray<EquipmentType>(filePath);
		const index = data.findIndex((equipment) => equipment.id === id);
		const current = data[index];
		if (!current) return null;

		const updated = mutate(current);
		data[index] = updated;
		await writeJsonArray(filePath, data);
		return updated;
	});
};

export const equipmentUpdateData = async (
	id: string,
	updates: Partial<Omit<EquipmentType, 'id'>>,
) => equipmentMutateOne(id, (current) => ({ ...current, ...updates, id }));

export const equipmentDeleteData = async (id: string) => {
	const filePath = await getFilePath(dataType.EQUIPMENT);
	return withFileLock(filePath, async () => {
		const data = await readJsonArray<EquipmentType>(filePath);
		const index = data.findIndex((equipment) => equipment.id === id);
		if (index === -1) return false;

		data.splice(index, 1);
		await writeJsonArray(filePath, data);
		return true;
	});
};
