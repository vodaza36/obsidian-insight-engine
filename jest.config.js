/** @type {import('ts-jest').JestConfigWithTsJest} */
const baseConfig = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'js', 'mjs', 'cjs', 'json'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      useESM: true,
    }],
    '^.+\\.m?js$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }]
      ]
    }]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@langchain|uuid|@jest|web-streams-polyfill|outvariant|p-queue|p-timeout|fetch-blob|formdata-polyfill|node-fetch|data-uri-to-buffer|fetch-blob|formdata-polyfill)/)'
  ],
  extensionsToTreatAsEsm: ['.ts'],
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
  modulePaths: ['<rootDir>'],
  // Suppress deprecation warnings
  testEnvironmentOptions: {
    suppressDeprecationWarnings: true
  }
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
