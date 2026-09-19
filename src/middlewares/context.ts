import { AsyncLocalStorage } from 'node:async_hooks';
import type { NextFunction, Request, Response } from 'express';
import type { Logger } from 'pino';
import type { ReqId } from 'pino-http';
import { logger } from '../config/logger.ts';

type RequestContext = {
	reqId: ReqId;
	log: Logger;
};

export const store = new AsyncLocalStorage<RequestContext>();

export const contextMiddleware = (
	req: Request,
	_res: Response,
	next: NextFunction,
) => {
	store.run({ reqId: req.id, log: req.log }, next);
};

export const getLog = () => store.getStore()?.log ?? logger;
