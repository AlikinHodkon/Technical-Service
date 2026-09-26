import {
	AllowNull,
	Column,
	DataType,
	Default,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';

@Table({ tableName: 'request_status_lookup', timestamps: false })
export class RequestStatusLookup extends Model {
	@PrimaryKey
	@Column(DataType.TEXT)
	declare code: string;

	@AllowNull(false)
	@Default(false)
	@Column(DataType.BOOLEAN)
	declare is_terminal: boolean;
}
