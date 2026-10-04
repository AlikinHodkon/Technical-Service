import { Site } from '../../models/site.model.ts';

const UNSPECIFIED_SITE_CODE = 'UNSPECIFIED';

export const sitesFindById = async (id: string) => {
	return Site.findByPk(id);
};

// siteId необязателен (Кейс 2 не знал о площадках) — без него оборудование идёт сюда, в площадку-заглушку.
export const sitesFindOrCreateUnspecified = async () => {
	const [site] = await Site.findOrCreate({
		where: { code: UNSPECIFIED_SITE_CODE },
		defaults: {
			name: 'Площадка не указана',
			code: UNSPECIFIED_SITE_CODE,
			region: null,
			coordinates: null,
		},
	});
	return site;
};
