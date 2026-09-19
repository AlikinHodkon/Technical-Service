import { Router } from 'express';
import {
	createEquipment,
	deleteEquipment,
	getAllEquipment,
	getEquipmentById,
	updateEquipment,
} from '../controllers/equipment.ts';

const router = Router();

router.get('/equipment', getAllEquipment);
router.post('/equipment', createEquipment);
router.get('/equipment/:id', getEquipmentById);
router.patch('/equipment/:id', updateEquipment);
router.delete('/equipment/:id', deleteEquipment);

export default router;
