/** @type {import('ts-jest').JestConfigWithTsJest} */
const baseConfig = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  moduleNameMapper: {
    '^obsidian$': '<rootDir>/tests/mocks/obsidian.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^../../main$': '<rootDir>/main.ts',
    '^../../src/(.*)$': '<rootDir>/src/$1'
  },
  setupFiles: [
    '<rootDir>/tests/setup/polyfills.js',
    '<rootDir>/tests/setup.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setupAfterEnv.js'],
  roots: ['<rootDir>'],
  modulePaths: ['<rootDir>']
};

const integrationConfig = {
  ...baseConfig,
  displayName: 'integration',
  testMatch: ['<rootDir>/tests/integration/**/*.test.ts']
};

const e2eConfig = {
  ...baseConfig,
  displayName: 'e2e',
  testMatch: ['<rootDir>/tests/e2e/**/*.test.ts'],
  setupFilesAfterEnv: [
    ...baseConfig.setupFilesAfterEnv,
    '<rootDir>/tests/e2e/setup.js'
  ]
};

const unitConfig = {
  ...baseConfig,
  displayName: 'unit',
  testMatch: ['<rootDir>/tests/unit/**/*.test.ts']
};

module.exports = {
  projects: [unitConfig, integrationConfig, e2eConfig]
};
