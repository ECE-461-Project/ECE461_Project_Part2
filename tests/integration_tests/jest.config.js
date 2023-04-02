module.exports = {
  rootDir: '../../',
  transform: {'^.+\\.ts?$': 'ts-jest'},
  testEnvironment: 'node',
  testRegex: '/tests/integration_tests/.*\\.(test|spec)?\\.(ts|tsx)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: ['/node_modules'],
  globalSetup: '<rootDir>/tests/integration_tests/startup/database_seed.ts',
  globalTeardown: '<rootDir>/tests/integration_tests/teardown/database_clear.ts'
};
