# Monitoring & Alerting Configuration

This document describes the monitoring and alerting setup for Project Catalyst.

## Health Check Endpoints

The application exposes three health check endpoints for monitoring:

### 1. General Health Check
```
GET /health
```

Returns comprehensive health status including:
- Overall status (healthy/degraded/unhealthy)
- Database connectivity and performance
- Memory usage
- Disk usage
- System uptime
- Application version

**Response Example:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-31T12:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "pass",
      "message": "Database is healthy",
      "responseTime": 45
    },
    "memory": {
      "status": "pass",
      "message": "Memory usage is normal",
      "details": {
        "heapUsed": "125.45 MB",
        "heapTotal": "256.00 MB",
        "heapUsagePercent": "49.00%"
      }
    },
    "disk": {
      "status": "pass",
      "message": "Disk check not implemented"
    }
  },
  "version": "1.0.0",
  "environment": "production"
}
```

### 2. Readiness Check
```
GET /health/ready
```

Determines if the service is ready to accept traffic. Checks:
- Database availability
- Database connectivity

**Use case:** Kubernetes readiness probes, load balancer health checks

### 3. Liveness Check
```
GET /health/live
```

Determines if the service process is alive and responding.

**Use case:** Kubernetes liveness probes, process monitoring

## Monitoring Integration

### Recommended Monitoring Tools

1. **Uptime Monitoring**
   - [UptimeRobot](https://uptimerobot.com/)
   - [Pingdom](https://www.pingdom.com/)
   - [Better Uptime](https://betteruptime.com/)

2. **Application Performance Monitoring (APM)**
   - [New Relic](https://newrelic.com/)
   - [Datadog](https://www.datadoghq.com/)
   - [Sentry](https://sentry.io/) (for error tracking)

3. **Infrastructure Monitoring**
   - [Prometheus](https://prometheus.io/) + [Grafana](https://grafana.com/)
   - [CloudWatch](https://aws.amazon.com/cloudwatch/) (for AWS deployments)

### Setting Up Uptime Monitoring

1. Create monitors for each health endpoint:
   - `/health` - Check every 5 minutes
   - `/health/ready` - Check every 1 minute
   - `/health/live` - Check every 1 minute

2. Configure alerts:
   - Email notifications for downtime
   - Slack/Discord webhooks for team notifications
   - SMS for critical alerts

### Setting Up Error Tracking (Sentry)

1. Install Sentry SDK:
```bash
pnpm add @sentry/node @sentry/react
```

2. Initialize in server (`server/_core/index.ts`):
```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

3. Initialize in client (`client/src/main.tsx`):
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

## Alert Configuration

### Critical Alerts (Immediate Response Required)

1. **Service Down**
   - Trigger: `/health/live` returns 503
   - Action: Immediate notification to on-call engineer
   - Channels: SMS, Phone call, Slack

2. **Database Unavailable**
   - Trigger: `/health/ready` returns 503
   - Action: Immediate notification
   - Channels: SMS, Slack

3. **High Error Rate**
   - Trigger: >5% of requests result in 5xx errors
   - Action: Immediate notification
   - Channels: Slack, Email

### Warning Alerts (Monitor and Investigate)

1. **Degraded Performance**
   - Trigger: `/health` returns status "degraded"
   - Action: Notification to team
   - Channels: Slack, Email

2. **High Memory Usage**
   - Trigger: Heap usage >80%
   - Action: Notification to team
   - Channels: Slack

3. **Slow Database Queries**
   - Trigger: Database response time >1000ms
   - Action: Notification to team
   - Channels: Slack

4. **High API Request Rate**
   - Trigger: Rate limit threshold reached frequently
   - Action: Review and potentially adjust limits
   - Channels: Email

## Metrics to Track

### Application Metrics

1. **Request Metrics**
   - Total requests per minute
   - Response time (p50, p95, p99)
   - Error rate (4xx, 5xx)
   - Request rate by endpoint

2. **Business Metrics**
   - Active users
   - Projects created
   - Deployments initiated
   - Code generations
   - API usage

3. **Performance Metrics**
   - Database query time
   - API response time
   - Build time
   - Deployment time

### System Metrics

1. **Resource Usage**
   - CPU utilization
   - Memory usage
   - Disk I/O
   - Network I/O

2. **Database Metrics**
   - Connection pool usage
   - Query performance
   - Slow query log
   - Database size

## Logging Strategy

### Log Levels

- **ERROR**: Application errors that need immediate attention
- **WARN**: Warning conditions that should be investigated
- **INFO**: General informational messages
- **DEBUG**: Detailed debugging information (development only)

### Structured Logging

Use structured logging format for better searchability:

```typescript
console.log(JSON.stringify({
  level: "info",
  timestamp: new Date().toISOString(),
  message: "User logged in",
  userId: user.id,
  email: user.email,
  ip: req.ip,
}));
```

### Log Aggregation

Recommended tools:
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Loki** + Grafana
- **CloudWatch Logs** (for AWS)
- **Datadog Logs**

## Dashboard Recommendations

### Key Dashboards to Create

1. **System Overview**
   - Service status
   - Request rate
   - Error rate
   - Response time
   - Active users

2. **Performance Dashboard**
   - API endpoint performance
   - Database query performance
   - Memory and CPU usage
   - Cache hit rates

3. **Business Metrics**
   - Daily/weekly/monthly active users
   - Projects created
   - Deployments
   - Revenue metrics (if applicable)

4. **Error Tracking**
   - Error rate over time
   - Top errors by frequency
   - Error distribution by endpoint
   - User-impacting errors

## Incident Response

### Runbook for Common Issues

1. **Service Down**
   - Check health endpoints
   - Review recent deployments
   - Check server logs
   - Verify database connectivity
   - Restart service if necessary

2. **High Memory Usage**
   - Check for memory leaks
   - Review recent code changes
   - Analyze heap dumps
   - Consider scaling up resources

3. **Database Connection Issues**
   - Verify database server status
   - Check connection pool settings
   - Review slow query log
   - Check for long-running transactions

## Security Monitoring

### Security Events to Monitor

1. **Authentication Failures**
   - Failed login attempts
   - Suspicious login patterns
   - Brute force attempts

2. **API Abuse**
   - Rate limit violations
   - Unusual API usage patterns
   - Suspicious user agents

3. **Data Access**
   - Unauthorized access attempts
   - Bulk data exports
   - Admin privilege escalation

## Cost Monitoring

Track cloud infrastructure costs:
- Database costs
- Compute costs
- Storage costs
- Network egress costs

Set up budget alerts to prevent unexpected bills.

## Compliance and Audit Logging

For GDPR and other compliance requirements:
- Log all data exports
- Log all account deletions
- Log all admin actions
- Retain logs for required period (typically 90 days to 1 year)

## Next Steps

1. Set up monitoring accounts (Sentry, UptimeRobot, etc.)
2. Configure alert channels (Slack, email, SMS)
3. Create monitoring dashboards
4. Set up log aggregation
5. Document incident response procedures
6. Schedule regular monitoring reviews
