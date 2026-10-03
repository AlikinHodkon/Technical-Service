import bcrypt from 'bcrypt';
import { UniqueConstraintError } from 'sequelize';
import {
	signAccessToken,
	signRefreshToken,
	verifyRefreshToken,
} from '../config/jwt.ts';
import { ConflictError, UnauthorizedError } from '../errors/error.ts';
import {
	usersCreate,
	usersFindByEmail,
	usersFindById,
	usersIncrementTokenVersion,
} from '../repositories/usersRepositories.ts';
import type { LoginBody, RegisterBody } from '../validators/auth.validator.ts';

const SALT_ROUNDS = 10;

const INVALID_CREDENTIALS_MESSAGE = 'Неверный email или пароль';

const toPublicUser = (user: {
	id: string;
	email: string;
	roleCode: string;
}) => ({ id: user.id, email: user.email, role: user.roleCode });

export const authServiceRegister = async (body: RegisterBody) => {
	try {
		const passwordHash = await bcrypt.hash(body.password, SALT_ROUNDS);
		const user = await usersCreate({
			email: body.email,
			passwordHash,
		});
		return toPublicUser(user);
	} catch (err) {
		if (err instanceof UniqueConstraintError) {
			throw new ConflictError('Пользователь с таким email уже существует');
		}
		throw err;
	}
};

export const authServiceLogin = async (body: LoginBody) => {
	const user = await usersFindByEmail(body.email);
	if (!user) throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);

	const passwordMatches = await bcrypt.compare(
		body.password,
		user.passwordHash,
	);
	if (!passwordMatches) {
		throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
	}

	const accessToken = signAccessToken({
		userId: user.id,
		role: user.roleCode,
		technicianId: user.technicianId,
	});
	const refreshToken = signRefreshToken({
		userId: user.id,
		tokenVersion: user.tokenVersion,
	});

	return { accessToken, refreshToken, user: toPublicUser(user) };
};

export const authServiceRefresh = async (refreshToken: string) => {
	let payload: ReturnType<typeof verifyRefreshToken>;
	try {
		payload = verifyRefreshToken(refreshToken);
	} catch {
		throw new UnauthorizedError('Невалидный refresh-токен');
	}

	const user = await usersFindById(payload.userId);
	// Несовпадение версии — значит пользователь вышел или сменил пароль
	// после того, как этот refresh-токен был выдан (см. logout).
	if (!user || user.tokenVersion !== payload.tokenVersion) {
		throw new UnauthorizedError('Refresh-токен отозван');
	}

	const accessToken = signAccessToken({
		userId: user.id,
		role: user.roleCode,
		technicianId: user.technicianId,
	});

	return { accessToken };
};

export const authServiceLogout = async (userId: string) => {
	await usersIncrementTokenVersion(userId);
};

export const authServiceGetMe = async (userId: string) => {
	const user = await usersFindById(userId);
	if (!user) throw new UnauthorizedError();
	return toPublicUser(user);
};
