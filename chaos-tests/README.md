# Chaos Engineering Tests

Chaos engineering tests validate the resilience and fault tolerance of Project Catalyst by intentionally introducing failures and observing system behavior.

## Overview

These tests simulate real-world failure scenarios to ensure the system:
- Gracefully handles errors
- Recovers from failures
- Maintains acceptable performance under stress
- Provides meaningful error messages
- Implements proper retry logic

## Test Scenarios

### 1. Database Connection Chaos
**Purpose:** Validate database connection pool handling and recovery

**Simulates:**
- Rapid sequential database requests
- Connection pool exhaustion
- Database connection failures

**Success Criteria:**
- System handles connection pool stress
- Proper error messages on database failures
- Automatic recovery after connection restored
- p95 response time < 2000ms

### 2. Network Latency Chaos
**Purpose:** Test timeout handling and graceful degradation

**Simulates:**
- Network latency and slow responses
- Timeout scenarios
- Intermittent connectivity

**Success Criteria:**
- Requests complete within timeout limits
- Graceful handling of slow responses
- No cascading failures
- p95 response time < 3000ms

### 3. Resource Exhaustion
**Purpose:** Validate behavior under extreme load

**Simulates:**
- High concurrent request volume
- Memory pressure
- CPU saturation

**Success Criteria:**
- Rate limiting activates appropriately
- System returns 429 or 503 under overload
- Recovery after load decreases
- p95 response time < 5000ms
- Error recovery rate > 70%

## Running Chaos Tests

### Prerequisites

1. Install k6:
```bash
# macOS
brew install k6

# Linux
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
choco install k6
```

2. Ensure the application is running:
```bash
pnpm dev
```

### Execute Tests

**Run all chaos scenarios:**
```bash
k6 run chaos-tests/chaos-scenarios.js
```

**Run specific scenario:**
```bash
# Database chaos
k6 run --env SCENARIO=db_chaos chaos-tests/chaos-scenarios.js

# Network chaos
k6 run --env SCENARIO=network_chaos chaos-tests/chaos-scenarios.js

# Resource exhaustion
k6 run --env SCENARIO=resource_chaos chaos-tests/chaos-scenarios.js
```

**Run against different environment:**
```bash
k6 run --env BASE_URL=https://staging.example.com chaos-tests/chaos-scenarios.js
```

## Interpreting Results

### Key Metrics

1. **Error Recovery Rate**
   - Target: > 70%
   - Measures system's ability to recover from failures
   - Higher is better

2. **Response Time under Chaos**
   - DB Chaos: p95 < 2000ms
   - Network Chaos: p95 < 3000ms
   - Resource Chaos: p95 < 5000ms

3. **Failed Request Rate**
   - Target: < 15% (some failures expected under chaos)
   - Measures graceful degradation

### Success Indicators

✅ **Good Resilience:**
- Error recovery rate > 70%
- Majority of requests succeed or fail gracefully (429/503)
- System recovers quickly after stress removed
- Meaningful error messages returned

⚠️ **Needs Improvement:**
- Error recovery rate < 50%
- Cascading failures observed
- System doesn't recover after stress
- Silent failures or crashes

## Best Practices

### Before Running Chaos Tests

1. **Backup Data:** Ensure you have recent backups
2. **Use Test Environment:** Don't run against production initially
3. **Monitor Resources:** Watch CPU, memory, disk during tests
4. **Alert Team:** Notify team members before chaos testing

### During Tests

1. **Monitor Logs:** Watch application logs for errors
2. **Check Metrics:** Monitor system metrics (CPU, memory, connections)
3. **Observe Behavior:** Note how system responds to failures
4. **Document Issues:** Record any unexpected behavior

### After Tests

1. **Analyze Results:** Review k6 output and metrics
2. **Identify Weaknesses:** Find areas that failed to recover
3. **Implement Fixes:** Address resilience gaps
4. **Retest:** Verify fixes with another chaos test run

## Common Failure Patterns

### Pattern 1: Connection Pool Exhaustion
**Symptom:** Requests timeout or fail after sustained load

**Solution:**
- Increase connection pool size
- Implement connection pooling best practices
- Add request queuing

### Pattern 2: Cascading Failures
**Symptom:** One failure triggers multiple component failures

**Solution:**
- Implement circuit breakers
- Add proper error boundaries
- Use bulkheads to isolate failures

### Pattern 3: Slow Recovery
**Symptom:** System takes long time to recover after stress

**Solution:**
- Implement health checks
- Add automatic service restart
- Improve resource cleanup

### Pattern 4: Silent Failures
**Symptom:** Requests fail without proper error messages

**Solution:**
- Add comprehensive error handling
- Implement proper logging
- Return meaningful HTTP status codes

## Integration with CI/CD

Add chaos tests to your CI/CD pipeline:

```yaml
# .github/workflows/chaos-tests.yml
name: Chaos Engineering Tests

on:
  schedule:
    - cron: '0 2 * * 1' # Run weekly on Mondays at 2 AM
  workflow_dispatch: # Allow manual trigger

jobs:
  chaos-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install k6
        run: |
          sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      
      - name: Start application
        run: pnpm dev &
        
      - name: Wait for application
        run: sleep 30
      
      - name: Run chaos tests
        run: k6 run chaos-tests/chaos-scenarios.js
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: chaos-test-results
          path: chaos-test-summary.json
```

## Recommended Schedule

- **Daily:** Basic resilience tests (5 minutes)
- **Weekly:** Full chaos test suite (15-20 minutes)
- **Before Major Releases:** Comprehensive chaos testing
- **After Infrastructure Changes:** Targeted chaos tests

## Further Reading

- [Principles of Chaos Engineering](https://principlesofchaos.org/)
- [Netflix Chaos Monkey](https://netflix.github.io/chaosmonkey/)
- [k6 Documentation](https://k6.io/docs/)
- [Site Reliability Engineering](https://sre.google/books/)
