import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import { NotFoundError } from './errors/error.ts';
import {
	contextMiddleware,
	corsMiddleware,
	errorHandler,
	httpLogger,
	rateLimiter,
} from './middlewares/index.ts';
import {
	docsRouter,
	equipmentRouter,
	healthRouter,
	reportsRouter,
	requestsRouter,
	sitesRouter,
} from './routes/index.ts';

const app = express();

// мы за nginx, доверяем ему один хоп — иначе rate-limit видит не клиента, а сам nginx
app.set('trust proxy', 1);

app.use(httpLogger);
app.use(contextMiddleware);
app.use(helmet());
app.use(corsMiddleware);
app.use(express.static(path.join(import.meta.dirname, '..', 'public')));
app.use('/api', rateLimiter);
app.use(express.json({ limit: '100kb' }));

app.use('/api', healthRouter);
app.use('/api', docsRouter);
app.use('/api', equipmentRouter);
app.use('/api', requestsRouter);
app.use('/api', sitesRouter);
app.use('/api', reportsRouter);
app.use('/', () => {
	throw new NotFoundError('Маршрут');
});

app.use(errorHandler);

export default app;
