'use strict';

const { uuid, TAG } = require('./ids');

module.exports = [
	{
		id: uuid(TAG.technician, 1),
		full_name: 'Иванов Пётр Сергеевич',
		specialization: 'Электромонтёр',
		employee_number: 'EMP-001',
	},
	{
		id: uuid(TAG.technician, 2),
		full_name: 'Смирнова Анна Викторовна',
		specialization: 'Инженер по КИПиА',
		employee_number: 'EMP-002',
	},
	{
		id: uuid(TAG.technician, 3),
		full_name: 'Кузнецов Дмитрий Олегович',
		specialization: 'Слесарь-ремонтник',
		employee_number: 'EMP-003',
	},
	{
		id: uuid(TAG.technician, 4),
		full_name: 'Соколова Мария Игоревна',
		specialization: 'Инженер-электроник',
		employee_number: 'EMP-004',
	},
	{
		id: uuid(TAG.technician, 5),
		full_name: 'Попов Артём Николаевич',
		specialization: 'Специалист по гидравлике',
		employee_number: 'EMP-005',
	},
	{
		id: uuid(TAG.technician, 6),
		full_name: 'Волкова Екатерина Дмитриевна',
		specialization: 'Инженер по автоматизации',
		employee_number: 'EMP-006',
	},
];
