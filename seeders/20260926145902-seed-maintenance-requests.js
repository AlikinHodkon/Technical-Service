'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, _Sequelize) {
		const requests = require('./fixtures/requests');

		await queryInterface.bulkInsert(
			'maintenance_requests',
			requests.map((r) => ({
				id: r.id,
				equipment_id: r.equipment_id,
				title: r.title,
				description: r.description,
				priority_code: r.priority_code,
				status_code: r.status_code,
				planned_at: r.planned_at,
				author: r.author,
				created_at: r.created_at,
				updated_at: r.updated_at,
			})),
		);
	},

	async down(queryInterface, _Sequelize) {
		await queryInterface.bulkDelete('maintenance_requests', null, {});
	},
};
