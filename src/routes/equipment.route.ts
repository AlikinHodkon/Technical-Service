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
import { validate } from '../middlewares/index.ts';
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
	validate({ body: createEquipmentSchema }),
	createEquipment,
);
router.get('/equipment/:id', getEquipmentById);
router.patch(
	'/equipment/:id',
	validate({ body: updateEquipmentSchema }),
	updateEquipment,
);
router.delete('/equipment/:id', deleteEquipment);
router.get(
	'/equipment/:id/requests',
	validate({ query: getRequestsQuerySchema }),
	getEquipmentRequests,
);
router.get('/equipment/:id/weather', getEquipmentWeather);

export default router;
