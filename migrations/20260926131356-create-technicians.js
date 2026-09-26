'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('technicians', {
			id: {
				type: Sequelize.UUID,
				primaryKey: true,
				defaultValue: Sequelize.literal('gen_random_uuid()'),
			},
			full_name: {
				type: Sequelize.TEXT,
				allowNull: false,
			},
			specialization: {
				type: Sequelize.TEXT,
			},
			employee_number: {
				type: Sequelize.TEXT,
				allowNull: false,
				unique: true,
			},
		});
	},

	async down(queryInterface, _Sequelize) {
		await queryInterface.dropTable('technicians');
	},
};
