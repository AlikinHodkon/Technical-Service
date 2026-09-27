import type { Request, Response } from 'express';
import { sitesServiceGetSummary } from '../services/sitesService.ts';

export const getSiteSummary = async (req: Request, res: Response) => {
	const summary = await sitesServiceGetSummary(req.params.id as string);
	return res.status(200).json(summary);
};
