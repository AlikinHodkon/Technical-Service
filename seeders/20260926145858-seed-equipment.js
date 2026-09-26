'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, _Sequelize) {
		const equipment = require('./fixtures/equipment');

		await queryInterface.bulkInsert(
			'equipment',
			equipment.map((item) => ({
				id: item.id,
				site_id: item.site_id,
				name: item.name,
				type_code: item.type,
				serial_number: item.serial_number,
				status_code: item.status,
				installed_at: item.installed_at,
			})),
		);
	},

	async down(queryInterface, _Sequelize) {
		await queryInterface.bulkDelete('equipment', null, {});
	},
};
