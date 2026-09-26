import {
	AllowNull,
	BelongsTo,
	BelongsToMany,
	Column,
	DataType,
	Default,
	ForeignKey,
	HasMany,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';
import { Equipment } from './equipment.model.ts';
import { RequestAssignee } from './request-assignee.model.ts';
import { RequestPriorityLookup } from './request-priority-lookup.model.ts';
import { RequestStatusHistory } from './request-status-history.model.ts';
import { RequestStatusLookup } from './request-status-lookup.model.ts';
import { Technician } from './technician.model.ts';

@Table({ tableName: 'maintenance_requests', timestamps: false })
export class MaintenanceRequest extends Model {
	@PrimaryKey
	@Default(DataType.UUIDV4)
	@Column(DataType.UUID)
	declare id: string;

	@ForeignKey(() => Equipment)
	@AllowNull(false)
	@Column(DataType.UUID)
	declare equipment_id: string;

	@BelongsTo(() => Equipment)
	declare equipment: Equipment;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare title: string;

	@Column(DataType.TEXT)
	declare description: string | null;

	@ForeignKey(() => RequestPriorityLookup)
	@AllowNull(false)
	@Column(DataType.TEXT)
	declare priority_code: string;

	@BelongsTo(() => RequestPriorityLookup)
	declare priority: RequestPriorityLookup;

	@ForeignKey(() => RequestStatusLookup)
	@AllowNull(false)
	@Default('new')
	@Column(DataType.TEXT)
	declare status_code: string;

	@BelongsTo(() => RequestStatusLookup)
	declare status: RequestStatusLookup;

	@Column(DataType.DATE)
	declare planned_at: Date | null;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare author: string;

	@AllowNull(false)
	@Column(DataType.DATE)
	declare created_at: Date;

	@AllowNull(false)
	@Column(DataType.DATE)
	declare updated_at: Date;

	@HasMany(() => RequestStatusHistory)
	declare statusHistory: RequestStatusHistory[];

	@BelongsToMany(
		() => Technician,
		() => RequestAssignee,
	)
	declare technicians: Technician[];
}
