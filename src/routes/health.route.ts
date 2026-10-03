import { Router } from 'express';
import { sequelize } from '../config/db.ts';

const router = Router();

router.get('/health/live', (_req, res) => {
	res.json({ status: 'ok' });
});

router.get('/health/ready', async (_req, res) => {
	try {
		await sequelize.authenticate();
		res.json({ status: 'ok' });
	} catch {
		res.status(503).json({ status: 'error' });
	}
});

export default router;
