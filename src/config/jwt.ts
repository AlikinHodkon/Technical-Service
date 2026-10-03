import jwt from 'jsonwebtoken';
import { config } from './env.ts';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';

export type AccessTokenPayload = {
	userId: string;
	role: string;
	technicianId: string | null;
};

export type RefreshTokenPayload = {
	userId: string;
	tokenVersion: number;
};

export const signAccessToken = (payload: AccessTokenPayload) =>
	jwt.sign(payload, config.jwt.accessSecret, { expiresIn: ACCESS_TOKEN_TTL });

export const signRefreshToken = (payload: RefreshTokenPayload) =>
	jwt.sign(payload, config.jwt.refreshSecret, {
		expiresIn: REFRESH_TOKEN_TTL,
	});

export const verifyAccessToken = (token: string): AccessTokenPayload =>
	jwt.verify(token, config.jwt.accessSecret) as AccessTokenPayload;

export const verifyRefreshToken = (token: string): RefreshTokenPayload =>
	jwt.verify(token, config.jwt.refreshSecret) as RefreshTokenPayload;

export const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
