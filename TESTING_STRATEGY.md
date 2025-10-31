# Testing Strategy

This document outlines the comprehensive testing strategy for Project Catalyst, including unit tests, E2E tests, load tests, and chaos engineering.

## Testing Pyramid

```
                    /\
                   /  \
                  / Chaos \
                 /  Tests  \
                /____________\
               /              \
              /   Load Tests   \
             /                  \
            /____________________\
           /                      \
          /      E2E Tests         \
         /                          \
        /____________________________\
       /                              \
      /         Unit Tests             \
     /                                  \
    /____________________________________\
```

## Test Types

### 1. Unit Tests (Base Layer)

**Purpose:** Test individual functions and components in isolation

**Framework:** Vitest + React Testing Library

**Coverage Target:** 80%+

**Location:** `tests/`

**Run Command:**
```bash
pnpm test                    # Run all unit tests
pnpm test --coverage         # With coverage report
pnpm test --watch            # Watch mode
```

**What to Test:**
- Individual functions and utilities
- React components (rendering, props, state)
- Business logic
- Data transformations
- Error handling

**Example:**
```typescript
// tests/utils.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate } from '../src/utils';

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2025-01-31');
    expect(formatDate(date)).toBe('January 31, 2025');
  });
});
```

**Current Status:**
- ✅ 87 passing tests
- ✅ ~75% code coverage
- ✅ Automated in CI/CD

### 2. End-to-End Tests (E2E)

**Purpose:** Test complete user workflows from browser perspective

**Framework:** Playwright

**Coverage Target:** All critical user paths

**Location:** `e2e/`

**Run Command:**
```bash
pnpm test:e2e               # Run E2E tests
pnpm test:e2e:ui            # Run with UI mode
playwright test --headed    # Run in headed mode
playwright test --debug     # Debug mode
```

**What to Test:**
- User authentication flow
- Project creation and management
- Deployment workflows
- Critical business processes
- Cross-browser compatibility

**Test Suites:**
1. **auth.spec.ts** - Authentication flows
   - Login/logout
   - Session management
   - Protected routes

2. **project-workflow.spec.ts** - Project management
   - Create project
   - Edit project
   - Delete project
   - List projects

3. **deployment.spec.ts** - Deployment workflows
   - Provider selection
   - Configuration
   - Deployment status
   - Logs viewing

**Browser Coverage:**
- ✅ Chromium (Desktop)
- ✅ Firefox (Desktop)
- ✅ WebKit/Safari (Desktop)
- ✅ Mobile Chrome
- ✅ Mobile Safari

**Current Status:**
- ✅ 3 test suites
- ✅ 15+ test scenarios
- ✅ Automated in CI/CD
- ✅ Screenshot/video on failure

### 3. Load Tests

**Purpose:** Validate performance under various load conditions

**Framework:** k6

**Coverage Target:** All critical API endpoints

**Location:** `load-tests/`

**Run Command:**
```bash
pnpm test:load                  # API load test
pnpm test:load:concurrent       # Concurrent users test
k6 run --vus 100 --duration 5m  # Custom load
```

**Test Scenarios:**

1. **api-load-test.js** - API Performance
   - Health endpoints
   - tRPC endpoints
   - Homepage load
   - Response time thresholds

2. **concurrent-users-test.js** - User Simulation
   - Constant load (20 VUs)
   - Ramping load (0→100 VUs)
   - Spike test (sudden 200 VUs)
   - User session flows

**Performance Thresholds:**
- p95 response time < 500ms (normal load)
- p95 response time < 1000ms (high load)
- Error rate < 5%
- Successful request rate > 95%

**Current Status:**
- ✅ 2 load test scenarios
- ✅ Custom metrics tracking
- ✅ Automated on main/develop pushes
- ✅ Results uploaded as artifacts

### 4. Chaos Engineering Tests

**Purpose:** Validate system resilience under failure conditions

**Framework:** k6 with chaos scenarios

**Coverage Target:** Critical failure modes

**Location:** `chaos-tests/`

**Run Command:**
```bash
pnpm test:chaos                      # All scenarios
k6 run --env SCENARIO=db_chaos       # Database chaos
k6 run --env SCENARIO=network_chaos  # Network chaos
k6 run --env SCENARIO=resource_chaos # Resource chaos
```

**Chaos Scenarios:**

1. **Database Connection Chaos**
   - Connection pool exhaustion
   - Database failures
   - Recovery testing

2. **Network Latency Chaos**
   - Slow responses
   - Timeouts
   - Intermittent connectivity

3. **Resource Exhaustion**
   - High concurrent load
   - Memory pressure
   - CPU saturation

**Success Criteria:**
- Error recovery rate > 70%
- Graceful degradation (429/503 responses)
- System recovers after stress
- Meaningful error messages

**Current Status:**
- ✅ 3 chaos scenarios
- ✅ Weekly automated runs
- ✅ Automated issue creation on failure
- ✅ Comprehensive documentation

## Testing Workflow

### Development Workflow

1. **Write Code**
   - Implement feature
   - Write unit tests
   - Ensure tests pass locally

2. **Local Testing**
   ```bash
   pnpm test              # Unit tests
   pnpm test:e2e          # E2E tests
   pnpm test:load         # Load tests (optional)
   ```

3. **Commit & Push**
   - CI/CD runs automatically
   - Unit tests
   - E2E tests
   - Build verification

4. **Review Results**
   - Check CI/CD status
   - Review test reports
   - Fix any failures

### CI/CD Pipeline

**On Every Push/PR:**
1. Lint & Type Check
2. Unit Tests (with coverage)
3. E2E Tests (all browsers)
4. Security Audit
5. Build Verification

**On Main/Develop Push:**
- All above tests
- Load Tests
- Deployment (if tests pass)

**Weekly (Mondays 2 AM):**
- Chaos Engineering Tests
- Create issue if failures detected

### Pre-Release Checklist

Before releasing to production:

- [ ] All unit tests passing (80%+ coverage)
- [ ] All E2E tests passing (all browsers)
- [ ] Load tests meet performance thresholds
- [ ] Chaos tests show >70% recovery rate
- [ ] Security audit clean
- [ ] Build successful
- [ ] Smoke tests on staging passed

## Best Practices

### Writing Good Tests

1. **Follow AAA Pattern**
   - Arrange: Set up test data
   - Act: Execute the code
   - Assert: Verify results

2. **Test Behavior, Not Implementation**
   - Focus on what the code does
   - Don't test internal details
   - Make tests resilient to refactoring

3. **Keep Tests Independent**
   - Each test should run in isolation
   - No shared state between tests
   - Use beforeEach/afterEach for setup/teardown

4. **Use Descriptive Names**
   ```typescript
   // ❌ Bad
   it('works', () => {});
   
   // ✅ Good
   it('should create project with valid name', () => {});
   ```

5. **Test Edge Cases**
   - Empty inputs
   - Null/undefined values
   - Boundary conditions
   - Error scenarios

### E2E Test Best Practices

1. **Use Data Attributes**
   ```tsx
   <button data-testid="submit-button">Submit</button>
   ```

2. **Avoid Hardcoded Waits**
   ```typescript
   // ❌ Bad
   await page.waitForTimeout(5000);
   
   // ✅ Good
   await page.waitForSelector('[data-testid="result"]');
   ```

3. **Clean Up Test Data**
   - Delete created resources
   - Reset database state
   - Clear cookies/storage

### Load Test Best Practices

1. **Start Small, Scale Up**
   - Begin with low load
   - Gradually increase
   - Find breaking point

2. **Monitor System Resources**
   - CPU usage
   - Memory usage
   - Database connections
   - Network I/O

3. **Test Realistic Scenarios**
   - Simulate actual user behavior
   - Include think time
   - Mix different operations

### Chaos Test Best Practices

1. **Start in Test Environment**
   - Never run chaos tests in production initially
   - Validate in staging first
   - Gradually increase chaos intensity

2. **Have Rollback Plan**
   - Know how to stop tests
   - Have recovery procedures
   - Monitor system health

3. **Document Findings**
   - Record failure patterns
   - Note recovery times
   - Track improvements over time

## Test Data Management

### Test Database

- Use separate database for testing
- Seed with realistic data
- Reset between test runs

### Mock Data

```typescript
// tests/mocks/project.ts
export const mockProject = {
  id: 1,
  name: 'Test Project',
  description: 'Test Description',
  createdAt: new Date('2025-01-01'),
};
```

### Fixtures

```typescript
// e2e/fixtures/auth.ts
export async function loginAsAdmin(page) {
  await page.goto('/login');
  await page.fill('[name="email"]', 'admin@test.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
}
```

## Debugging Tests

### Unit Tests

```bash
# Run specific test file
pnpm test tests/utils.test.ts

# Run tests matching pattern
pnpm test --grep "formatDate"

# Debug mode
pnpm test --inspect-brk
```

### E2E Tests

```bash
# Debug mode
playwright test --debug

# Headed mode (see browser)
playwright test --headed

# Specific test
playwright test e2e/auth.spec.ts

# Generate trace
playwright test --trace on
```

### Load Tests

```bash
# Verbose output
k6 run --verbose load-tests/api-load-test.js

# Lower VUs for debugging
k6 run --vus 1 --duration 30s load-tests/api-load-test.js

# Output to file
k6 run load-tests/api-load-test.js > results.txt
```

## Continuous Improvement

### Metrics to Track

1. **Test Coverage**
   - Line coverage
   - Branch coverage
   - Function coverage

2. **Test Execution Time**
   - Unit tests: < 2 minutes
   - E2E tests: < 10 minutes
   - Load tests: < 15 minutes

3. **Flaky Tests**
   - Track failure rate
   - Identify unstable tests
   - Fix or remove flaky tests

4. **Bug Detection Rate**
   - Bugs caught by tests
   - Bugs found in production
   - Test effectiveness

### Regular Reviews

- **Weekly:** Review failed tests, update flaky tests
- **Monthly:** Review test coverage, add missing tests
- **Quarterly:** Review testing strategy, update thresholds

## Resources

### Documentation

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [k6 Documentation](https://k6.io/docs/)
- [Testing Library](https://testing-library.com/)

### Tools

- [Playwright Inspector](https://playwright.dev/docs/inspector)
- [k6 Cloud](https://k6.io/cloud/)
- [Codecov](https://codecov.io/)

### Further Reading

- [Testing Best Practices](https://testingjavascript.com/)
- [Chaos Engineering Principles](https://principlesofchaos.org/)
- [Google Testing Blog](https://testing.googleblog.com/)

## Support

For questions or issues with testing:

1. Check this documentation
2. Review test examples in codebase
3. Consult framework documentation
4. Ask team members
5. Create issue in repository

---

**Last Updated:** January 31, 2025
**Maintained By:** Project Catalyst Team
