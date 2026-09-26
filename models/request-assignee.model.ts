import {
	AllowNull,
	BelongsTo,
	Column,
	DataType,
	ForeignKey,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';
import { AssigneeRoleLookup } from './assignee-role-lookup.model.ts';
import { MaintenanceRequest } from './maintenance-request.model.ts';
import { Technician } from './technician.model.ts';

@Table({ tableName: 'request_assignees', timestamps: false })
export class RequestAssignee extends Model {
	@PrimaryKey
	@ForeignKey(() => MaintenanceRequest)
	@Column(DataType.UUID)
	declare request_id: string;

	@BelongsTo(() => MaintenanceRequest)
	declare request: MaintenanceRequest;

	@PrimaryKey
	@ForeignKey(() => Technician)
	@Column(DataType.UUID)
	declare technician_id: string;

	@BelongsTo(() => Technician)
	declare technician: Technician;

	@ForeignKey(() => AssigneeRoleLookup)
	@AllowNull(false)
	@Column(DataType.TEXT)
	declare role_code: string;

	@BelongsTo(() => AssigneeRoleLookup)
	declare role: AssigneeRoleLookup;

	@Column(DataType.INTEGER)
	declare hours: number | null;
}
