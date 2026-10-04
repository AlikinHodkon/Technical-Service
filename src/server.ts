import 'reflect-metadata';
import app from './app.ts';
import { sequelize } from './config/db.ts';
import { config } from './config/env.ts';
import { logger } from './config/logger.ts';

export async function waitForDatabase({
	attempts = 10,
	baseDelayMs = 500,
} = {}) {
	for (let attempt = 1; attempt <= attempts; attempt++) {
		try {
			await sequelize.authenticate();
			return;
		} catch (err) {
			if (attempt === attempts) throw err;
			const delay = baseDelayMs * attempt;
			logger.warn(
				`База недоступна (попытка ${attempt}/${attempts}), повтор через ${delay} мс`,
			);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}
}

try {
	await waitForDatabase();
} catch (error) {
	logger.error(error);
	process.exit(1);
}

const server = app.listen(config.port, () => {
	logger.info(`Server listening on port ${config.port}`);
});
// Больше keepalive_timeout в upstream nginx (60s) — иначе nginx может
// отправить запрос в simplex-соединение, которое Node уже закрывает.
server.keepAliveTimeout = 65_000;

for (const signal of ['SIGINT', 'SIGTERM']) {
	process.on(signal, async () => {
		logger.info(`Получен ${signal}, завершаю работу`);
		server.close(async () => {
			try {
				await sequelize.close();
			} catch (error) {
				logger.error(error);
			}
			process.exit(0);
		});
		// close() не трогает простаивающие keepalive — без этого висят до своего таймаута (65с).
		server.closeIdleConnections();
		// Страховка на случай, если close() зависнет — иначе ждали бы SIGKILL от Docker.
		setTimeout(() => process.exit(1), 25_000).unref();
	});
}
