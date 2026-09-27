import {
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';

@Table({
	tableName: 'equipment_type_lookup',
	timestamps: false,
	underscored: true,
})
export class EquipmentTypeLookup extends Model {
	@PrimaryKey
	@Column(DataType.TEXT)
	declare code: string;
}
