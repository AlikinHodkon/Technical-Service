'use strict';

module.exports = {
	equipmentStatus: ['operational', 'maintenance', 'fault', 'decommissioned'],
	equipmentType: ['turbine', 'inverter', 'sensor', 'substation'],
	requestStatus: [
		{ code: 'new', is_terminal: false },
		{ code: 'in_progress', is_terminal: false },
		{ code: 'done', is_terminal: true },
		{ code: 'rejected', is_terminal: true },
	],
	requestPriority: ['low', 'medium', 'high', 'critical'],
	assigneeRole: ['lead', 'member'],
};
