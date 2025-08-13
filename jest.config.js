export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/tests/**/*.{test,spec}.{js,ts,tsx}', '**/*.(test|spec).{js,ts,tsx}'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/renderer/index.tsx', // Entry point
    '!tests/**',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(svg|png|jpg|jpeg|gif)$': '<rootDir>/tests/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 10000,
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 40,
      statements: 40,
    },
  },
};
