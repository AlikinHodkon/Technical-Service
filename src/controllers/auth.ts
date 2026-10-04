import type { Request, Response } from 'express';
import { config } from '../config/env.ts';
import type { AccessTokenPayload } from '../config/jwt.ts';
import { REFRESH_COOKIE_MAX_AGE_MS } from '../config/jwt.ts';
import { UnauthorizedError } from '../errors/error.ts';
import {
	authServiceGetMe,
	authServiceLogin,
	authServiceLogout,
	authServiceRefresh,
	authServiceRegister,
} from '../services/authService.ts';
import type { LoginBody, RegisterBody } from '../validators/auth.validator.ts';

const REFRESH_COOKIE_NAME = 'refreshToken';

// Strict безопасен: фронтенд и API на одном origin через nginx, легитимных кросс-сайтовых запросов нет.
const setRefreshCookie = (res: Response, token: string) => {
	res.cookie(REFRESH_COOKIE_NAME, token, {
		httpOnly: true,
		secure: config.isProduction,
		sameSite: 'strict',
		maxAge: REFRESH_COOKIE_MAX_AGE_MS,
	});
};

export const register = async (req: Request, res: Response) => {
	const user = await authServiceRegister(req.valid.body as RegisterBody);
	return res.status(201).json(user);
};

export const login = async (req: Request, res: Response) => {
	const { accessToken, refreshToken, user } = await authServiceLogin(
		req.valid.body as LoginBody,
	);
	setRefreshCookie(res, refreshToken);
	return res.status(200).json({ accessToken, user });
};

export const refresh = async (req: Request, res: Response) => {
	const token = req.cookies?.[REFRESH_COOKIE_NAME];
	if (!token) throw new UnauthorizedError('Refresh-cookie не передан');
	const { accessToken } = await authServiceRefresh(token);
	return res.status(200).json({ accessToken });
};

export const logout = async (req: Request, res: Response) => {
	// authenticate() уже отработал выше по цепочке и гарантирует req.user
	await authServiceLogout((req.user as AccessTokenPayload).userId);
	res.clearCookie(REFRESH_COOKIE_NAME);
	return res.status(204).send();
};

export const me = async (req: Request, res: Response) => {
	const user = await authServiceGetMe((req.user as AccessTokenPayload).userId);
	return res.status(200).json(user);
};
