import type { Request, Response } from 'express';
import {
	equipmentServiceCreate,
	equipmentServiceDelete,
	equipmentServiceGetAll,
	equipmentServiceGetById,
	equipmentServiceUpdate,
} from '../services/equipmentService.ts';

export const createEquipment = async (req: Request, res: Response) => {
	const equipment = await equipmentServiceCreate(req.body);
	return res
		.status(201)
		.location(`/api/equipment/${equipment.id}`)
		.json(equipment);
};

export const getAllEquipment = async (req: Request, res: Response) => {
	const { status, type, sort, page, limit } = req.query as Record<
		string,
		string
	>;
	const result = await equipmentServiceGetAll({
		status,
		type,
		sort,
		page,
		limit,
	});
	return res.status(200).json(result);
};

export const getEquipmentById = async (req: Request, res: Response) => {
	const equipment = await equipmentServiceGetById(req.params.id as string);
	return res.status(200).json(equipment);
};

export const updateEquipment = async (req: Request, res: Response) => {
	const equipment = await equipmentServiceUpdate(
		req.params.id as string,
		req.body,
	);
	return res.status(200).json(equipment);
};

export const deleteEquipment = async (req: Request, res: Response) => {
	await equipmentServiceDelete(req.params.id as string);
	return res.status(204).send();
};
