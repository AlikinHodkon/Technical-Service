import {
	AllowNull,
	BelongsTo,
	Column,
	DataType,
	Default,
	ForeignKey,
	HasMany,
	HasOne,
	Model,
	PrimaryKey,
	Table,
	Unique,
} from 'sequelize-typescript';
import { EquipmentPassport } from './equipment-passport.model.ts';
import { EquipmentStatusLookup } from './equipment-status-lookup.model.ts';
import { EquipmentTypeLookup } from './equipment-type-lookup.model.ts';
import { MaintenanceRequest } from './maintenance-request.model.ts';
import { Site } from './site.model.ts';

@Table({ tableName: 'equipment', timestamps: false })
export class Equipment extends Model {
	@PrimaryKey
	@Default(DataType.UUIDV4)
	@Column(DataType.UUID)
	declare id: string;

	@ForeignKey(() => Site)
	@AllowNull(false)
	@Column(DataType.UUID)
	declare site_id: string;

	@BelongsTo(() => Site)
	declare site: Site;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare name: string;

	@ForeignKey(() => EquipmentTypeLookup)
	@AllowNull(false)
	@Column(DataType.TEXT)
	declare type_code: string;

	@BelongsTo(() => EquipmentTypeLookup)
	declare type: EquipmentTypeLookup;

	@AllowNull(false)
	@Unique
	@Column(DataType.TEXT)
	declare serial_number: string;

	@ForeignKey(() => EquipmentStatusLookup)
	@AllowNull(false)
	@Column(DataType.TEXT)
	declare status_code: string;

	@BelongsTo(() => EquipmentStatusLookup)
	declare status: EquipmentStatusLookup;

	@Column(DataType.DATEONLY)
	declare installed_at: string | null;

	@HasOne(() => EquipmentPassport)
	declare passport: EquipmentPassport;

	@HasMany(() => MaintenanceRequest)
	declare requests: MaintenanceRequest[];
}
