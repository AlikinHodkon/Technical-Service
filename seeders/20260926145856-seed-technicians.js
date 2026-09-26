'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, _Sequelize) {
		const technicians = require('./fixtures/technicians');

		await queryInterface.bulkInsert('technicians', technicians);
	},

	async down(queryInterface, _Sequelize) {
		await queryInterface.bulkDelete('technicians', null, {});
	},
};
