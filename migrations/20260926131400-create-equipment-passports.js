'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('equipment_passports', {
			equipment_id: {
				type: Sequelize.UUID,
				primaryKey: true,
				references: {
					model: 'equipment',
					key: 'id',
				},
				onDelete: 'CASCADE',
			},
			manufacturer: {
				type: Sequelize.TEXT,
			},
			model: {
				type: Sequelize.TEXT,
			},
			rated_power: {
				type: Sequelize.DECIMAL,
			},
			last_inspection_at: {
				type: Sequelize.DATEONLY,
			},
		});
	},

	async down(queryInterface, _Sequelize) {
		await queryInterface.dropTable('equipment_passports');
	},
};
