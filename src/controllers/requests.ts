import type { Request, Response } from 'express';
import { AppError } from '../errors/error.ts';
import {
	requestsServiceCreate,
	requestsServiceDelete,
	requestsServiceGetAll,
	requestsServiceGetById,
	requestsServiceUpdate,
	requestsServiceUpdateStatus,
} from '../services/requestsService.ts';
import type { ErrorDetail, RequestType } from '../types.ts';
import {
	type BulkCreateRequestsBody,
	type CreateRequestBody,
	createRequestSchema,
	type GetRequestsQuery,
	type UpdateRequestBody,
	type UpdateRequestStatusBody,
} from '../validators/requests.validator.ts';

type BulkImportResult =
	| { index: number; status: 'created'; data: RequestType }
	| { index: number; status: 'error'; errors: ErrorDetail[] };

export const createRequest = async (req: Request, res: Response) => {
	const requestItem = await requestsServiceCreate(
		req.valid.body as CreateRequestBody,
	);
	return res
		.status(201)
		.location(`/api/requests/${requestItem.id}`)
		.json(requestItem);
};

export const bulkCreateRequests = async (req: Request, res: Response) => {
	const { requests: items } = req.valid.body as BulkCreateRequestsBody;

	const results: BulkImportResult[] = [];
	for (const [index, item] of items.entries()) {
		const parsed = createRequestSchema.safeParse(item);
		if (!parsed.success) {
			results.push({
				index,
				status: 'error',
				errors: parsed.error.issues.map((issue) => ({
					field: issue.path.join('.') || '(корень)',
					code: issue.code,
					message: issue.message,
				})),
			});
			continue;
		}

		try {
			const created = await requestsServiceCreate(parsed.data);
			results.push({ index, status: 'created', data: created });
		} catch (error) {
			if (!(error instanceof AppError)) throw error;
			results.push({
				index,
				status: 'error',
				errors: [
					{ field: 'equipmentId', code: error.code, message: error.message },
				],
			});
		}
	}

	const created = results.filter((r) => r.status === 'created').length;
	return res.status(207).json({
		results,
		summary: {
			total: items.length,
			created,
			failed: items.length - created,
		},
	});
};

export const getAllRequests = async (req: Request, res: Response) => {
	const result = await requestsServiceGetAll(
		req.valid.query as GetRequestsQuery,
	);
	return res.status(200).json(result);
};

export const getRequestById = async (req: Request, res: Response) => {
	const requestItem = await requestsServiceGetById(req.params.id as string);
	return res.status(200).json(requestItem);
};

export const updateRequest = async (req: Request, res: Response) => {
	const requestItem = await requestsServiceUpdate(
		req.params.id as string,
		req.valid.body as UpdateRequestBody,
	);
	return res.status(200).json(requestItem);
};

export const updateRequestStatus = async (req: Request, res: Response) => {
	const { status } = req.valid.body as UpdateRequestStatusBody;
	const requestItem = await requestsServiceUpdateStatus(
		req.params.id as string,
		status,
	);
	return res.status(200).json(requestItem);
};

export const deleteRequest = async (req: Request, res: Response) => {
	await requestsServiceDelete(req.params.id as string);
	return res.status(204).send();
};
