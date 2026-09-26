'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, _Sequelize) {
		const requests = require('./fixtures/requests');

		const assignees = requests.flatMap((r) =>
			r.assignees.map((a) => ({
				request_id: r.id,
				technician_id: a.technician_id,
				role_code: a.role_code,
				hours: a.hours,
			})),
		);

		await queryInterface.bulkInsert('request_assignees', assignees);
	},

	async down(queryInterface, _Sequelize) {
		await queryInterface.bulkDelete('request_assignees', null, {});
	},
};
