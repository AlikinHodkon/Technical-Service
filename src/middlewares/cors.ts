import cors from 'cors';
import { config } from '../config/env.ts';
import { ForbiddenError } from '../errors/error.ts';

const isSelfOrigin = (origin: string, host: string | undefined) => {
	try {
		return new URL(origin).host === host;
	} catch {
		return false;
	}
};

export const corsMiddleware = cors((req, callback) => {
	const origin = req.headers.origin;

	if (
		!origin ||
		isSelfOrigin(origin, req.headers.host) ||
		config.corsOrigins.includes(origin)
	) {
		return callback(null, { origin: true });
	}
	return callback(new ForbiddenError('CORS: источник не разрешён'));
});
