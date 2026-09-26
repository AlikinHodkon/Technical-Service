'use strict';

const { uuid, TAG } = require('./ids');

module.exports = [
	{
		id: uuid(TAG.site, 1),
		name: 'Северная ВЭС',
		code: 'NORTH-WF',
		region: 'Мурманская область',
		coordinates: { lat: 68.9585, lon: 33.0827 },
	},
	{
		id: uuid(TAG.site, 2),
		name: 'Южная СЭС',
		code: 'SOUTH-SF',
		region: 'Краснодарский край',
		coordinates: { lat: 45.0355, lon: 38.9753 },
	},
	{
		id: uuid(TAG.site, 3),
		name: 'Восточная подстанция',
		code: 'EAST-SS',
		region: 'Приморский край',
		coordinates: { lat: 43.1155, lon: 131.9 },
	},
];
