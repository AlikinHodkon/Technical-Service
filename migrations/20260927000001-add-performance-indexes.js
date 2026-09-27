'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, _Sequelize) {
		// GET /requests?status=... — фильтрация по статусу в списочном эндпоинте
		await queryInterface.addIndex('maintenance_requests', ['status_code'], {
			name: 'idx_maintenance_requests_status_code',
		});

		// GET /equipment/:id/requests, JOIN в отчёте и сводке площадки
		await queryInterface.addIndex('maintenance_requests', ['equipment_id'], {
			name: 'idx_maintenance_requests_equipment_id',
		});

		// Сортировка по умолчанию (created_at DESC) и фильтры dateFrom/dateTo в отчёте
		await queryInterface.addIndex('maintenance_requests', ['created_at'], {
			name: 'idx_maintenance_requests_created_at',
		});

		// GET /requests/:id/history — выборка истории по заявке
		await queryInterface.addIndex('request_status_history', ['request_id'], {
			name: 'idx_request_status_history_request_id',
		});

		// JOIN при проверке существования специалистов в транзакции назначения бригады
		await queryInterface.addIndex('request_assignees', ['technician_id'], {
			name: 'idx_request_assignees_technician_id',
		});
	},

	async down(queryInterface, _Sequelize) {
		await queryInterface.removeIndex(
			'maintenance_requests',
			'idx_maintenance_requests_status_code',
		);
		await queryInterface.removeIndex(
			'maintenance_requests',
			'idx_maintenance_requests_equipment_id',
		);
		await queryInterface.removeIndex(
			'maintenance_requests',
			'idx_maintenance_requests_created_at',
		);
		await queryInterface.removeIndex(
			'request_status_history',
			'idx_request_status_history_request_id',
		);
		await queryInterface.removeIndex(
			'request_assignees',
			'idx_request_assignees_technician_id',
		);
	},
};
