import { Router } from 'express';
import { getSiteSummary } from '../controllers/sites.ts';
import { authenticate, validate } from '../middlewares/index.ts';
import { idParamSchema } from '../validators/common.validator.ts';

const router = Router();

router.use(authenticate);

router.get(
	'/sites/:id/summary',
	validate({ params: idParamSchema }),
	getSiteSummary,
);

export default router;
