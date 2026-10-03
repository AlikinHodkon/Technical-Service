'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, _Sequelize) {
		const { users } = require('./fixtures/users');

		await queryInterface.bulkInsert(
			'users',
			users.map((u) => ({
				...u,
				created_at: new Date(),
				updated_at: new Date(),
			})),
		);
	},

	async down(queryInterface, _Sequelize) {
		await queryInterface.bulkDelete('users', null, {});
	},
};
