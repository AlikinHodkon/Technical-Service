'use strict';

const bcrypt = require('bcrypt');
const { uuid, TAG } = require('./ids');

const DEMO_PASSWORD = 'Demo12345!';
const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10);

module.exports = {
	password: DEMO_PASSWORD,
	users: [
		{
			id: uuid(TAG.user, 1),
			email: 'admin@tech-service.local',
			password_hash: passwordHash,
			role_code: 'admin',
			technician_id: null,
		},
		{
			id: uuid(TAG.user, 2),
			email: 'technician@tech-service.local',
			password_hash: passwordHash,
			role_code: 'technician',
			technician_id: uuid(TAG.technician, 1),
		},
		{
			id: uuid(TAG.user, 3),
			email: 'viewer@tech-service.local',
			password_hash: passwordHash,
			role_code: 'viewer',
			technician_id: null,
		},
	],
};
