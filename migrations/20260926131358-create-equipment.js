'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('equipment', {
			id: {
				type: Sequelize.UUID,
				primaryKey: true,
				defaultValue: Sequelize.literal('gen_random_uuid()'),
			},
			site_id: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: 'sites',
					key: 'id',
				},
				onDelete: 'RESTRICT',
			},
			name: {
				type: Sequelize.TEXT,
				allowNull: false,
			},
			type_code: {
				type: Sequelize.TEXT,
				allowNull: false,
				references: {
					model: 'equipment_type_lookup',
					key: 'code',
				},
				onDelete: 'NO ACTION',
			},
			serial_number: {
				type: Sequelize.TEXT,
				allowNull: false,
				unique: true,
			},
			status_code: {
				type: Sequelize.TEXT,
				allowNull: false,
				references: {
					model: 'equipment_status_lookup',
					key: 'code',
				},
				onDelete: 'NO ACTION',
			},
			installed_at: {
				type: Sequelize.DATEONLY,
			},
		});
	},

	async down(queryInterface, _Sequelize) {
		await queryInterface.dropTable('equipment');
	},
};
