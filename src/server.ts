import app from './app.ts';
import { config } from './config/env.ts';
import { logger } from './config/logger.ts';

app.listen(config.port, () => {
	logger.info(`Server listening on port ${config.port}`);
});
