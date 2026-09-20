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
	equipmentRouter,
	healthRouter,
	requestsRouter,
} from './routes/index.ts';

const app = express();

app.use(httpLogger);
app.use(contextMiddleware);
app.use(helmet());
app.use(corsMiddleware);
app.use('/api', rateLimiter);
app.use(express.json({ limit: '100kb' }));

app.use('/api', healthRouter);
app.use('/api', equipmentRouter);
app.use('/api', requestsRouter);
app.use('/', () => {
	throw new NotFoundError('Маршрут');
});

app.use(errorHandler);

export default app;
