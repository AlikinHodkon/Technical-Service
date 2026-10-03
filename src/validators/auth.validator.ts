import * as z from 'zod';

export const registerSchema = z.object({
	email: z.email(),
	password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
	email: z.email(),
	password: z.string().min(1),
});

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
