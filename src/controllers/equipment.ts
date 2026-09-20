import type { Request, Response } from 'express';
import {
	equipmentServiceCreate,
	equipmentServiceDelete,
	equipmentServiceGetAll,
	equipmentServiceGetById,
	equipmentServiceUpdate,
} from '../services/equipmentService.ts';
import { requestsServiceGetByEquipmentId } from '../services/requestsService.ts';
import type {
	CreateEquipmentBody,
	GetEquipmentQuery,
	UpdateEquipmentBody,
} from '../validators/equipment.validator.ts';
import type { GetRequestsQuery } from '../validators/requests.validator.ts';

export const createEquipment = async (req: Request, res: Response) => {
	const equipment = await equipmentServiceCreate(
		req.valid.body as CreateEquipmentBody,
	);
	return res
		.status(201)
		.location(`/api/equipment/${equipment.id}`)
		.json(equipment);
};

export const getAllEquipment = async (req: Request, res: Response) => {
	const result = await equipmentServiceGetAll(
		req.valid.query as GetEquipmentQuery,
	);
	return res.status(200).json(result);
};

export const getEquipmentById = async (req: Request, res: Response) => {
	const equipment = await equipmentServiceGetById(req.params.id as string);
	return res.status(200).json(equipment);
};

export const updateEquipment = async (req: Request, res: Response) => {
	const equipment = await equipmentServiceUpdate(
		req.params.id as string,
		req.valid.body as UpdateEquipmentBody,
	);
	return res.status(200).json(equipment);
};

export const deleteEquipment = async (req: Request, res: Response) => {
	await equipmentServiceDelete(req.params.id as string);
	return res.status(204).send();
};

export const getEquipmentRequests = async (req: Request, res: Response) => {
	const result = await requestsServiceGetByEquipmentId(
		req.params.id as string,
		req.valid.query as GetRequestsQuery,
	);
	return res.status(200).json(result);
};
