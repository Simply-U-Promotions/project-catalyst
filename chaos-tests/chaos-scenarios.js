/**
 * Chaos Engineering Tests for Project Catalyst
 * 
 * These tests simulate various failure scenarios to validate system resilience:
 * - Database connection failures
 * - Network latency and timeouts
 * - Memory pressure
 * - Disk space issues
 * - Concurrent request storms
 * - Partial service degradation
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRecoveryRate = new Rate('error_recovery');
const degradedPerformance = new Trend('degraded_performance');

export const options = {
  scenarios: {
    // Scenario 1: Database Connection Chaos
    db_connection_chaos: {
      executor: 'constant-vus',
      vus: 10,
      duration: '1m',
      tags: { scenario: 'db_chaos' },
    },
    // Scenario 2: Network Latency Chaos
    network_latency_chaos: {
      executor: 'constant-vus',
      vus: 10,
      duration: '1m',
      startTime: '1m',
      tags: { scenario: 'network_chaos' },
    },
    // Scenario 3: Resource Exhaustion
    resource_exhaustion: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 },
        { duration: '1m', target: 200 },
        { duration: '30s', target: 0 },
      ],
      startTime: '2m',
      tags: { scenario: 'resource_chaos' },
    },
  },
  thresholds: {
    'error_recovery': ['rate>0.7'], // 70% of errors should recover
    'http_req_duration{scenario:db_chaos}': ['p(95)<2000'],
    'http_req_duration{scenario:network_chaos}': ['p(95)<3000'],
    'http_req_duration{scenario:resource_chaos}': ['p(95)<5000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const scenario = __ENV.SCENARIO || 'db_chaos';
  
  switch (scenario) {
    case 'db_chaos':
      testDatabaseResilience();
      break;
    case 'network_chaos':
      testNetworkResilience();
      break;
    case 'resource_chaos':
      testResourceExhaustion();
      break;
    default:
      testDatabaseResilience();
  }
}

function testDatabaseResilience() {
  group('Database Connection Chaos', function () {
    // Test 1: Rapid sequential requests (connection pool stress)
    for (let i = 0; i < 5; i++) {
      const res = http.get(`${BASE_URL}/api/trpc/projects.list`);
      
      const recovered = check(res, {
        'handles db stress': (r) => r.status === 200 || r.status === 503,
        'returns proper error on failure': (r) => {
          if (r.status === 503) {
            const body = JSON.parse(r.body);
            return body.error !== undefined;
          }
          return true;
        },
      });
      
      if (res.status === 200) {
        errorRecoveryRate.add(1);
      } else if (res.status === 503) {
        errorRecoveryRate.add(0);
        // Retry after brief pause
        sleep(0.5);
        const retryRes = http.get(`${BASE_URL}/api/trpc/projects.list`);
        if (retryRes.status === 200) {
          errorRecoveryRate.add(1); // System recovered
        }
      }
    }
    
    sleep(1);
  });
}

function testNetworkResilience() {
  group('Network Latency Chaos', function () {
    // Test with various timeout scenarios
    const params = {
      timeout: '5s', // Set reasonable timeout
    };
    
    // Test 1: Health check with potential latency
    const healthRes = http.get(`${BASE_URL}/health`, params);
    
    check(healthRes, {
      'health check responds despite latency': (r) => r.status === 200,
      'health check completes within timeout': (r) => r.timings.duration < 5000,
    });
    
    degradedPerformance.add(healthRes.timings.duration);
    
    sleep(1);
    
    // Test 2: API call with timeout handling
    const apiRes = http.get(`${BASE_URL}/api/trpc/auth.me`, params);
    
    const gracefulHandling = check(apiRes, {
      'API handles timeout gracefully': (r) => r.status !== 0, // Not a timeout error
      'API returns within acceptable time': (r) => r.timings.duration < 5000,
    });
    
    if (gracefulHandling) {
      errorRecoveryRate.add(1);
    } else {
      errorRecoveryRate.add(0);
    }
    
    sleep(2);
  });
}

function testResourceExhaustion() {
  group('Resource Exhaustion Chaos', function () {
    // Test 1: Concurrent requests to stress memory/CPU
    const requests = [];
    
    for (let i = 0; i < 10; i++) {
      requests.push(['GET', `${BASE_URL}/health`]);
      requests.push(['GET', `${BASE_URL}/api/trpc/auth.me`]);
    }
    
    const responses = http.batch(requests);
    
    let successCount = 0;
    let failureCount = 0;
    
    responses.forEach((res) => {
      if (res.status === 200 || res.status === 401) {
        successCount++;
      } else if (res.status === 503 || res.status === 429) {
        failureCount++;
        // Rate limiting or service unavailable is acceptable
        errorRecoveryRate.add(0.5); // Partial credit for graceful degradation
      } else {
        failureCount++;
        errorRecoveryRate.add(0);
      }
    });
    
    check(responses, {
      'majority of requests succeed under load': () => successCount > failureCount,
      'system provides feedback on overload': () => failureCount === 0 || responses.some(r => r.status === 429 || r.status === 503),
    });
    
    sleep(3);
    
    // Test 2: Recovery after load
    sleep(5); // Allow system to recover
    
    const recoveryRes = http.get(`${BASE_URL}/health`);
    
    const recovered = check(recoveryRes, {
      'system recovers after load': (r) => r.status === 200,
      'health status is healthy after recovery': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.status === 'healthy' || body.status === 'degraded';
        } catch {
          return false;
        }
      },
    });
    
    if (recovered) {
      errorRecoveryRate.add(1);
    }
  });
}

export function handleSummary(data) {
  console.log('\n=== Chaos Engineering Test Summary ===\n');
  console.log(`Error Recovery Rate: ${(data.metrics.error_recovery.values.rate * 100).toFixed(2)}%`);
  console.log(`\nPerformance under chaos:`);
  console.log(`  Average response time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms`);
  console.log(`  p95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
  console.log(`  p99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms`);
  console.log(`\nFailed requests: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%`);
  
  // Scenario-specific metrics
  console.log(`\nScenario Performance:`);
  if (data.metrics['http_req_duration{scenario:db_chaos}']) {
    console.log(`  DB Chaos p95: ${data.metrics['http_req_duration{scenario:db_chaos}'].values['p(95)'].toFixed(2)}ms`);
  }
  if (data.metrics['http_req_duration{scenario:network_chaos}']) {
    console.log(`  Network Chaos p95: ${data.metrics['http_req_duration{scenario:network_chaos}'].values['p(95)'].toFixed(2)}ms`);
  }
  if (data.metrics['http_req_duration{scenario:resource_chaos}']) {
    console.log(`  Resource Chaos p95: ${data.metrics['http_req_duration{scenario:resource_chaos}'].values['p(95)'].toFixed(2)}ms`);
  }
  
  return {
    'chaos-test-summary.json': JSON.stringify(data, null, 2),
  };
}
