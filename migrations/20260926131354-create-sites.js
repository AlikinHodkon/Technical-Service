'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('sites', {
			id: {
				type: Sequelize.UUID,
				primaryKey: true,
				defaultValue: Sequelize.literal('gen_random_uuid()'),
			},
			name: {
				type: Sequelize.TEXT,
				allowNull: false,
			},
			code: {
				type: Sequelize.TEXT,
				allowNull: false,
				unique: true,
			},
			region: {
				type: Sequelize.TEXT,
			},
			coordinates: {
				type: Sequelize.JSONB,
			},
		});
	},

	async down(queryInterface, _Sequelize) {
		await queryInterface.dropTable('sites');
	},
};
