import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		// Тесты роутов используют общий storage-test/ на диске; при параллельном
		// запуске файлов их beforeEach/afterEach начинают конфликтовать.
		fileParallelism: false,
	},
});
