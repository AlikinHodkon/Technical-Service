import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/db.ts';
import type { GetEquipmentLoadQuery } from '../validators/reports.validator.ts';

// Параметры только через bind ($1/$2/$3) — никакой конкатенации строк.
const EQUIPMENT_LOAD_SQL = `
	SELECT
		e.id AS "equipmentId",
		e.name AS "name",
		COUNT(DISTINCT mr.id)::int AS "requestsCount",
		COUNT(DISTINCT mr.id) FILTER (WHERE rsl.is_terminal)::int AS "closedCount",
		COALESCE(SUM(ra.hours), 0)::int AS "plannedHoursSum",
		MAX(ep.last_inspection_at) AS "lastMaintenanceAt"
	FROM equipment e
	LEFT JOIN maintenance_requests mr
		ON mr.equipment_id = e.id
		AND ($1::timestamptz IS NULL OR mr.created_at >= $1::timestamptz)
		AND ($2::timestamptz IS NULL OR mr.created_at <= $2::timestamptz)
	LEFT JOIN request_status_lookup rsl ON rsl.code = mr.status_code
	LEFT JOIN request_assignees ra ON ra.request_id = mr.id
	LEFT JOIN equipment_passports ep ON ep.equipment_id = e.id
	GROUP BY e.id, e.name
	HAVING COUNT(DISTINCT mr.id) >= $3::int
	ORDER BY "requestsCount" DESC;
`;

export const reportsServiceGetEquipmentLoad = async (
	query: GetEquipmentLoadQuery,
) => {
	return sequelize.query(EQUIPMENT_LOAD_SQL, {
		bind: [query.dateFrom ?? null, query.dateTo ?? null, query.minRequests],
		type: QueryTypes.SELECT,
	});
};
