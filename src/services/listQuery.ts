export const sortByField = <T, F extends string>(
	list: T[],
	sort: string | undefined,
	sortableFields: readonly F[],
	getValue: (item: T, field: F) => string | number = (item, field) =>
		((item as Record<string, unknown>)[field] as string | number) ?? '',
): T[] => {
	if (!sort) return list;

	const isDescending = sort.startsWith('-');
	const field = (isDescending ? sort.slice(1) : sort) as F;
	if (!sortableFields.includes(field)) return list;

	return list.toSorted((a, b) => {
		const left = getValue(a, field);
		const right = getValue(b, field);
		const direction = left < right ? -1 : left > right ? 1 : 0;
		return isDescending ? -direction : direction;
	});
};

export const paginate = <T>(
	list: T[],
	page: string | undefined,
	limit: string | undefined,
) => {
	const pageNum = Math.max(Number.parseInt(page ?? '1', 10) || 1, 1);
	const limitNum = Math.max(Number.parseInt(limit ?? '20', 10) || 1, 1);
	const start = (pageNum - 1) * limitNum;

	return {
		data: list.slice(start, start + limitNum),
		total: list.length,
		page: pageNum,
		limit: limitNum,
	};
};
