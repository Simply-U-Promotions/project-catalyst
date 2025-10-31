import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// Custom metrics
const projectCreations = new Counter('project_creations');
const deploymentRequests = new Counter('deployment_requests');
const errorRate = new Rate('errors');
const userSessionDuration = new Trend('user_session_duration');

// Spike test configuration - simulates sudden traffic spikes
export const options = {
  scenarios: {
    // Scenario 1: Constant load
    constant_load: {
      executor: 'constant-vus',
      vus: 20,
      duration: '2m',
    },
    // Scenario 2: Ramping load
    ramping_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '1m', target: 0 },
      ],
      startTime: '2m', // Start after constant load
    },
    // Scenario 3: Spike test
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 200 }, // Sudden spike
        { duration: '30s', target: 200 }, // Hold spike
        { duration: '10s', target: 0 },   // Drop
      ],
      startTime: '5m', // Start after ramping load
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.1'],
    errors: ['rate<0.15'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const sessionStart = Date.now();
  
  group('User Session Flow', function () {
    // 1. Visit homepage
    group('Homepage Visit', function () {
      const homeRes = http.get(`${BASE_URL}/`);
      
      check(homeRes, {
        'homepage loads': (r) => r.status === 200,
      }) || errorRate.add(1);
      
      sleep(Math.random() * 2 + 1); // Random sleep 1-3s
    });

    // 2. Navigate to dashboard
    group('Dashboard Access', function () {
      const dashRes = http.get(`${BASE_URL}/dashboard`);
      
      check(dashRes, {
        'dashboard loads': (r) => r.status === 200 || r.status === 302, // May redirect to login
      }) || errorRate.add(1);
      
      sleep(Math.random() * 2 + 1);
    });

    // 3. Simulate project creation API call
    group('Project Creation', function () {
      const projectData = {
        name: `Test Project ${Date.now()}`,
        description: 'Load test project',
      };
      
      const createRes = http.post(
        `${BASE_URL}/api/trpc/projects.create`,
        JSON.stringify(projectData),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      const success = check(createRes, {
        'project creation attempted': (r) => r.status === 200 || r.status === 401,
      });
      
      if (success && createRes.status === 200) {
        projectCreations.add(1);
      } else {
        errorRate.add(1);
      }
      
      sleep(Math.random() * 3 + 2); // Random sleep 2-5s
    });

    // 4. Simulate deployment request
    group('Deployment Request', function () {
      const deployData = {
        projectId: 1,
        provider: 'catalyst',
      };
      
      const deployRes = http.post(
        `${BASE_URL}/api/trpc/deployments.create`,
        JSON.stringify(deployData),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      const success = check(deployRes, {
        'deployment request attempted': (r) => r.status === 200 || r.status === 401,
      });
      
      if (success && deployRes.status === 200) {
        deploymentRequests.add(1);
      } else {
        errorRate.add(1);
      }
      
      sleep(Math.random() * 2 + 1);
    });

    // 5. Check deployment status
    group('Deployment Status Check', function () {
      const statusRes = http.get(`${BASE_URL}/api/trpc/deployments.list`);
      
      check(statusRes, {
        'status check works': (r) => r.status === 200 || r.status === 401,
      }) || errorRate.add(1);
      
      sleep(1);
    });
  });

  // Record session duration
  const sessionDuration = Date.now() - sessionStart;
  userSessionDuration.add(sessionDuration);
  
  sleep(Math.random() * 5 + 2); // Random sleep between sessions
}

export function handleSummary(data) {
  console.log('\n=== Concurrent Users Load Test Summary ===\n');
  console.log(`Total VU iterations: ${data.metrics.iterations.values.count}`);
  console.log(`Total HTTP requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`Request rate: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s`);
  console.log(`\nProject creations attempted: ${data.metrics.project_creations.values.count}`);
  console.log(`Deployment requests attempted: ${data.metrics.deployment_requests.values.count}`);
  console.log(`\nError rate: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%`);
  console.log(`Failed requests: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%`);
  console.log(`\nResponse times:`);
  console.log(`  Average: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms`);
  console.log(`  p95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
  console.log(`  p99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms`);
  console.log(`  Max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms`);
  
  return {
    'concurrent-users-summary.json': JSON.stringify(data, null, 2),
  };
}
