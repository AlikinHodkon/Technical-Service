'use strict';

function getRoleName() {
	const roleName = process.env.APP_DB_USER;
	if (!roleName || !/^[a-z_][a-z0-9_]*$/.test(roleName)) {
		throw new Error(
			'APP_DB_USER must be set to a valid lowercase Postgres role name (e.g. app_user)',
		);
	}
	return roleName;
}

function getRolePassword() {
	const password = process.env.APP_DB_PASSWORD;
	if (!password) {
		throw new Error(
			'APP_DB_PASSWORD must be set to create/manage the application role',
		);
	}
	return password;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, _Sequelize) {
		const roleName = getRoleName();
		const rolePassword = getRolePassword();
		const databaseName = queryInterface.quoteIdentifier(
			queryInterface.sequelize.getDatabaseName(),
		);

		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.sequelize.query(
				`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${roleName}') THEN
            CREATE ROLE ${roleName} WITH LOGIN;
          END IF;
        END
        $$;
      `,
				{ transaction },
			);

			await queryInterface.sequelize.query(
				`ALTER ROLE ${roleName} WITH PASSWORD :password;`,
				{ replacements: { password: rolePassword }, transaction },
			);

			await queryInterface.sequelize.query(
				`GRANT CONNECT ON DATABASE ${databaseName} TO ${roleName};`,
				{ transaction },
			);
			await queryInterface.sequelize.query(
				`GRANT USAGE ON SCHEMA public TO ${roleName};`,
				{ transaction },
			);
			await queryInterface.sequelize.query(
				`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${roleName};`,
				{ transaction },
			);

			await queryInterface.sequelize.query(
				`REVOKE ALL PRIVILEGES ON "SequelizeMeta" FROM ${roleName};`,
				{ transaction },
			);
			await queryInterface.sequelize.query(
				`
        REVOKE INSERT, UPDATE, DELETE ON
          equipment_status_lookup,
          equipment_type_lookup,
          request_status_lookup,
          request_priority_lookup,
          assignee_role_lookup
        FROM ${roleName};
      `,
				{ transaction },
			);
			await queryInterface.sequelize.query(
				`REVOKE UPDATE, DELETE ON request_status_history FROM ${roleName};`,
				{ transaction },
			);
		});
	},

	async down(queryInterface, _Sequelize) {
		const roleName = getRoleName();
		const databaseName = queryInterface.quoteIdentifier(
			queryInterface.sequelize.getDatabaseName(),
		);

		await queryInterface.sequelize.transaction(async (transaction) => {
			await queryInterface.sequelize.query(
				`REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM ${roleName};`,
				{ transaction },
			);
			await queryInterface.sequelize.query(
				`REVOKE USAGE ON SCHEMA public FROM ${roleName};`,
				{ transaction },
			);
			await queryInterface.sequelize.query(
				`REVOKE CONNECT ON DATABASE ${databaseName} FROM ${roleName};`,
				{ transaction },
			);
			await queryInterface.sequelize.query(`DROP ROLE IF EXISTS ${roleName};`, {
				transaction,
			});
		});
	},
};
