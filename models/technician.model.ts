import {
	AllowNull,
	BelongsToMany,
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
	Unique,
} from 'sequelize-typescript';
import { MaintenanceRequest } from './maintenance-request.model.ts';
import { RequestAssignee } from './request-assignee.model.ts';

@Table({ tableName: 'technicians', timestamps: false })
export class Technician extends Model {
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: string;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare full_name: string;

	@Column(DataType.TEXT)
	declare specialization: string | null;

	@AllowNull(false)
	@Unique
	@Column(DataType.TEXT)
	declare employee_number: string;

	@BelongsToMany(
		() => MaintenanceRequest,
		() => RequestAssignee,
	)
	declare requests: MaintenanceRequest[];
}
