'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('request_assignees', {
			request_id: {
				type: Sequelize.UUID,
				primaryKey: true,
				references: {
					model: 'maintenance_requests',
					key: 'id',
				},
				onDelete: 'CASCADE',
			},
			technician_id: {
				type: Sequelize.UUID,
				primaryKey: true,
				references: {
					model: 'technicians',
					key: 'id',
				},
				onDelete: 'RESTRICT',
			},
			role_code: {
				type: Sequelize.TEXT,
				allowNull: false,
				references: {
					model: 'assignee_role_lookup',
					key: 'code',
				},
				onDelete: 'NO ACTION',
			},
			hours: {
				type: Sequelize.INTEGER,
			},
		});
	},

	async down(queryInterface, _Sequelize) {
		await queryInterface.dropTable('request_assignees');
	},
};
