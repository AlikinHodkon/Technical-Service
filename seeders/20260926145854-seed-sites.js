'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, _Sequelize) {
		const sites = require('./fixtures/sites');

		await queryInterface.bulkInsert(
			'sites',
			sites.map((site) => ({
				...site,
				coordinates: JSON.stringify(site.coordinates),
			})),
		);
	},

	async down(queryInterface, _Sequelize) {
		await queryInterface.bulkDelete('sites', null, {});
	},
};
