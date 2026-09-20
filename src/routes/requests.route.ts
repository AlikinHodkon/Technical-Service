import { Router } from 'express';
import {
	createRequest,
	deleteRequest,
	getAllRequests,
	getRequestById,
	updateRequest,
	updateRequestStatus,
} from '../controllers/requests.ts';
import { validate } from '../middlewares/index.ts';
import { idParamSchema } from '../validators/common.validator.ts';
import {
	createRequestSchema,
	getRequestsQuerySchema,
	updateRequestSchema,
	updateRequestStatusSchema,
} from '../validators/requests.validator.ts';

const router = Router();

router.get(
	'/requests',
	validate({ query: getRequestsQuerySchema }),
	getAllRequests,
);
router.post(
	'/requests',
	validate({ body: createRequestSchema }),
	createRequest,
);
router.get(
	'/requests/:id',
	validate({ params: idParamSchema }),
	getRequestById,
);
router.patch(
	'/requests/:id',
	validate({ params: idParamSchema, body: updateRequestSchema }),
	updateRequest,
);
router.patch(
	'/requests/:id/status',
	validate({ params: idParamSchema, body: updateRequestStatusSchema }),
	updateRequestStatus,
);
router.delete(
	'/requests/:id',
	validate({ params: idParamSchema }),
	deleteRequest,
);

export default router;
