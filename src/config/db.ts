import { Sequelize } from "sequelize";
import * as z from "zod";
import { logger } from "./logger.ts";

const postgresEnvSchema = z.object({
    POSTGRES_HOST: z.string().default('localhost'),
    POSTGRES_PORT: z.coerce.number().int().positive().default(5432),
    POSTGRES_USER: z.string().min(1),
    POSTGRES_PASSWORD: z.string().min(1),
    POSTGRES_DB: z.string().min(1),
});

const env = postgresEnvSchema.parse(process.env);

export const sequelize = new Sequelize({
    dialect: 'postgres',
    host: env.POSTGRES_HOST,
    username: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    port: env.POSTGRES_PORT,
    pool: {max:10, min: 2, acquire: 30000, idle: 10000},
    database: env.POSTGRES_DB,
    logging: (sql) => logger.debug(sql)
})
