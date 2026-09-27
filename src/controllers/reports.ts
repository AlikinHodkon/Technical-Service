import type { Request, Response } from 'express';
import { reportsServiceGetEquipmentLoad } from '../services/reportsService.ts';
import type { GetEquipmentLoadQuery } from '../validators/reports.validator.ts';

export const getEquipmentLoadReport = async (req: Request, res: Response) => {
	const result = await reportsServiceGetEquipmentLoad(
		req.valid.query as GetEquipmentLoadQuery,
	);
	return res.status(200).json(result);
};
