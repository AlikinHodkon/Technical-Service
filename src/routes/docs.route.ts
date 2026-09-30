import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openapiDocument } from '../docs/openapi.ts';

const router = Router();

router.get('/openapi.json', (_req, res) => res.json(openapiDocument));

// swagger-ui-express рендерит страницу с инлайн-<script>, который
// инициализирует SwaggerUIBundle — глобальный helmet() выше по цепочке
// ставит CSP script-src 'self' без 'unsafe-inline' и блокирует его.
// Снимаем CSP только для /api/docs, остальные маршруты не затрагиваются.
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
