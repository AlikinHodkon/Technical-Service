'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('request_priority_lookup', {
			code: {
				type: Sequelize.TEXT,
				primaryKey: true,
			},
		});
	},

	async down(queryInterface, _Sequelize) {
		await queryInterface.dropTable('request_priority_lookup');
	},
};
