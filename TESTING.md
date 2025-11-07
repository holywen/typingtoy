# Testing Documentation

## Overview

This project uses **Jest** and **React Testing Library** for unit testing with comprehensive code coverage.

## Test Coverage

**Current Coverage: 98.64%** ✅

- **Statements**: 98.64%
- **Branches**: 94.28%
- **Functions**: 98.68%
- **Lines**: 98.78%

### Covered Modules

#### Services (97.84% coverage)
- ✅ `typingMetrics.ts` - 100% coverage - Industry-standard WPM and accuracy calculations
- ✅ `progressStorage.ts` - 95.45% coverage - Local storage progress tracking
- ✅ `userSettings.ts` - 100% coverage - User preferences management
- ✅ `soundEffects.ts` - 100% coverage - Web Audio API sound generation

#### Utilities (100% coverage)
- ✅ `nameGenerator.ts` - 100% coverage - Guest name and username generation
- ✅ `profanityFilter.ts` - 100% coverage - Content filtering and validation
- ✅ `textGenerator.ts` - 100% coverage - Random typing text generation

#### Data (100% coverage)
- ✅ `lessons.ts` - 100% coverage - Lesson data validation

### Excluded from Coverage

The following files are excluded from coverage metrics as they require extensive integration testing:

**Complex Integration Files**:
- `socketServer.ts`, `socketClient.ts` - WebSocket connections
- `roomManager.ts`, `matchmaking.ts` - Multiplayer game logic
- `gameSessionService.ts`, `leaderboardService.ts` - Database operations
- `antiCheat.ts`, `skillRating.ts` - Anti-cheat and rating algorithms
- `deviceId.ts` - Browser fingerprinting
- `emailService.ts`, `dataSync.ts` - External services

**Infrastructure**:
- `lib/db/**` - Database models and connections
- `lib/redis/**` - Redis caching
- `lib/i18n/**` - React i18n context
- `keyboardLayout.ts` - Large static data file

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Test Organization

Tests are organized using the `__tests__` directory pattern:

```
lib/
├── services/
│   ├── __tests__/
│   │   ├── typingMetrics.test.ts
│   │   ├── progressStorage.test.ts
│   │   ├── userSettings.test.ts
│   │   └── soundEffects.test.ts
│   └── ...
├── utils/
│   ├── __tests__/
│   │   ├── nameGenerator.test.ts
│   │   ├── profanityFilter.test.ts
│   │   └── textGenerator.test.ts
│   └── ...
└── data/
    ├── __tests__/
    │   └── lessons.test.ts
    └── ...
```

## Key Test Suites

### Typing Metrics Tests
Tests industry-standard calculations:
- Gross WPM = (total characters / 5) / time in minutes
- Net WPM = Gross WPM - (uncorrected errors / time in minutes)
- Accuracy = (correct characters / total characters) × 100

### Progress Storage Tests
Tests local storage operations:
- Saving/loading progress history
- Last position tracking for resume functionality
- Export/import functionality
- Statistics and trends calculations

### User Settings Tests
Tests user preference management:
- Theme, keyboard layout, language settings
- Sound toggle functionality
- Settings persistence

### Sound Effects Tests
Tests Web Audio API integration:
- Keystroke sounds (correct/incorrect)
- Completion melodies
- Error sound effects

### Name Generator Tests
Tests username generation:
- Guest name format validation
- Username appropriateness checking
- Unique name generation
- Room name creation

### Profanity Filter Tests
Tests content filtering:
- Profanity detection (multiple languages)
- Text filtering and replacement
- Severity level assessment
- Username validation

### Text Generator Tests
Tests typing text generation:
- Word count ranges
- Sentence structure
- Paragraph formatting
- Natural language patterns

## CI/CD Integration

Tests run automatically on:
- Every push to `main`, `master`, or `develop` branches
- Every pull request

### GitHub Actions Workflow

See `.github/workflows/test.yml` for the complete CI configuration.

**Features**:
- Multi-version Node.js testing (18.x, 20.x)
- Automated coverage report generation
- Coverage artifact uploads
- PR comment integration with coverage summary

## Writing New Tests

### Best Practices

1. **Test file naming**: `*.test.ts` or `*.spec.ts`
2. **Co-location**: Place tests in `__tests__` directory next to source files
3. **Descriptive names**: Use clear `describe` and `it` blocks
4. **Arrange-Act-Assert**: Follow AAA pattern
5. **Mock external dependencies**: Mock localStorage, Audio API, etc.
6. **Edge cases**: Test boundary conditions and error scenarios

### Example Test Structure

```typescript
import { functionToTest } from '../module';

describe('Module Name', () => {
  beforeEach(() => {
    // Setup
  });

  describe('functionToTest', () => {
    it('should handle normal case', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = functionToTest(input);

      // Assert
      expect(result).toBe('expected');
    });

    it('should handle edge case', () => {
      // Test edge cases
    });
  });
});
```

## Mock Setup

Common mocks are configured in `jest.setup.js`:

- `window.matchMedia`
- `IntersectionObserver`
- `localStorage`
- `performance.now`
- `Audio` constructor

## Coverage Thresholds

The project maintains strict coverage thresholds:

- **Statements**: 85%
- **Branches**: 85%
- **Functions**: 85%
- **Lines**: 85%

Current coverage **exceeds these thresholds** across all metrics.

## Troubleshooting

### Common Issues

**Issue**: `Cannot find module '@/...`
**Solution**: Check `moduleNameMapper` in `jest.config.js`

**Issue**: `localStorage is not defined`
**Solution**: Mocked in `jest.setup.js`

**Issue**: `window.matchMedia is not a function`
**Solution**: Mocked in `jest.setup.js`

**Issue**: Tests timing out
**Solution**: Increase timeout in test file or use `jest.setTimeout()`

## Future Improvements

- [ ] Add integration tests for socket connections
- [ ] Add E2E tests with Playwright (already installed)
- [ ] Add component tests for React components
- [ ] Add visual regression tests
- [ ] Add performance benchmarks

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
