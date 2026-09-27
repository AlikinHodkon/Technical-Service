import {
	BelongsTo,
	Column,
	DataType,
	ForeignKey,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';
import { Equipment } from './equipment.model.ts';

@Table({
	tableName: 'equipment_passports',
	timestamps: false,
	underscored: true,
})
export class EquipmentPassport extends Model {
	@PrimaryKey
	@ForeignKey(() => Equipment)
	@Column(DataType.UUID)
	declare equipmentId: string;

	@BelongsTo(() => Equipment)
	declare equipment: Equipment;

	@Column(DataType.TEXT)
	declare manufacturer: string | null;

	@Column(DataType.TEXT)
	declare model: string | null;

	@Column(DataType.DECIMAL)
	declare ratedPower: number | null;

	@Column(DataType.DATEONLY)
	declare lastInspectionAt: string | null;
}
