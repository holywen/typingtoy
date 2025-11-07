const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
  },
  collectCoverageFrom: [
    'lib/services/*.ts',
    'lib/utils/*.ts',
    'lib/data/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/dist/**',
    // Exclude complex integration files that require extensive mocking
    '!lib/services/socketServer.ts',
    '!lib/services/socketClient.ts',
    '!lib/services/roomManager.ts',
    '!lib/services/matchmaking.ts',
    '!lib/services/gameSessionService.ts',
    '!lib/services/leaderboardService.ts',
    '!lib/services/dataSync.ts',
    '!lib/services/emailService.ts',
    '!lib/services/antiCheat.ts',
    '!lib/services/skillRating.ts',
    '!lib/services/deviceId.ts',
    '!lib/data/keyboardLayout.ts', // Large data file
    '!lib/db/**',
    '!lib/redis/**',
    '!lib/i18n/**',
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  testMatch: [
    '**/__tests__/**/*.(test|spec).[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/dist/'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
