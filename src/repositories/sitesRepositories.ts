import { Site } from '../../models/site.model.ts';

const UNSPECIFIED_SITE_CODE = 'UNSPECIFIED';

export const sitesFindById = async (id: string) => {
	return Site.findByPk(id);
};

// Кейс 2 не знал о площадках; чтобы не делать siteId обязательным (это сломало
// бы старый контракт создания оборудования), при отсутствии siteId в запросе
// оборудование привязывается к этой служебной площадке-заглушке.
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
