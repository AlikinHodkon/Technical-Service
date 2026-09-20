import type { ErrorRequestHandler } from 'express';
import { logger } from '../config/logger.ts';

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
	if (res.headersSent) return next(err);

	const status = err.status ?? err.statusCode ?? 500;
	const isOperational = err.isOperational === true || status < 500;

	const log = req.log ?? logger;
	log[status >= 500 ? 'error' : 'warn']({ err, status }, 'request failed');

	const body = {
		type: `https://example.com/problems/${err.code ?? 'internal-error'}`,
		title: isOperational ? err.message : 'Внутренняя ошибка сервера',
		status,
		instance: req.originalUrl,
		requestId: req.id,
		errors: {},
	};

	if (err.details) body.errors = err.details;

	res.status(status).type('application/problem+json').json(body);
};
