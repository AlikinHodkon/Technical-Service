'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('request_status_history', {
			id: {
				type: Sequelize.UUID,
				primaryKey: true,
				defaultValue: Sequelize.literal('gen_random_uuid()'),
			},
			request_id: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: 'maintenance_requests',
					key: 'id',
				},
				onDelete: 'CASCADE',
			},
			old_status_code: {
				type: Sequelize.TEXT,
				allowNull: true,
				references: {
					model: 'request_status_lookup',
					key: 'code',
				},
				onDelete: 'NO ACTION',
			},
			new_status_code: {
				type: Sequelize.TEXT,
				allowNull: false,
				references: {
					model: 'request_status_lookup',
					key: 'code',
				},
				onDelete: 'NO ACTION',
			},
			author: {
				type: Sequelize.TEXT,
				allowNull: false,
			},
			comment: {
				type: Sequelize.TEXT,
			},
			changed_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
		});
	},

	async down(queryInterface, _Sequelize) {
		await queryInterface.dropTable('request_status_history');
	},
};
