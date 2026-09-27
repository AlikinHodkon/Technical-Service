import type { Request, Response } from 'express';
import {
	requestAssigneesServiceRemove,
	requestAssigneesServiceSet,
} from '../services/requestAssigneesService.ts';
import type { SetRequestAssigneesBody } from '../validators/requestAssignees.validator.ts';

export const setRequestAssignees = async (req: Request, res: Response) => {
	const result = await requestAssigneesServiceSet(
		req.params.id as string,
		req.valid.body as SetRequestAssigneesBody,
	);
	return res.status(200).json(result);
};

export const removeRequestAssignee = async (req: Request, res: Response) => {
	await requestAssigneesServiceRemove(
		req.params.id as string,
		req.params.userId as string,
	);
	return res.status(204).send();
};
