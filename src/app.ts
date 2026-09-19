import express from 'express';
import {
	contextMiddleware,
	errorHandler,
	httpLogger,
} from './middlewares/index.ts';
import { equipmentRouter, healthRouter } from './routes/index.ts';

const app = express();

app.use(httpLogger);
app.use(contextMiddleware);
app.use(express.json({ limit: '100kb' }));

app.use('/api', healthRouter);
app.use('/api', equipmentRouter);

app.use(errorHandler);

export default app;
