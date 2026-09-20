import type { Request, Response } from 'express';
import {
	requestsServiceCreate,
	requestsServiceDelete,
	requestsServiceGetAll,
	requestsServiceGetById,
	requestsServiceUpdate,
	requestsServiceUpdateStatus,
} from '../services/requestsService.ts';
import type {
	CreateRequestBody,
	GetRequestsQuery,
	UpdateRequestBody,
	UpdateRequestStatusBody,
} from '../validators/requests.validator.ts';

export const createRequest = async (req: Request, res: Response) => {
	const requestItem = await requestsServiceCreate(
		req.valid.body as CreateRequestBody,
	);
	return res
		.status(201)
		.location(`/api/requests/${requestItem.id}`)
		.json(requestItem);
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
