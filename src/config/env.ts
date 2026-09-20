import * as z from 'zod';

const envSchema = z.object({
	PORT: z.coerce.number().int().positive().default(3000),
	NODE_ENV: z
		.enum(['development', 'test', 'production'])
		.default('development'),
	CORS_ORIGINS: z.string().default(''),
	RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
	RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
	WEATHER_API_URL: z.string().default('https://api.open-meteo.com/v1'),
	REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
	API_KEY: z.string().min(1).default('dev-api-key'),
});

const env = envSchema.parse(process.env);

export const config = {
	port: env.PORT,
	nodeEnv: env.NODE_ENV,
	isProduction: env.NODE_ENV === 'production',
	corsOrigins: env.CORS_ORIGINS.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean),
	rateLimit: {
		windowMs: env.RATE_LIMIT_WINDOW_MS,
		max: env.RATE_LIMIT_MAX,
	},
	weatherApiUrl: env.WEATHER_API_URL,
	requestTimeoutMs: env.REQUEST_TIMEOUT_MS,
	apiKey: env.API_KEY,
};
