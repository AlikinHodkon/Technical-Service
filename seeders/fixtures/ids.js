'use strict';

function uuid(tag, n) {
	return `${tag}-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;
}

const TAG = {
	site: '00000001',
	technician: '00000002',
	equipment: '00000003',
	request: '00000004',
	history: '00000005',
};

module.exports = { uuid, TAG };
