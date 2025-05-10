module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.integration.ts'],
  testTimeout: 30000, // Longer timeout for integration tests
};
