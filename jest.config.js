/** @type {import('ts-jest').JestConfigWithTsJest} */
const baseConfig = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  moduleNameMapper: {
    '^obsidian$': '<rootDir>/tests/mocks/obsidian.ts',
  },
  setupFiles: ['<rootDir>/tests/setup.js'],
};

const integrationConfig = {
  ...baseConfig,
  displayName: 'integration',
  testMatch: ['**/tests/integration/**/*.test.ts'],
};

const e2eConfig = {
  ...baseConfig,
  displayName: 'e2e',
  testMatch: ['**/tests/e2e/**/*.test.ts'],
  globalSetup: '<rootDir>/scripts/check-ollama.js',
  testTimeout: 30000, // 30 seconds timeout for e2e tests
};

module.exports = {
  projects: [
    integrationConfig,
    e2eConfig,
  ],
};
