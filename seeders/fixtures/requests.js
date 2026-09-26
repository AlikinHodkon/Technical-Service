'use strict';

const { uuid, TAG } = require('./ids');
const equipment = require('./equipment');
const technicians = require('./technicians');

const BASE_DATE = new Date('2025-01-01T00:00:00Z');

function atDay(n) {
	return new Date(BASE_DATE.getTime() + n * 24 * 60 * 60 * 1000);
}

const definitions = [
	{
		equipmentIdx: 1,
		priority: 'medium',
		author: 'Иванов П.С.',
		title: 'Плановое ТО турбины №1',
		description: 'Ежегодное регламентное обслуживание',
		plannedAtDay: 1,
		transitions: [
			{ status: 'new', day: 0 },
			{ status: 'in_progress', day: 2 },
			{ status: 'done', day: 9 },
		],
		assignees: [
			{ technicianIdx: 1, role: 'lead', hours: 4 },
			{ technicianIdx: 4, role: 'member', hours: 2 },
		],
	},
	{
		equipmentIdx: 1,
		priority: 'high',
		author: 'Иванов П.С.',
		title: 'Замена подшипника генератора',
		description: 'Повышенная вибрация на выходном валу',
		plannedAtDay: 20,
		transitions: [
			{ status: 'new', day: 20 },
			{ status: 'in_progress', day: 21 },
			{ status: 'done', day: 25 },
		],
		assignees: [{ technicianIdx: 2, role: 'lead', hours: 6 }],
	},
	{
		equipmentIdx: 1,
		priority: 'low',
		author: 'Смирнова А.В.',
		title: 'Проверка датчиков вибрации турбины №1',
		description: 'Плановая сверка показаний',
		plannedAtDay: 40,
		transitions: [
			{ status: 'new', day: 40 },
			{ status: 'in_progress', day: 41 },
			{ status: 'done', day: 44 },
		],
		assignees: [
			{ technicianIdx: 3, role: 'lead', hours: 8 },
			{ technicianIdx: 6, role: 'member', hours: 4 },
		],
	},
	{
		equipmentIdx: 1,
		priority: 'low',
		author: 'Оператор ЦДП',
		title: 'Жалоба на посторонний шум',
		description: 'Требует диагностики, бригада ещё не назначена',
		plannedAtDay: null,
		transitions: [{ status: 'new', day: 60 }],
		assignees: [],
	},
	{
		equipmentIdx: 2,
		priority: 'critical',
		author: 'Оператор ЦДП',
		title: 'Аварийная остановка турбины №2',
		description: 'Сработала защита по перегреву редуктора',
		plannedAtDay: 0,
		transitions: [
			{ status: 'new', day: 0 },
			{ status: 'in_progress', day: 0 },
		],
		assignees: [{ technicianIdx: 4, role: 'lead', hours: 10 }],
	},
	{
		equipmentIdx: 2,
		priority: 'high',
		author: 'Кузнецов Д.О.',
		title: 'Замена лопасти турбины №2',
		description: 'Обнаружена трещина при плановом осмотре',
		plannedAtDay: 10,
		transitions: [
			{ status: 'new', day: 10 },
			{ status: 'in_progress', day: 12 },
		],
		assignees: [
			{ technicianIdx: 5, role: 'lead', hours: 12 },
			{ technicianIdx: 2, role: 'member', hours: 4 },
		],
	},
	{
		equipmentIdx: 2,
		priority: 'medium',
		author: 'Иванов П.С.',
		title: 'Смазка редуктора турбины №2',
		description: 'Регламентная процедура по графику',
		plannedAtDay: 30,
		transitions: [
			{ status: 'new', day: 30 },
			{ status: 'in_progress', day: 31 },
			{ status: 'done', day: 33 },
		],
		assignees: [{ technicianIdx: 6, role: 'lead', hours: 4 }],
	},
	{
		equipmentIdx: 3,
		priority: 'low',
		author: 'Соколова М.И.',
		title: 'Калибровка инвертора №1',
		description: 'Плановая калибровка после обновления прошивки',
		plannedAtDay: 5,
		transitions: [
			{ status: 'new', day: 5 },
			{ status: 'in_progress', day: 6 },
			{ status: 'done', day: 8 },
		],
		assignees: [
			{ technicianIdx: 1, role: 'lead', hours: 6 },
			{ technicianIdx: 4, role: 'member', hours: 3 },
		],
	},
	{
		equipmentIdx: 3,
		priority: 'low',
		author: 'Соколова М.И.',
		title: 'Плановая проверка инвертора №1',
		description: 'Квартальный осмотр, ожидает назначения',
		plannedAtDay: 55,
		transitions: [{ status: 'new', day: 50 }],
		assignees: [],
	},
	{
		equipmentIdx: 4,
		priority: 'critical',
		author: 'Оператор ЦДП',
		title: 'Инвертор №2 не выдаёт мощность',
		description: 'Полная остановка выдачи мощности на площадке',
		plannedAtDay: 0,
		transitions: [
			{ status: 'new', day: 0 },
			{ status: 'in_progress', day: 0 },
		],
		assignees: [{ technicianIdx: 2, role: 'lead', hours: 12 }],
	},
	{
		equipmentIdx: 4,
		priority: 'high',
		author: 'Оператор ЦДП',
		title: 'Диагностика после аварии инвертора №2',
		description: 'Дублирует заявку по аварийной остановке',
		plannedAtDay: 15,
		transitions: [
			{ status: 'new', day: 15 },
			{ status: 'rejected', day: 16 },
		],
		assignees: [],
	},
	{
		equipmentIdx: 4,
		priority: 'medium',
		author: 'Смирнова А.В.',
		title: 'Профилактика инвертора №2',
		description: 'Плановое ТО после ремонта',
		plannedAtDay: 35,
		transitions: [
			{ status: 'new', day: 35 },
			{ status: 'in_progress', day: 36 },
			{ status: 'done', day: 40 },
		],
		assignees: [
			{ technicianIdx: 3, role: 'lead', hours: 10 },
			{ technicianIdx: 6, role: 'member', hours: 3 },
		],
	},
	{
		equipmentIdx: 5,
		priority: 'low',
		author: 'Кузнецов Д.О.',
		title: 'Проверка датчика вибрации',
		description: 'Плановая сверка калибровки',
		plannedAtDay: 2,
		transitions: [
			{ status: 'new', day: 2 },
			{ status: 'in_progress', day: 3 },
			{ status: 'done', day: 4 },
		],
		assignees: [{ technicianIdx: 4, role: 'lead', hours: 12 }],
	},
	{
		equipmentIdx: 5,
		priority: 'low',
		author: 'Кузнецов Д.О.',
		title: 'Замена батареи датчика вибрации',
		description: 'Низкий заряд по телеметрии',
		plannedAtDay: 45,
		transitions: [
			{ status: 'new', day: 45 },
			{ status: 'in_progress', day: 46 },
			{ status: 'done', day: 47 },
		],
		assignees: [
			{ technicianIdx: 5, role: 'lead', hours: 4 },
			{ technicianIdx: 2, role: 'member', hours: 5 },
		],
	},
	{
		equipmentIdx: 6,
		priority: 'medium',
		author: 'Попов А.Н.',
		title: 'Калибровка датчика температуры',
		description: 'Отклонение показаний от эталона',
		plannedAtDay: 8,
		transitions: [
			{ status: 'new', day: 8 },
			{ status: 'in_progress', day: 9 },
			{ status: 'done', day: 15 },
		],
		assignees: [{ technicianIdx: 6, role: 'lead', hours: 6 }],
	},
	{
		equipmentIdx: 6,
		priority: 'medium',
		author: 'Волкова Е.Д.',
		title: 'Ложные показания датчика температуры',
		description: 'При проверке отклонений не подтверждено',
		plannedAtDay: 25,
		transitions: [
			{ status: 'new', day: 25 },
			{ status: 'rejected', day: 26 },
		],
		assignees: [],
	},
	{
		equipmentIdx: 7,
		priority: 'high',
		author: 'Волкова Е.Д.',
		title: 'Плановое обслуживание подстанции',
		description: 'Годовое регламентное обслуживание оборудования',
		plannedAtDay: 0,
		transitions: [
			{ status: 'new', day: 0 },
			{ status: 'in_progress', day: 3 },
			{ status: 'done', day: 20 },
		],
		assignees: [
			{ technicianIdx: 1, role: 'lead', hours: 8 },
			{ technicianIdx: 4, role: 'member', hours: 5 },
		],
	},
	{
		equipmentIdx: 7,
		priority: 'medium',
		author: 'Попов А.Н.',
		title: 'Проверка изоляции подстанции',
		description: 'Плановый замер сопротивления изоляции',
		plannedAtDay: 60,
		transitions: [
			{ status: 'new', day: 60 },
			{ status: 'in_progress', day: 61 },
		],
		assignees: [{ technicianIdx: 2, role: 'lead', hours: 10 }],
	},
	{
		equipmentIdx: 7,
		priority: 'critical',
		author: 'Оператор ЦДП',
		title: 'Экстренный осмотр подстанции после грозы',
		description: 'Зафиксирован скачок напряжения',
		plannedAtDay: 70,
		transitions: [
			{ status: 'new', day: 70 },
			{ status: 'in_progress', day: 70 },
			{ status: 'done', day: 72 },
		],
		assignees: [
			{ technicianIdx: 3, role: 'lead', hours: 12 },
			{ technicianIdx: 6, role: 'member', hours: 6 },
		],
	},
	{
		equipmentIdx: 8,
		priority: 'medium',
		author: 'Иванов П.С.',
		title: 'Демонтаж турбины №3',
		description: 'Вывод из эксплуатации по графику списания',
		plannedAtDay: 0,
		transitions: [
			{ status: 'new', day: 0 },
			{ status: 'in_progress', day: 5 },
			{ status: 'done', day: 10 },
		],
		assignees: [{ technicianIdx: 4, role: 'lead', hours: 4 }],
	},
	{
		equipmentIdx: 8,
		priority: 'low',
		author: 'Иванов П.С.',
		title: 'Финальная проверка перед списанием',
		description: 'Контроль полноты демонтажа',
		plannedAtDay: 11,
		transitions: [
			{ status: 'new', day: 11 },
			{ status: 'in_progress', day: 11 },
			{ status: 'done', day: 13 },
		],
		assignees: [
			{ technicianIdx: 5, role: 'lead', hours: 6 },
			{ technicianIdx: 2, role: 'member', hours: 3 },
		],
	},
	{
		equipmentIdx: 3,
		priority: 'medium',
		author: 'Соколова М.И.',
		title: 'Шум при работе инвертора №1',
		description: 'При проверке — нормальный рабочий шум охлаждения',
		plannedAtDay: 58,
		transitions: [
			{ status: 'new', day: 58 },
			{ status: 'rejected', day: 59 },
		],
		assignees: [],
	},
	{
		equipmentIdx: 5,
		priority: 'low',
		author: 'Кузнецов Д.О.',
		title: 'Плановая калибровка датчика (Q1)',
		description: 'Квартальная калибровка по графику',
		plannedAtDay: 80,
		transitions: [
			{ status: 'new', day: 80 },
			{ status: 'in_progress', day: 81 },
			{ status: 'done', day: 83 },
		],
		assignees: [{ technicianIdx: 6, role: 'lead', hours: 8 }],
	},
	{
		equipmentIdx: 6,
		priority: 'low',
		author: 'Попов А.Н.',
		title: 'Обновление прошивки датчика температуры',
		description: 'Новая версия прошивки, ожидает назначения',
		plannedAtDay: null,
		transitions: [{ status: 'new', day: 85 }],
		assignees: [],
	},
];

const commentByStatus = {
	new: 'Заявка создана',
	in_progress: 'Взято в работу',
	done: 'Работы завершены',
	rejected: 'Заявка отклонена',
};

const requests = definitions.map((def, i) => {
	const n = i + 1;
	const first = def.transitions[0];
	const last = def.transitions[def.transitions.length - 1];

	return {
		id: uuid(TAG.request, n),
		equipment_id: equipment[def.equipmentIdx - 1].id,
		title: def.title,
		description: def.description,
		priority_code: def.priority,
		status_code: last.status,
		planned_at: def.plannedAtDay === null ? null : atDay(def.plannedAtDay),
		author: def.author,
		created_at: atDay(first.day),
		updated_at: atDay(last.day),
		history: def.transitions.map((t, idx) => ({
			old_status_code: idx === 0 ? null : def.transitions[idx - 1].status,
			new_status_code: t.status,
			author: def.author,
			comment: commentByStatus[t.status],
			changed_at: atDay(t.day),
		})),
		assignees: def.assignees.map((a) => ({
			technician_id: technicians[a.technicianIdx - 1].id,
			role_code: a.role,
			hours: a.hours,
		})),
	};
});

module.exports = requests;
