'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, _Sequelize) {
		const lookups = require('./fixtures/lookups');

		await queryInterface.bulkInsert(
			'equipment_status_lookup',
			lookups.equipmentStatus.map((code) => ({ code })),
		);
		await queryInterface.bulkInsert(
			'equipment_type_lookup',
			lookups.equipmentType.map((code) => ({ code })),
		);
		await queryInterface.bulkInsert(
			'request_status_lookup',
			lookups.requestStatus,
		);
		await queryInterface.bulkInsert(
			'request_priority_lookup',
			lookups.requestPriority.map((code) => ({ code })),
		);
		await queryInterface.bulkInsert(
			'assignee_role_lookup',
			lookups.assigneeRole.map((code) => ({ code })),
		);
	},

	async down(queryInterface, _Sequelize) {
		await queryInterface.bulkDelete('equipment_status_lookup', null, {});
		await queryInterface.bulkDelete('equipment_type_lookup', null, {});
		await queryInterface.bulkDelete('request_status_lookup', null, {});
		await queryInterface.bulkDelete('request_priority_lookup', null, {});
		await queryInterface.bulkDelete('assignee_role_lookup', null, {});
	},
};
