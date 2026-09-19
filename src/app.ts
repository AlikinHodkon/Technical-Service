import express from 'express';
import {
	contextMiddleware,
	errorHandler,
	httpLogger,
} from './middlewares/index.ts';
import healthRouter from './routes/health.route.ts';

const app = express();

app.use(httpLogger);
app.use(contextMiddleware);

app.use('/api', healthRouter);

app.use(errorHandler);

export default app;
