import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../app.ts';
import { resetDb } from '../testUtils/dbFixtures.ts';

// AUTH_RATE_LIMIT_MAX в .env.test — 25. /login и /register у каждого свой
// счётчик (createAuthRateLimiter() создаёт отдельный инстанс на маршрут),
// но остальные тесты этого файла всё равно расходуют часть бюджета register
// (каждый вызов register() в файле делит один и тот же счётчик) — запас в
// 30 попыток здесь с запасом перекрывает и этот расход, и сам лимит.
const RATE_LIMIT_PROBE_ATTEMPTS = 30;

const credentials = (overrides: Record<string, unknown> = {}) => ({
	email: 'viewer@tech-service.local',
	password: 'Demo12345!',
	...overrides,
});

const register = (overrides: Record<string, unknown> = {}) =>
	request(app).post('/api/auth/register').send(credentials(overrides));

const login = (overrides: Record<string, unknown> = {}) =>
	request(app).post('/api/auth/login').send(credentials(overrides));

beforeEach(async () => {
	await resetDb();
});

describe('POST /api/auth/register', () => {
	it('returns 201 with a viewer account and no password in the response', async () => {
		const response = await register();

		expect(response.status).toBe(201);
		expect(response.body).toMatchObject({
			email: credentials().email,
			role: 'viewer',
		});
		expect(response.body.password).toBeUndefined();
		expect(response.body.passwordHash).toBeUndefined();
	});

	it('ignores a role supplied in the request body', async () => {
		const response = await register({ role: 'admin' });

		expect(response.status).toBe(201);
		expect(response.body.role).toBe('viewer');
	});

	it('returns 409 when the email is already registered', async () => {
		await register();
		const response = await register();

		expect(response.status).toBe(409);
	});

	it('returns 422 for an invalid email', async () => {
		const response = await register({ email: 'not-an-email' });

		expect(response.status).toBe(422);
	});

	it('returns 422 when the password is too short', async () => {
		const response = await register({ password: 'short' });

		expect(response.status).toBe(422);
	});
});

describe('POST /api/auth/login', () => {
	it('returns 200 with an access token and sets the refresh cookie', async () => {
		await register();
		const response = await login();

		expect(response.status).toBe(200);
		expect(typeof response.body.accessToken).toBe('string');
		expect(response.body.user).toMatchObject({
			email: credentials().email,
			role: 'viewer',
		});
		expect(response.headers['set-cookie']?.[0]).toMatch(/^refreshToken=/);
	});

	it('returns the same 401 message for a non-existent email and a wrong password', async () => {
		await register();

		const wrongPassword = await login({ password: 'WrongPassword1!' });
		const unknownEmail = await login({ email: 'ghost@tech-service.local' });

		expect(wrongPassword.status).toBe(401);
		expect(unknownEmail.status).toBe(401);
		expect(wrongPassword.body.title).toBe(unknownEmail.body.title);
	});
});

describe('POST /api/auth/refresh', () => {
	it('returns a new access token from the refresh cookie', async () => {
		await register();
		const loginResponse = await login();
		const cookie = loginResponse.headers['set-cookie'] as unknown as string[];

		const response = await request(app)
			.post('/api/auth/refresh')
			.set('Cookie', cookie);

		expect(response.status).toBe(200);
		expect(typeof response.body.accessToken).toBe('string');
	});

	it('returns 401 without a refresh cookie', async () => {
		const response = await request(app).post('/api/auth/refresh');

		expect(response.status).toBe(401);
	});
});

describe('POST /api/auth/logout', () => {
	it('revokes the refresh cookie so a subsequent refresh fails', async () => {
		await register();
		const loginResponse = await login();
		const cookie = loginResponse.headers['set-cookie'] as unknown as string[];

		const logoutResponse = await request(app)
			.post('/api/auth/logout')
			.set('Authorization', `Bearer ${loginResponse.body.accessToken}`);
		expect(logoutResponse.status).toBe(204);

		const refreshResponse = await request(app)
			.post('/api/auth/refresh')
			.set('Cookie', cookie);
		expect(refreshResponse.status).toBe(401);
	});

	it('returns 401 without a token', async () => {
		const response = await request(app).post('/api/auth/logout');

		expect(response.status).toBe(401);
	});
});

describe('GET /api/auth/me', () => {
	it('returns the current user', async () => {
		await register();
		const loginResponse = await login();

		const response = await request(app)
			.get('/api/auth/me')
			.set('Authorization', `Bearer ${loginResponse.body.accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body).toMatchObject({
			email: credentials().email,
			role: 'viewer',
		});
	});

	it('returns 401 without a token', async () => {
		const response = await request(app).get('/api/auth/me');

		expect(response.status).toBe(401);
	});
});

describe('auth rate limiting', () => {
	it('returns 429 after too many login attempts from the same client', async () => {
		await register();

		let last: Awaited<ReturnType<typeof login>> | undefined;
		for (let i = 0; i < RATE_LIMIT_PROBE_ATTEMPTS; i++) {
			last = await login({ password: 'WrongPassword1!' });
			if (last.status === 429) break;
		}

		expect(last?.status).toBe(429);
	});

	it('returns 429 after too many register attempts from the same client', async () => {
		let last: Awaited<ReturnType<typeof register>> | undefined;
		for (let i = 0; i < RATE_LIMIT_PROBE_ATTEMPTS; i++) {
			last = await register({ email: `flood-${i}@tech-service.local` });
			if (last.status === 429) break;
		}

		expect(last?.status).toBe(429);
	});
});
