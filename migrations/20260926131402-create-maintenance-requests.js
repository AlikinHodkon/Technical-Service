'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('maintenance_requests', {
			id: {
				type: Sequelize.UUID,
				primaryKey: true,
				defaultValue: Sequelize.literal('gen_random_uuid()'),
			},
			equipment_id: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: 'equipment',
					key: 'id',
				},
				onDelete: 'RESTRICT',
			},
			title: {
				type: Sequelize.TEXT,
				allowNull: false,
			},
			description: {
				type: Sequelize.TEXT,
			},
			priority_code: {
				type: Sequelize.TEXT,
				allowNull: false,
				references: {
					model: 'request_priority_lookup',
					key: 'code',
				},
				onDelete: 'NO ACTION',
			},
			status_code: {
				type: Sequelize.TEXT,
				allowNull: false,
				defaultValue: 'new',
				references: {
					model: 'request_status_lookup',
					key: 'code',
				},
				onDelete: 'NO ACTION',
			},
			planned_at: {
				type: Sequelize.DATE,
			},
			author: {
				type: Sequelize.TEXT,
				allowNull: false,
			},
			created_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			updated_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
		});
	},

	async down(queryInterface, _Sequelize) {
		await queryInterface.dropTable('maintenance_requests');
	},
};
