'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('request_status_lookup', {
			code: {
				type: Sequelize.TEXT,
				primaryKey: true,
			},
			is_terminal: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
		});
	},

	async down(queryInterface, _Sequelize) {
		await queryInterface.dropTable('request_status_lookup');
	},
};
