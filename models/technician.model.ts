import {
	AllowNull,
	BelongsToMany,
	Column,
	DataType,
	Default,
	Model,
	PrimaryKey,
	Table,
	Unique,
} from 'sequelize-typescript';
import { MaintenanceRequest } from './maintenance-request.model.ts';
import { RequestAssignee } from './request-assignee.model.ts';

@Table({ tableName: 'technicians', timestamps: false, underscored: true })
export class Technician extends Model {
	@PrimaryKey
	@Default(DataType.UUIDV4)
	@Column(DataType.UUID)
	declare id: string;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare fullName: string;

	@Column(DataType.TEXT)
	declare specialization: string | null;

	@AllowNull(false)
	@Unique
	@Column(DataType.TEXT)
	declare employeeNumber: string;

	@BelongsToMany(
		() => MaintenanceRequest,
		() => RequestAssignee,
	)
	declare requests: MaintenanceRequest[];
}
