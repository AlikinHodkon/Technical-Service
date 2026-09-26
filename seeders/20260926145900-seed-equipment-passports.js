'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, _Sequelize) {
		const equipment = require('./fixtures/equipment');

		const passports = equipment.reduce((acc, item) => {
			if (item.passport) {
				acc.push({ equipment_id: item.id, ...item.passport });
			}
			return acc;
		}, []);

		await queryInterface.bulkInsert('equipment_passports', passports);
	},

	async down(queryInterface, _Sequelize) {
		await queryInterface.bulkDelete('equipment_passports', null, {});
	},
};
