import { Router } from 'express';
import {
	createEquipment,
	deleteEquipment,
	getAllEquipment,
	getEquipmentById,
	getEquipmentRequests,
	getEquipmentWeather,
	updateEquipment,
} from '../controllers/equipment.ts';
import { apiKeyAuth, validate } from '../middlewares/index.ts';
import { idParamSchema } from '../validators/common.validator.ts';
import {
	createEquipmentSchema,
	getEquipmentQuerySchema,
	updateEquipmentSchema,
} from '../validators/equipment.validator.ts';
import { getRequestsQuerySchema } from '../validators/requests.validator.ts';

const router = Router();

router.get(
	'/equipment',
	validate({ query: getEquipmentQuerySchema }),
	getAllEquipment,
);
router.post(
	'/equipment',
	apiKeyAuth,
	validate({ body: createEquipmentSchema }),
	createEquipment,
);
router.get(
	'/equipment/:id',
	validate({ params: idParamSchema }),
	getEquipmentById,
);
router.patch(
	'/equipment/:id',
	apiKeyAuth,
	validate({ params: idParamSchema, body: updateEquipmentSchema }),
	updateEquipment,
);
router.delete(
	'/equipment/:id',
	apiKeyAuth,
	validate({ params: idParamSchema }),
	deleteEquipment,
);
router.get(
	'/equipment/:id/requests',
	validate({ params: idParamSchema, query: getRequestsQuerySchema }),
	getEquipmentRequests,
);
router.get(
	'/equipment/:id/weather',
	validate({ params: idParamSchema }),
	getEquipmentWeather,
);

export default router;
