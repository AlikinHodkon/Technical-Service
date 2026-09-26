'use strict';

function required(name) {
	const value = process.env[name];
	if (!value) {
		throw new Error(`${name} must be set (see .env.example) to run migrations`);
	}
	return value;
}

const connection = {
	dialect: 'postgres',
	host: process.env.POSTGRES_HOST || 'localhost',
	port: Number(process.env.POSTGRES_PORT) || 5432,
	username: required('POSTGRES_USER'),
	password: required('POSTGRES_PASSWORD'),
	database: required('POSTGRES_DB'),
};

module.exports = {
	development: connection,
	test: connection,
	production: connection,
};
