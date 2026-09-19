import type { Request, Response } from 'express';
import { equipmentServiceCreate } from '../services/equipmentService.ts';

export const createEquipment = async (req: Request, res: Response) => {
	const equipment = await equipmentServiceCreate(req.body);
	return res
		.status(201)
		.location(`/api/equipment/${equipment.id}`)
		.json(equipment);
};
