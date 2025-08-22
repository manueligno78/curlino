# Test Strategy - Curlino

This document outlines the testing approach following the **Test Pyramid** best practices.

## Test Pyramid Structure

```
    E2E Tests (6 tests)
    ==================
   Integration Tests (Minimal)
  ================================
 Unit Tests (125 tests, 18 suites)
================================
```

### Test Distribution

- **Unit Tests**: 137+ tests across 19+ suites ✅
- **E2E Tests**: 11 focused tests ✅  
- **Total Test Files**: 22 test suites
- **Ratio**: ~12:1 (Unit:E2E) - Following pyramid guidelines

## Unit Tests (`npm test`)

**Coverage**: Components, Services, Models, Utils
- **Location**: `tests/**/*.test.{ts,tsx}`
- **Framework**: Jest + React Testing Library
- **Focus**: Business logic, component behavior, edge cases

**Key Areas**:
- Components: UI rendering, user interactions, props handling
- Services: API calls, data persistence, storage operations
- Models: Data validation, transformations
- Utils: Helper functions, formatters, validators

## E2E Tests (`npm run test:e2e`)

**Coverage**: Critical user journeys only
- **Location**: `tests/e2e/*.spec.js`
- **Framework**: Playwright + Electron
- **Focus**: End-to-end workflows, UI integration

**Test Coverage**:
1. **App Launch**: Basic startup and UI presence
2. **cURL Import**: Core import functionality  
3. **Navigation**: Tab switching and UI elements
4. **Theme Toggle**: UI customization
5. **Settings Access**: Configuration access
6. **Sidebar Toggle**: UI layout functionality
7. **Error Handling**: Graceful error recovery
8. **Performance**: Responsiveness and large inputs
9. **Keyboard Navigation**: Accessibility features
10. **Window Management**: Resizing and state
11. **Advanced Workflows**: Complex user interactions

## Commands

```bash
# Run all unit tests
npm test

# Run unit tests in watch mode  
npm run test:watch

# Run unit tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI mode
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug
```

## Test Philosophy

### Unit Tests (125 tests)
- **Comprehensive coverage** of business logic
- **Fast execution** (< 10 seconds)
- **Isolated testing** of individual components/functions
- **Edge case handling** and error scenarios

### E2E Tests (6 tests)
- **Happy path verification** only
- **Critical user journeys** focus
- **UI integration validation**
- **Smoke testing** for deployment confidence

### What We DON'T Test at E2E Level
- Complex business logic (covered by unit tests)
- Edge cases and error handling (covered by unit tests)
- Component state management (covered by unit tests)
- Utility functions (covered by unit tests)

## File Structure

```
tests/
├── README.md                    # This file
├── e2e/                         # E2E tests (Playwright)
│   ├── app.spec.js             # Basic app launch test
│   └── essential-flows.spec.js  # Core user flows
├── components/                  # Component unit tests
├── services/                    # Service unit tests
├── models/                      # Model unit tests
├── utils/                       # Utility unit tests
└── renderer/                    # App-level unit tests
```

## Screenshots and Debugging

E2E tests automatically capture screenshots in:
- `tests/screenshots/` - Debug screenshots
- `test-results/` - Playwright test results (gitignored)
- `playwright-report/` - HTML test reports (gitignored)

## Maintenance Guidelines

### Adding New Tests

**For new features**:
1. **Start with unit tests** - Cover business logic first
2. **Add E2E only if critical** - Focus on user-facing workflows
3. **Keep E2E tests simple** - Avoid complex assertions

**Ratio maintenance**:
- Unit tests should grow proportionally with codebase
- E2E tests should remain minimal and focused
- Aim for 15:1 to 25:1 ratio (Unit:E2E)

### Test Stability

**Unit tests**: Should be deterministic and fast
**E2E tests**: May have occasional flakiness due to UI timing
- Use appropriate waits and timeouts
- Take screenshots for debugging
- Focus on core functionality only

## CI/CD Integration

Both test suites run in CI:
1. Unit tests run first (fast feedback)
2. E2E tests run after build (deployment confidence)
3. Tests must pass for deployment

This approach ensures comprehensive testing while maintaining fast feedback loops and sustainable test maintenance.