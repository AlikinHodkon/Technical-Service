'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('user_role_lookup', {
			code: {
				type: Sequelize.TEXT,
				primaryKey: true,
			},
		});
	},

	async down(queryInterface, _Sequelize) {
		await queryInterface.dropTable('user_role_lookup');
	},
};
