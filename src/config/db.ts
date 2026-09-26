import { Sequelize } from 'sequelize';
import * as z from 'zod';
import { logger } from './logger.ts';

const postgresEnvSchema = z.object({
	POSTGRES_HOST: z.string().default('localhost'),
	POSTGRES_PORT: z.coerce.number().int().positive().default(5432),
	POSTGRES_DB: z.string().min(1),
	APP_DB_USER: z.string().min(1),
	APP_DB_PASSWORD: z.string().min(1),
});

const env = postgresEnvSchema.parse(process.env);

// Рантайм коннектится ограниченной ролью app_user (см. миграцию
// create-app-role-and-grants), а не POSTGRES_USER — тот остаётся владельцем
// схемы и используется только для миграций (config/config.json).
export const sequelize = new Sequelize({
	dialect: 'postgres',
	host: env.POSTGRES_HOST,
	username: env.APP_DB_USER,
	password: env.APP_DB_PASSWORD,
	port: env.POSTGRES_PORT,
	pool: { max: 10, min: 2, acquire: 30000, idle: 10000 },
	database: env.POSTGRES_DB,
	logging: (sql) => logger.debug(sql),
});
