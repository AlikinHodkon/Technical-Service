import type { NextFunction, Request, Response } from 'express';
import { httpRequestDuration } from '../config/metrics.ts';

export function metricsMiddleware(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	const end = httpRequestDuration.startTimer({ method: req.method });

	res.on('finish', () => {
		const route = req.route ? req.baseUrl + req.route.path : 'unmatched';
		end({ route, status_code: String(res.statusCode) });
	});

	next();
}
