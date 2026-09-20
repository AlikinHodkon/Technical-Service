import cors from 'cors';
import { config } from '../config/env.ts';
import { ForbiddenError } from '../errors/error.ts';

export const corsMiddleware = cors({
	origin: (origin, callback) => {
		if (!origin || config.corsOrigins.includes(origin)) {
			return callback(null, true);
		}
		return callback(new ForbiddenError('CORS: источник не разрешён'));
	},
});
