import { Router } from 'express';
import { register } from '../config/metrics.ts';

const router = Router();

const metricsRouter = router.get('/metrics', async (_req, res) => {
	res.set('Content-Type', register.contentType);
	res.end(await register.metrics());
});

export default metricsRouter;
