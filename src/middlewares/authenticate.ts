import type { NextFunction, Request, Response } from 'express';
import type { AccessTokenPayload } from '../config/jwt.ts';
import { verifyAccessToken } from '../config/jwt.ts';
import { UnauthorizedError } from '../errors/error.ts';

declare global {
	namespace Express {
		interface Request {
			user?: AccessTokenPayload;
		}
	}
}

export const authenticate = (
	req: Request,
	_res: Response,
	next: NextFunction,
) => {
	const header = req.get('Authorization');
	const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
	if (!token) return next(new UnauthorizedError('Токен не предоставлен'));

	try {
		// Только подпись/срок, без похода в БД — logout отзывает с задержкой до истечения access-токена (см. README).
		req.user = verifyAccessToken(token);
		next();
	} catch {
		next(new UnauthorizedError('Невалидный или истёкший токен'));
	}
};
