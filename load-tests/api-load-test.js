import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiResponseTime = new Trend('api_response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '1m', target: 100 },  // Stay at 100 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.05'],   // Error rate should be less than 5%
    errors: ['rate<0.1'],             // Custom error rate should be less than 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test 1: Health Check Endpoint
  const healthRes = http.get(`${BASE_URL}/health`);
  
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
    'health check has status field': (r) => JSON.parse(r.body).status !== undefined,
  }) || errorRate.add(1);
  
  apiResponseTime.add(healthRes.timings.duration);
  sleep(1);

  // Test 2: Readiness Check
  const readyRes = http.get(`${BASE_URL}/health/ready`);
  
  check(readyRes, {
    'readiness check status is 200': (r) => r.status === 200,
    'service is ready': (r) => JSON.parse(r.body).ready === true,
  }) || errorRate.add(1);
  
  sleep(1);

  // Test 3: Liveness Check
  const liveRes = http.get(`${BASE_URL}/health/live`);
  
  check(liveRes, {
    'liveness check status is 200': (r) => r.status === 200,
    'service is alive': (r) => JSON.parse(r.body).alive === true,
  }) || errorRate.add(1);
  
  sleep(1);

  // Test 4: Homepage Load
  const homeRes = http.get(`${BASE_URL}/`);
  
  check(homeRes, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage loads in reasonable time': (r) => r.timings.duration < 2000,
  }) || errorRate.add(1);
  
  sleep(2);

  // Test 5: API Endpoint (tRPC)
  const apiRes = http.post(
    `${BASE_URL}/api/trpc/auth.me`,
    JSON.stringify({}),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  
  check(apiRes, {
    'API responds': (r) => r.status === 200 || r.status === 401, // 401 is expected for unauthenticated
    'API response time is acceptable': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);
  
  apiResponseTime.add(apiRes.timings.duration);
  sleep(1);
}

export function handleSummary(data) {
  return {
    'load-test-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;
  
  let summary = `\n${indent}Load Test Summary\n${indent}${'='.repeat(50)}\n\n`;
  
  // Test duration
  summary += `${indent}Test Duration: ${(data.state.testRunDurationMs / 1000).toFixed(2)}s\n\n`;
  
  // HTTP metrics
  if (data.metrics.http_reqs) {
    summary += `${indent}HTTP Requests:\n`;
    summary += `${indent}  Total: ${data.metrics.http_reqs.values.count}\n`;
    summary += `${indent}  Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s\n\n`;
  }
  
  // Response time
  if (data.metrics.http_req_duration) {
    summary += `${indent}Response Time:\n`;
    summary += `${indent}  Average: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
    summary += `${indent}  Median: ${data.metrics.http_req_duration.values.med.toFixed(2)}ms\n`;
    summary += `${indent}  p95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
    summary += `${indent}  p99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
    summary += `${indent}  Max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms\n\n`;
  }
  
  // Error rate
  if (data.metrics.http_req_failed) {
    const failedRate = (data.metrics.http_req_failed.values.rate * 100).toFixed(2);
    summary += `${indent}Error Rate: ${failedRate}%\n\n`;
  }
  
  // Thresholds
  summary += `${indent}Thresholds:\n`;
  for (const [name, threshold] of Object.entries(data.thresholds || {})) {
    const status = threshold.ok ? '✓ PASS' : '✗ FAIL';
    summary += `${indent}  ${status} ${name}\n`;
  }
  
  return summary;
}
