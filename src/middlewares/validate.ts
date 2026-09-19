import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { ValidationError } from '../errors/error.ts';

export type ValidationSchemas = {
	body?: ZodType;
	query?: ZodType;
	params?: ZodType;
};

declare global {
	namespace Express {
		interface Request {
			valid: {
				body?: unknown;
				query?: unknown;
				params?: unknown;
			};
		}
	}
}

const PARTS = ['body', 'query', 'params'] as const;

export function validate(schemas: ValidationSchemas) {
	return (req: Request, _res: Response, next: NextFunction) => {
		req.valid = {};

		for (const part of PARTS) {
			const schema = schemas[part];
			if (!schema) continue;

			const result = schema.safeParse(req[part]);
			if (!result.success) {
				return next(
					new ValidationError({
						issues: result.error.issues.map((issue) => ({
							path: issue.path.map(String),
							code: issue.code,
							message: issue.message,
						})),
					}),
				);
			}
			req.valid[part] = result.data;
		}

		next();
	};
}
