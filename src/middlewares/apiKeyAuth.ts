import type { NextFunction, Request, Response } from 'express';
import { config } from '../config/env.ts';
import { UnauthorizedError } from '../errors/error.ts';

export const apiKeyAuth = (
	req: Request,
	_res: Response,
	next: NextFunction,
) => {
	if (req.get('X-API-Key') !== config.apiKey) {
		return next(new UnauthorizedError());
	}
	next();
};
