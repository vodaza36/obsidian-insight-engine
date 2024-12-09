import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		setupFiles: ['./tests/setup.ts'],
		mockReset: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov'],
			exclude: ['node_modules/**', 'tests/**', '**/__mocks__/**'],
			include: ['src/**/*.ts'],
			clean: true,
			reportsDirectory: './coverage',
			enabled: true,
			reportOnFailure: true,
		},
		testTimeout: 20000,
		pool: 'threads',
		poolOptions: {
			threads: {
				singleThread: true,
			},
		},
	},
	resolve: {
		alias: {
			obsidian: './tests/__mocks__/obsidian.ts',
			'@': path.resolve(__dirname, './src'),
		},
	},
});
