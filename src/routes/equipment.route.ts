import { Router } from 'express';
import {
	createEquipment,
	deleteEquipment,
	getAllEquipment,
	getEquipmentById,
	updateEquipment,
} from '../controllers/equipment.ts';
import { validate } from '../middlewares/index.ts';
import {
	createEquipmentSchema,
	getEquipmentQuerySchema,
	updateEquipmentSchema,
} from '../validators/equipment.validator.ts';

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

export default router;
