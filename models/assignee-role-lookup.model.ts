import {
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';

@Table({ tableName: 'assignee_role_lookup', timestamps: false })
export class AssigneeRoleLookup extends Model {
	@PrimaryKey
	@Column(DataType.TEXT)
	declare code: string;
}
