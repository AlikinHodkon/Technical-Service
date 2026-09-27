import {
	AllowNull,
	BelongsTo,
	Column,
	DataType,
	Default,
	ForeignKey,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';
import { MaintenanceRequest } from './maintenance-request.model.ts';
import { RequestStatusLookup } from './request-status-lookup.model.ts';

@Table({
	tableName: 'request_status_history',
	timestamps: false,
	underscored: true,
})
export class RequestStatusHistory extends Model {
	@PrimaryKey
	@Default(DataType.UUIDV4)
	@Column(DataType.UUID)
	declare id: string;

	@ForeignKey(() => MaintenanceRequest)
	@AllowNull(false)
	@Column(DataType.UUID)
	declare requestId: string;

	@BelongsTo(() => MaintenanceRequest)
	declare request: MaintenanceRequest;

	@ForeignKey(() => RequestStatusLookup)
	@Column(DataType.TEXT)
	declare oldStatusCode: string | null;

	@ForeignKey(() => RequestStatusLookup)
	@AllowNull(false)
	@Column(DataType.TEXT)
	declare newStatusCode: string;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare author: string;

	@Column(DataType.TEXT)
	declare comment: string | null;

	@AllowNull(false)
	@Column(DataType.DATE)
	declare changedAt: Date;
}
