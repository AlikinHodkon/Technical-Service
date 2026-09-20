import type { ErrorDetail } from '../types.ts';

export class AppError extends Error {
	code: string;
	status: number;
	details?: ErrorDetail[];
	isOperational: boolean;
	constructor(
		message: string,
		{
			status = 500,
			code = 'internal_error',
			details,
			cause,
		}: {
			status: number;
			code: string;
			details?: ErrorDetail[];
			cause?: unknown;
		},
	) {
		super(message, { cause });
		this.name = new.target.name;
		this.status = status;
		this.code = code;
		this.details = details;
		this.isOperational = true;
	}
}

export class NotFoundError extends AppError {
	constructor(what = 'Ресурс', verb = 'не найден') {
		super(`${what} ${verb}`, { status: 404, code: 'not_found' });
	}
}

export class ConflictError extends AppError {
	constructor(message: string) {
		super(message, { status: 409, code: 'conflict' });
	}
}

export class ValidationError extends AppError {
	constructor(zodError: {
		issues: { path: string[]; code: string; message: string }[];
	}) {
		super('Ошибка валидации', {
			status: 422,
			code: 'validation_failed',
			details: zodError.issues.map((i) => ({
				field: i.path.join('.') || '(корень)',
				code: i.code,
				message: i.message,
			})),
		});
	}
}

export class UnauthorizedError extends AppError {
	constructor(message = 'Неверный или отсутствующий API-ключ') {
		super(message, { status: 401, code: 'unauthorized' });
	}
}

export class ForbiddenError extends AppError {
	constructor(message = 'Доступ запрещён') {
		super(message, { status: 403, code: 'forbidden' });
	}
}

export class TooManyRequestsError extends AppError {
	constructor(message = 'Слишком много запросов, попробуйте позже') {
		super(message, { status: 429, code: 'too_many_requests' });
	}
}

export class ServiceUnavailableError extends AppError {
	constructor(message: string, cause?: unknown) {
		super(message, { status: 503, code: 'service_unavailable', cause });
	}
}
