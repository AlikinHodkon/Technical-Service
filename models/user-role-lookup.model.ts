import {
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';

@Table({ tableName: 'user_role_lookup', timestamps: false, underscored: true })
export class UserRoleLookup extends Model {
	@PrimaryKey
	@Column(DataType.TEXT)
	declare code: string;
}
