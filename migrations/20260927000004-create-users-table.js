'use strict';

function getAppRoleName() {
	const roleName = process.env.APP_DB_USER;
	if (!roleName || !/^[a-z_][a-z0-9_]*$/.test(roleName)) {
		throw new Error(
			'APP_DB_USER must be set to a valid lowercase Postgres role name (e.g. app_user)',
		);
	}
	return roleName;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('users', {
			id: {
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
				primaryKey: true,
			},
			email: {
				type: Sequelize.TEXT,
				allowNull: false,
				unique: true,
			},
			password_hash: {
				type: Sequelize.TEXT,
				allowNull: false,
			},
			role_code: {
				type: Sequelize.TEXT,
				allowNull: false,
				defaultValue: 'viewer',
				references: {
					model: 'user_role_lookup',
					key: 'code',
				},
				onDelete: 'NO ACTION',
			},
			technician_id: {
				type: Sequelize.UUID,
				references: {
					model: 'technicians',
					key: 'id',
				},
				onDelete: 'SET NULL',
			},
			token_version: {
				type: Sequelize.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
			created_at: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updated_at: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		const roleName = getAppRoleName();
		await queryInterface.sequelize.query(
			`GRANT SELECT, INSERT, UPDATE, DELETE ON users TO ${roleName};`,
		);
		await queryInterface.sequelize.query(
			`GRANT SELECT ON user_role_lookup TO ${roleName};`,
		);
	},

	async down(queryInterface, _Sequelize) {
		await queryInterface.dropTable('users');
	},
};
