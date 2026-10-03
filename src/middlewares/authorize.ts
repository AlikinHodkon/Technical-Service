import type { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '../errors/error.ts';

export const authorize =
	(...allowedRoles: string[]) =>
	(req: Request, _res: Response, next: NextFunction) => {
		if (!req.user) return next(new UnauthorizedError());
		if (!allowedRoles.includes(req.user.role)) {
			return next(new ForbiddenError());
		}
		next();
	};
