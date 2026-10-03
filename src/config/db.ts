import 'reflect-metadata';
import { Sequelize } from 'sequelize-typescript';
import * as z from 'zod';
import { AssigneeRoleLookup } from '../../models/assignee-role-lookup.model.ts';
import { Equipment } from '../../models/equipment.model.ts';
import { EquipmentPassport } from '../../models/equipment-passport.model.ts';
import { EquipmentStatusLookup } from '../../models/equipment-status-lookup.model.ts';
import { EquipmentTypeLookup } from '../../models/equipment-type-lookup.model.ts';
import { MaintenanceRequest } from '../../models/maintenance-request.model.ts';
import { RequestAssignee } from '../../models/request-assignee.model.ts';
import { RequestPriorityLookup } from '../../models/request-priority-lookup.model.ts';
import { RequestStatusHistory } from '../../models/request-status-history.model.ts';
import { RequestStatusLookup } from '../../models/request-status-lookup.model.ts';
import { Site } from '../../models/site.model.ts';
import { Technician } from '../../models/technician.model.ts';
import { User } from '../../models/user.model.ts';
import { UserRoleLookup } from '../../models/user-role-lookup.model.ts';
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
	models: [
		Site,
		Equipment,
		EquipmentPassport,
		MaintenanceRequest,
		Technician,
		RequestAssignee,
		RequestStatusHistory,
		EquipmentStatusLookup,
		EquipmentTypeLookup,
		RequestPriorityLookup,
		RequestStatusLookup,
		AssigneeRoleLookup,
		User,
		UserRoleLookup,
	],
});
