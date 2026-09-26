'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('equipment_status_lookup', {
			code: {
				type: Sequelize.TEXT,
				primaryKey: true,
			},
		});
	},

	async down(queryInterface, _Sequelize) {
		await queryInterface.dropTable('equipment_status_lookup');
	},
};
