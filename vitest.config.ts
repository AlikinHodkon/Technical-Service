import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		// Тесты роутов используют общую тестовую БД (tech-service-test); при
		// параллельном запуске файлов их beforeEach/afterEach (resetDb) начинают
		// конфликтовать друг с другом.
		fileParallelism: false,
	},
});
