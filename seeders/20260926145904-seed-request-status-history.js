'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, _Sequelize) {
		const requests = require('./fixtures/requests');
		const { uuid, TAG } = require('./fixtures/ids');

		let n = 0;
		const history = requests.flatMap((r) =>
			r.history.map((h) => {
				n += 1;
				return {
					id: uuid(TAG.history, n),
					request_id: r.id,
					old_status_code: h.old_status_code,
					new_status_code: h.new_status_code,
					author: h.author,
					comment: h.comment,
					changed_at: h.changed_at,
				};
			}),
		);

		await queryInterface.bulkInsert('request_status_history', history);
	},

	async down(queryInterface, _Sequelize) {
		await queryInterface.bulkDelete('request_status_history', null, {});
	},
};
