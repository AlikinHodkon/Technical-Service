import express from 'express';
import healthRouter from './routes/health.route.ts';

const app = express();

app.use('/api', healthRouter);

export default app;
