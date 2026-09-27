import { Router } from 'express';
import { getEquipmentLoadReport } from '../controllers/reports.ts';
import { validate } from '../middlewares/index.ts';
import { getEquipmentLoadQuerySchema } from '../validators/reports.validator.ts';

const router = Router();

router.get(
	'/reports/equipment-load',
	validate({ query: getEquipmentLoadQuerySchema }),
	getEquipmentLoadReport,
);

export default router;
