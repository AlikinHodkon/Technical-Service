import { Router } from 'express';
import { createEquipment } from '../controllers/equipment.ts';

const router = Router();

router.post('/equipment', createEquipment);

export default router;
