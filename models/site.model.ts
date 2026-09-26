import {
	AllowNull,
	Column,
	DataType,
	Default,
	HasMany,
	Model,
	PrimaryKey,
	Table,
	Unique,
} from 'sequelize-typescript';
import { Equipment } from './equipment.model.ts';

@Table({ tableName: 'sites', timestamps: false })
export class Site extends Model {
	@PrimaryKey
	@Default(DataType.UUIDV4)
	@Column(DataType.UUID)
	declare id: string;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare name: string;

	@AllowNull(false)
	@Unique
	@Column(DataType.TEXT)
	declare code: string;

	@Column(DataType.TEXT)
	declare region: string | null;

	@Column(DataType.JSONB)
	declare coordinates: object | null;

	@HasMany(() => Equipment)
	declare equipment: Equipment[];
}
