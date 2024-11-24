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
  setupFilesAfterEnv: ['<rootDir>/tests/setupAfterEnv.js'],
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
  testTimeout: undefined,
  setupFilesAfterEnv: [
    ...baseConfig.setupFilesAfterEnv,
    '<rootDir>/tests/e2e/setup.js'
  ]
};

module.exports = {
  projects: [
    integrationConfig,
    e2eConfig,
  ],
};
