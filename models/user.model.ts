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
	Unique,
} from 'sequelize-typescript';
import { Technician } from './technician.model.ts';
import { UserRoleLookup } from './user-role-lookup.model.ts';

@Table({ tableName: 'users', timestamps: false, underscored: true })
export class User extends Model {
	@PrimaryKey
	@Default(DataType.UUIDV4)
	@Column(DataType.UUID)
	declare id: string;

	@AllowNull(false)
	@Unique
	@Column(DataType.TEXT)
	declare email: string;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare passwordHash: string;

	@ForeignKey(() => UserRoleLookup)
	@AllowNull(false)
	@Default('viewer')
	@Column(DataType.TEXT)
	declare roleCode: string;

	@BelongsTo(() => UserRoleLookup)
	declare role: UserRoleLookup;

	@ForeignKey(() => Technician)
	@Column(DataType.UUID)
	declare technicianId: string | null;

	@BelongsTo(() => Technician)
	declare technician: Technician;

	@AllowNull(false)
	@Default(0)
	@Column(DataType.INTEGER)
	declare tokenVersion: number;

	@AllowNull(false)
	@Column(DataType.DATE)
	declare createdAt: Date;

	@AllowNull(false)
	@Column(DataType.DATE)
	declare updatedAt: Date;
}
