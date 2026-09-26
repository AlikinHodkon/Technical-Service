import {
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';

@Table({ tableName: 'request_priority_lookup', timestamps: false })
export class RequestPriorityLookup extends Model {
	@PrimaryKey
	@Column(DataType.TEXT)
	declare code: string;
}
