import { col, fn } from 'sequelize';
import { Equipment } from '../../models/equipment.model.ts';
import { MaintenanceRequest } from '../../models/maintenance-request.model.ts';
import { RequestStatusHistory } from '../../models/request-status-history.model.ts';
import { RequestStatusLookup } from '../../models/request-status-lookup.model.ts';
import { NotFoundError } from '../errors/error.ts';
import { sitesFindById } from '../repositories/sitesRepositories.ts';

type StatusCountRow = { statusCode: string; count: string };
type PriorityCountRow = { priorityCode: string; count: string };

export const sitesServiceGetSummary = async (siteId: string) => {
	const site = await sitesFindById(siteId);
	if (!site) throw new NotFoundError('Площадка', 'не найдена');

	// Атрибуты передаём простой строкой (не парой [expr, alias]) — иначе
	// Sequelize вставляет camelCase-имя как сырой SQL-литерал вместо маппинга
	// через underscored-имя реальной колонки (проверено вручную на реальной
	// БД: [['statusCode','code'],...] падает с "column ...statusCode does not
	// exist", а group по алиасу из SELECT-листа — штатное поведение Postgres).
	const [byStatusRows, byPriorityRows, terminalLookups] = await Promise.all([
		MaintenanceRequest.findAll({
			attributes: [
				'statusCode',
				[fn('COUNT', col('MaintenanceRequest.id')), 'count'],
			],
			include: [{ model: Equipment, where: { siteId }, attributes: [] }],
			group: ['statusCode'],
			raw: true,
		}) as unknown as Promise<StatusCountRow[]>,
		MaintenanceRequest.findAll({
			attributes: [
				'priorityCode',
				[fn('COUNT', col('MaintenanceRequest.id')), 'count'],
			],
			include: [{ model: Equipment, where: { siteId }, attributes: [] }],
			group: ['priorityCode'],
			raw: true,
		}) as unknown as Promise<PriorityCountRow[]>,
		RequestStatusLookup.findAll({
			where: { isTerminal: true },
			attributes: ['code'],
		}),
	]);

	const terminalCodes = terminalLookups.map((lookup) => lookup.code);

	// Считаем среднее время закрытия в JS, а не одним общим SQL-запросом с
	// group+AVG: второй include (через RequestStatusHistory) размножил бы
	// строки maintenance_requests и исказил бы byStatus/byPriority, если бы
	// жил в том же запросе. Отдельный плоский список пар
	// (createdAt заявки, changedAt терминального перехода) считается безопасно.
	const closedTransitions =
		terminalCodes.length === 0
			? []
			: await RequestStatusHistory.findAll({
					attributes: ['changedAt'],
					where: { newStatusCode: terminalCodes },
					include: [
						{
							model: MaintenanceRequest,
							attributes: ['createdAt'],
							required: true,
							include: [
								{ model: Equipment, where: { siteId }, attributes: [] },
							],
						},
					],
				});

	const avgResolutionHours =
		closedTransitions.length === 0
			? null
			: closedTransitions.reduce((sum, transition) => {
					const durationMs =
						transition.changedAt.getTime() -
						transition.request.createdAt.getTime();
					return sum + durationMs;
				}, 0) /
				closedTransitions.length /
				3_600_000;

	return {
		site,
		byStatus: byStatusRows.map((row) => ({
			code: row.statusCode,
			count: Number(row.count),
		})),
		byPriority: byPriorityRows.map((row) => ({
			code: row.priorityCode,
			count: Number(row.count),
		})),
		avgResolutionHours,
	};
};
