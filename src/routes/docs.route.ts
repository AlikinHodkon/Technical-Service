import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openapiDocument } from '../docs/openapi.ts';

const router = Router();

router.get('/openapi.json', (_req, res) => res.json(openapiDocument));

// Глобальный helmet() блокирует инлайн-<script> Swagger UI — снимаем CSP только здесь.
router.use(
	'/docs',
	(_req: Request, res: Response, next: NextFunction) => {
		res.removeHeader('Content-Security-Policy');
		next();
	},
	swaggerUi.serve,
	swaggerUi.setup(openapiDocument),
);

export default router;
