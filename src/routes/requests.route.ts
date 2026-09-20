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
router.get('/requests/:id', getRequestById);
router.patch(
	'/requests/:id',
	validate({ body: updateRequestSchema }),
	updateRequest,
);
router.patch(
	'/requests/:id/status',
	validate({ body: updateRequestStatusSchema }),
	updateRequestStatus,
);
router.delete('/requests/:id', deleteRequest);

export default router;
