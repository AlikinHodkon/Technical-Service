import type { RequestType } from '../types.ts';
import { dataType } from './constants.ts';
import {
	getFilePath,
	readJsonArray,
	withFileLock,
	writeJsonArray,
} from './utils.ts';

export const requestsGetAllData = async () => {
	const filePath = await getFilePath(dataType.REQUESTS);
	return readJsonArray<RequestType>(filePath);
};

export const requestsFindById = async (id: string) => {
	const data = await requestsGetAllData();
	return data.find((request) => request.id === id) ?? null;
};

export const requestsFindByEquipmentId = async (equipmentId: string) => {
	const data = await requestsGetAllData();
	return data.filter((request) => request.equipmentId === equipmentId);
};

export const requestsSaveData = async (newRequest: RequestType) => {
	const filePath = await getFilePath(dataType.REQUESTS);
	return withFileLock(filePath, async () => {
		const data = await readJsonArray<RequestType>(filePath);
		await writeJsonArray(filePath, [...data, newRequest]);
		return newRequest;
	});
};

export const requestsMutateOne = async (
	id: string,
	mutate: (current: RequestType) => RequestType,
): Promise<RequestType | null> => {
	const filePath = await getFilePath(dataType.REQUESTS);
	return withFileLock(filePath, async () => {
		const data = await readJsonArray<RequestType>(filePath);
		const index = data.findIndex((request) => request.id === id);
		const current = data[index];
		if (!current) return null;

		const updated = mutate(current);
		data[index] = updated;
		await writeJsonArray(filePath, data);
		return updated;
	});
};

export const requestsUpdateData = async (
	id: string,
	updates: Partial<Omit<RequestType, 'id'>>,
) => requestsMutateOne(id, (current) => ({ ...current, ...updates, id }));

export const requestsDeleteData = async (id: string) => {
	const filePath = await getFilePath(dataType.REQUESTS);
	return withFileLock(filePath, async () => {
		const data = await readJsonArray<RequestType>(filePath);
		const index = data.findIndex((request) => request.id === id);
		if (index === -1) return false;

		data.splice(index, 1);
		await writeJsonArray(filePath, data);
		return true;
	});
};
