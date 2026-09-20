import { getForecast } from '../clients/weatherClient.ts';
import { outdoorWorkRule } from '../config/weather.ts';
import { NotFoundError } from '../errors/error.ts';
import { equipmentFindById } from '../repositories/equipmentRepositories.ts';

const FORECAST_DAYS = 3;

export type DailyForecast = {
	date: string;
	temperatureMax: number;
	temperatureMin: number;
	precipitationSum: number;
	windSpeedMax: number;
	suitableForOutdoorWork: boolean;
};

export const weatherServiceGetForEquipment = async (equipmentId: string) => {
	const equipment = await equipmentFindById(equipmentId);
	if (!equipment) throw new NotFoundError('Оборудование', 'не найдено');

	const forecast = await getForecast(
		equipment.location.lat,
		equipment.location.lon,
		FORECAST_DAYS,
	);

	const days: DailyForecast[] = forecast.daily.time.map((date, index) => {
		const precipitationSum = forecast.daily.precipitation_sum[index] ?? 0;
		const windSpeedMax = forecast.daily.wind_speed_10m_max[index] ?? 0;

		return {
			date,
			temperatureMax: forecast.daily.temperature_2m_max[index] ?? 0,
			temperatureMin: forecast.daily.temperature_2m_min[index] ?? 0,
			precipitationSum,
			windSpeedMax,
			suitableForOutdoorWork:
				precipitationSum <= outdoorWorkRule.maxPrecipitationMm &&
				windSpeedMax < outdoorWorkRule.maxWindSpeedKmh,
		};
	});

	return {
		equipmentId: equipment.id,
		location: equipment.location,
		timezone: forecast.timezone,
		days,
	};
};
