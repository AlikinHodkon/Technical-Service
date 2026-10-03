import { Router } from 'express';
import {
	removeRequestAssignee,
	setRequestAssignees,
} from '../controllers/requestAssignees.ts';
import {
	bulkCreateRequests,
	createRequest,
	deleteRequest,
	getAllRequests,
	getRequestById,
	getRequestHistory,
	updateRequest,
	updateRequestStatus,
} from '../controllers/requests.ts';
import { authenticate, authorize, validate } from '../middlewares/index.ts';
import { idParamSchema } from '../validators/common.validator.ts';
import {
	requestAssigneeParamsSchema,
	setRequestAssigneesSchema,
} from '../validators/requestAssignees.validator.ts';
import {
	bulkCreateRequestsSchema,
	createRequestSchema,
	getRequestsQuerySchema,
	updateRequestSchema,
	updateRequestStatusSchema,
} from '../validators/requests.validator.ts';

const router = Router();

router.use(authenticate);

router.get(
	'/requests',
	validate({ query: getRequestsQuerySchema }),
	getAllRequests,
);
router.post(
	'/requests',
	authorize('technician', 'admin'),
	validate({ body: createRequestSchema }),
	createRequest,
);
router.post(
	'/requests/bulk',
	authorize('technician', 'admin'),
	validate({ body: bulkCreateRequestsSchema }),
	bulkCreateRequests,
);
router.get(
	'/requests/:id',
	validate({ params: idParamSchema }),
	getRequestById,
);
router.patch(
	'/requests/:id',
	authorize('technician', 'admin'),
	validate({ params: idParamSchema, body: updateRequestSchema }),
	updateRequest,
);
router.patch(
	'/requests/:id/status',
	// technician/admin проходят сюда; дальше в requestsServiceUpdateStatus —
	// ABAC-проверка, что technician назначен именно на эту заявку.
	authorize('technician', 'admin'),
	validate({ params: idParamSchema, body: updateRequestStatusSchema }),
	updateRequestStatus,
);
router.delete(
	'/requests/:id',
	authorize('admin'),
	validate({ params: idParamSchema }),
	deleteRequest,
);
router.get(
	'/requests/:id/history',
	validate({ params: idParamSchema }),
	getRequestHistory,
);
router.post(
	'/requests/:id/assignees',
	authorize('admin'),
	validate({ params: idParamSchema, body: setRequestAssigneesSchema }),
	setRequestAssignees,
);
router.delete(
	'/requests/:id/assignees/:userId',
	authorize('admin'),
	validate({ params: requestAssigneeParamsSchema }),
	removeRequestAssignee,
);

export default router;
