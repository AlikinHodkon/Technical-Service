import pino from 'pino';
import { config } from './env.ts';

export const logger = pino({
	level: process.env.LOG_LEVEL ?? 'info',
	redact: [
		'req.headers.authorization',
		'req.headers.cookie',
		'*.password',
		'*.token',
	],
	...(!config.isProduction && {
		transport: { target: 'pino-pretty' },
	}),
});
