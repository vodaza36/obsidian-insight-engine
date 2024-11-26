import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    mockReset: true,
  },
  resolve: {
    alias: {
      'obsidian': './tests/__mocks__/obsidian.ts'
    }
  }
});
