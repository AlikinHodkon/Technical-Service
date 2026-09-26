import {
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';

@Table({ tableName: 'equipment_status_lookup', timestamps: false })
export class EquipmentStatusLookup extends Model {
	@PrimaryKey
	@Column(DataType.TEXT)
	declare code: string;
}
