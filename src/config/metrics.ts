import { collectDefaultMetrics, Histogram, Registry } from 'prom-client';

export const register = new Registry();
collectDefaultMetrics({ register });

export const httpRequestDuration = new Histogram({
	name: 'http_request_duration_seconds',
	help: 'Длительность обработки HTTP-запроса в секундах',
	labelNames: ['method', 'route', 'status_code'] as const,
	registers: [register],
});
