import { randomUUID } from 'node:crypto';
import { signAccessToken } from '../config/jwt.ts';

type Role = 'viewer' | 'technician' | 'admin';

export const makeToken = (
	role: Role,
	overrides: { userId?: string; technicianId?: string | null } = {},
) =>
	signAccessToken({
		userId: overrides.userId ?? randomUUID(),
		role,
		technicianId: overrides.technicianId ?? null,
	});

export const bearer = (token: string) => `Bearer ${token}`;
