import { User } from '../../models/user.model.ts';

export const usersFindByEmail = (email: string) =>
	User.findOne({ where: { email } });

export const usersFindById = (id: string) => User.findByPk(id);

export const usersCreate = (data: { email: string; passwordHash: string }) => {
	const now = new Date();
	return User.create({
		...data,
		roleCode: 'viewer',
		createdAt: now,
		updatedAt: now,
	});
};

export const usersIncrementTokenVersion = (id: string) =>
	User.increment('tokenVersion', { where: { id } });
