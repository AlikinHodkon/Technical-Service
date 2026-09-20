import { config } from '../config/env.ts';
import { ServiceUnavailableError } from '../errors/error.ts';

export type ForecastResponse = {
	latitude: number;
	longitude: number;
	timezone: string;
	daily_units: {
		time: string;
		temperature_2m_max: string;
		temperature_2m_min: string;
		precipitation_sum: string;
		wind_speed_10m_max: string;
	};
	daily: {
		time: string[];
		temperature_2m_max: number[];
		temperature_2m_min: number[];
		precipitation_sum: number[];
		wind_speed_10m_max: number[];
	};
};

const fetchForecastJson = async (url: URL): Promise<ForecastResponse> => {
	const controller = new AbortController();
	const timeoutId = setTimeout(
		() => controller.abort(),
		config.requestTimeoutMs,
	);

	let response: Response;
	try {
		response = await fetch(url, { signal: controller.signal });
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			throw new ServiceUnavailableError(
				'Погодный сервис не отвечает: превышено время ожидания',
				error,
			);
		}
		throw new ServiceUnavailableError(
			'Погодный сервис недоступен: проблема с сетью',
			error,
		);
	} finally {
		clearTimeout(timeoutId);
	}

	if (!response.ok) {
		throw new ServiceUnavailableError(
			`Погодный сервис вернул ошибку (${response.status})`,
		);
	}

	try {
		return (await response.json()) as ForecastResponse;
	} catch (error) {
		throw new ServiceUnavailableError(
			'Погодный сервис вернул некорректные данные',
			error,
		);
	}
};

export const getForecast = async (
	lat: number,
	lon: number,
	days = 3,
): Promise<ForecastResponse> => {
	const url = new URL(`${config.weatherApiUrl.replace(/\/$/, '')}/forecast`);
	url.searchParams.set('latitude', lat.toString());
	url.searchParams.set('longitude', lon.toString());
	url.searchParams.set(
		'daily',
		'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',
	);
	url.searchParams.set('forecast_days', days.toString());
	url.searchParams.set('timezone', 'auto');
	return fetchForecastJson(url);
};
