# Project Catalyst Public API

## Overview

The Project Catalyst Public API enables programmatic access to all platform features, allowing you to build custom integrations, automation workflows, and third-party applications.

**Base URL:** `https://api.catalyst.app/v1`

## Authentication

All API requests require authentication using an API token. Generate tokens in your dashboard under Settings → API Keys.

### Authentication Methods

#### Bearer Token (Recommended)

```bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
  https://api.catalyst.app/v1/projects
```

#### API Key Header

```bash
curl -H "X-API-Key: YOUR_API_TOKEN" \
  https://api.catalyst.app/v1/projects
```

## Rate Limiting

- **Free Tier:** 100 requests/minute, 10,000 requests/day
- **Pro Tier:** 1,000 requests/minute, 100,000 requests/day
- **Enterprise:** Custom limits

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1635724800
```

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Project name is required",
    "details": {
      "field": "name",
      "constraint": "required"
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing API token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `INVALID_REQUEST` | 400 | Invalid request parameters |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## Endpoints

### Projects

#### List Projects

```http
GET /v1/projects
```

**Query Parameters:**
- `page` (integer) - Page number (default: 1)
- `limit` (integer) - Items per page (default: 20, max: 100)
- `status` (string) - Filter by status (draft, ready, deployed, failed)

**Response:**

```json
{
  "data": [
    {
      "id": "proj_abc123",
      "name": "My App",
      "description": "A SaaS application",
      "status": "deployed",
      "templateId": "saas",
      "deploymentUrl": "https://my-app.catalyst.app",
      "githubRepoUrl": "https://github.com/user/my-app",
      "createdAt": "2025-10-30T12:00:00Z",
      "updatedAt": "2025-10-30T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Create Project

```http
POST /v1/projects
```

**Request Body:**

```json
{
  "name": "My New App",
  "description": "Description of my app",
  "templateId": "saas",
  "initialPrompt": "Build a SaaS app with user authentication"
}
```

**Response:**

```json
{
  "id": "proj_xyz789",
  "name": "My New App",
  "status": "generating",
  "createdAt": "2025-10-30T15:00:00Z"
}
```

#### Get Project

```http
GET /v1/projects/{projectId}
```

**Response:**

```json
{
  "id": "proj_abc123",
  "name": "My App",
  "description": "A SaaS application",
  "status": "deployed",
  "templateId": "saas",
  "deploymentUrl": "https://my-app.catalyst.app",
  "githubRepoUrl": "https://github.com/user/my-app",
  "files": [
    {
      "path": "src/App.tsx",
      "language": "typescript",
      "size": 1024
    }
  ],
  "createdAt": "2025-10-30T12:00:00Z",
  "updatedAt": "2025-10-30T14:30:00Z"
}
```

#### Update Project

```http
PATCH /v1/projects/{projectId}
```

**Request Body:**

```json
{
  "name": "Updated App Name",
  "description": "Updated description"
}
```

#### Delete Project

```http
DELETE /v1/projects/{projectId}
```

**Response:**

```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

### Code Generation

#### Generate Code

```http
POST /v1/projects/{projectId}/generate
```

**Request Body:**

```json
{
  "prompt": "Add user authentication with email and password",
  "context": "This is a SaaS application built with React and Express"
}
```

**Response:**

```json
{
  "jobId": "job_abc123",
  "status": "processing",
  "estimatedTime": 30
}
```

#### Get Generation Status

```http
GET /v1/jobs/{jobId}
```

**Response:**

```json
{
  "id": "job_abc123",
  "status": "completed",
  "progress": 100,
  "result": {
    "filesGenerated": 12,
    "filesModified": 3,
    "summary": "Added authentication system with JWT tokens"
  },
  "createdAt": "2025-10-30T15:00:00Z",
  "completedAt": "2025-10-30T15:00:45Z"
}
```

### Deployments

#### List Deployments

```http
GET /v1/projects/{projectId}/deployments
```

**Response:**

```json
{
  "data": [
    {
      "id": "deploy_abc123",
      "projectId": "proj_abc123",
      "environment": "production",
      "status": "running",
      "url": "https://my-app.catalyst.app",
      "commit": "abc123def456",
      "branch": "main",
      "createdAt": "2025-10-30T14:00:00Z"
    }
  ]
}
```

#### Create Deployment

```http
POST /v1/projects/{projectId}/deployments
```

**Request Body:**

```json
{
  "environment": "production",
  "branch": "main",
  "envVars": {
    "NODE_ENV": "production",
    "API_KEY": "secret123"
  }
}
```

**Response:**

```json
{
  "id": "deploy_xyz789",
  "status": "building",
  "url": "https://my-app.catalyst.app",
  "logsUrl": "https://api.catalyst.app/v1/deployments/deploy_xyz789/logs"
}
```

#### Get Deployment

```http
GET /v1/deployments/{deploymentId}
```

#### Get Deployment Logs

```http
GET /v1/deployments/{deploymentId}/logs
```

**Query Parameters:**
- `follow` (boolean) - Stream logs in real-time
- `tail` (integer) - Number of lines to return
- `since` (string) - Timestamp to start from

**Response:**

```json
{
  "logs": [
    {
      "timestamp": "2025-10-30T14:00:15Z",
      "level": "info",
      "message": "Building application..."
    },
    {
      "timestamp": "2025-10-30T14:00:30Z",
      "level": "info",
      "message": "Build completed successfully"
    }
  ]
}
```

#### Stop Deployment

```http
POST /v1/deployments/{deploymentId}/stop
```

#### Restart Deployment

```http
POST /v1/deployments/{deploymentId}/restart
```

#### Rollback Deployment

```http
POST /v1/deployments/{deploymentId}/rollback
```

**Request Body:**

```json
{
  "targetDeploymentId": "deploy_abc123"
}
```

### Environment Variables

#### List Environment Variables

```http
GET /v1/projects/{projectId}/env
```

**Query Parameters:**
- `environment` (string) - Filter by environment

**Response:**

```json
{
  "data": [
    {
      "key": "DATABASE_URL",
      "value": "postgres://...",
      "isSecret": true,
      "environment": "production",
      "createdAt": "2025-10-30T12:00:00Z"
    }
  ]
}
```

#### Set Environment Variable

```http
POST /v1/projects/{projectId}/env
```

**Request Body:**

```json
{
  "key": "API_KEY",
  "value": "secret123",
  "isSecret": true,
  "environment": "production"
}
```

#### Delete Environment Variable

```http
DELETE /v1/projects/{projectId}/env/{key}
```

### Databases

#### List Databases

```http
GET /v1/databases
```

**Response:**

```json
{
  "data": [
    {
      "id": "db_abc123",
      "projectId": "proj_abc123",
      "type": "postgresql",
      "name": "my-app-db",
      "host": "db.catalyst.app",
      "port": 5432,
      "status": "active",
      "size": "medium",
      "createdAt": "2025-10-30T12:00:00Z"
    }
  ]
}
```

#### Create Database

```http
POST /v1/databases
```

**Request Body:**

```json
{
  "projectId": "proj_abc123",
  "type": "postgresql",
  "name": "my-app-db",
  "size": "medium"
}
```

#### Get Database

```http
GET /v1/databases/{databaseId}
```

**Response:**

```json
{
  "id": "db_abc123",
  "connectionString": "postgresql://user:pass@host:5432/dbname",
  "credentials": {
    "host": "db.catalyst.app",
    "port": 5432,
    "username": "user_abc123",
    "password": "secret_password",
    "database": "db_abc123"
  }
}
```

#### Create Backup

```http
POST /v1/databases/{databaseId}/backups
```

#### List Backups

```http
GET /v1/databases/{databaseId}/backups
```

#### Restore Backup

```http
POST /v1/databases/{databaseId}/restore
```

**Request Body:**

```json
{
  "backupId": "backup_abc123"
}
```

### Webhooks

#### List Webhooks

```http
GET /v1/webhooks
```

#### Create Webhook

```http
POST /v1/webhooks
```

**Request Body:**

```json
{
  "url": "https://example.com/webhook",
  "events": ["deployment.created", "deployment.completed", "deployment.failed"],
  "secret": "webhook_secret_123"
}
```

**Response:**

```json
{
  "id": "webhook_abc123",
  "url": "https://example.com/webhook",
  "events": ["deployment.created", "deployment.completed", "deployment.failed"],
  "createdAt": "2025-10-30T15:00:00Z"
}
```

#### Delete Webhook

```http
DELETE /v1/webhooks/{webhookId}
```

### Webhook Events

Webhooks receive POST requests with the following structure:

```json
{
  "event": "deployment.completed",
  "timestamp": "2025-10-30T15:00:00Z",
  "data": {
    "deploymentId": "deploy_abc123",
    "projectId": "proj_abc123",
    "status": "running",
    "url": "https://my-app.catalyst.app"
  }
}
```

**Available Events:**
- `project.created`
- `project.updated`
- `project.deleted`
- `deployment.created`
- `deployment.building`
- `deployment.completed`
- `deployment.failed`
- `deployment.stopped`
- `database.created`
- `database.deleted`
- `backup.created`
- `backup.completed`

### Usage & Billing

#### Get Usage Statistics

```http
GET /v1/usage
```

**Query Parameters:**
- `startDate` (string) - Start date (ISO 8601)
- `endDate` (string) - End date (ISO 8601)

**Response:**

```json
{
  "period": {
    "start": "2025-10-01T00:00:00Z",
    "end": "2025-10-31T23:59:59Z"
  },
  "usage": {
    "aiTokens": 2400000,
    "codeGenerations": 45,
    "deployments": 32,
    "githubCommits": 128,
    "activeMinutes": 1850
  },
  "costs": {
    "aiCost": 4250,
    "deploymentCost": 2100,
    "databaseCost": 1850,
    "totalCost": 8200
  }
}
```

#### Get Cost Alerts

```http
GET /v1/cost-alerts
```

#### Create Cost Alert

```http
POST /v1/cost-alerts
```

**Request Body:**

```json
{
  "alertType": "monthly",
  "threshold": 10000,
  "notificationMethod": "both"
}
```

## SDKs

### JavaScript/TypeScript

```bash
npm install @project-catalyst/sdk
```

```typescript
import { CatalystClient } from '@project-catalyst/sdk';

const client = new CatalystClient({
  apiKey: 'YOUR_API_TOKEN'
});

// List projects
const projects = await client.projects.list();

// Create deployment
const deployment = await client.deployments.create('proj_abc123', {
  environment: 'production',
  branch: 'main'
});

// Stream logs
client.deployments.streamLogs('deploy_abc123', (log) => {
  console.log(log.message);
});
```

### Python

```bash
pip install catalyst-sdk
```

```python
from catalyst import CatalystClient

client = CatalystClient(api_key='YOUR_API_TOKEN')

# List projects
projects = client.projects.list()

# Create deployment
deployment = client.deployments.create(
    project_id='proj_abc123',
    environment='production',
    branch='main'
)

# Get logs
logs = client.deployments.get_logs('deploy_abc123', tail=100)
```

### Go

```bash
go get github.com/project-catalyst/catalyst-go
```

```go
package main

import (
    "github.com/project-catalyst/catalyst-go"
)

func main() {
    client := catalyst.NewClient("YOUR_API_TOKEN")
    
    // List projects
    projects, err := client.Projects.List(nil)
    
    // Create deployment
    deployment, err := client.Deployments.Create("proj_abc123", &catalyst.DeploymentOptions{
        Environment: "production",
        Branch: "main",
    })
}
```

## Examples

### Complete Deployment Workflow

```bash
# 1. Create project
curl -X POST https://api.catalyst.app/v1/projects \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My App",
    "templateId": "saas",
    "initialPrompt": "Build a SaaS app"
  }'

# 2. Set environment variables
curl -X POST https://api.catalyst.app/v1/projects/proj_abc123/env \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "DATABASE_URL",
    "value": "postgres://...",
    "isSecret": true
  }'

# 3. Deploy
curl -X POST https://api.catalyst.app/v1/projects/proj_abc123/deployments \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "environment": "production",
    "branch": "main"
  }'

# 4. Monitor logs
curl https://api.catalyst.app/v1/deployments/deploy_xyz789/logs?follow=true \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

## Support

- API Documentation: https://docs.catalyst.app/api
- API Status: https://status.catalyst.app
- Support: api-support@catalyst.app

## Changelog

### v1.0.0 (2025-10-30)
- Initial public API release
- Support for projects, deployments, databases, webhooks
- Rate limiting and authentication
- SDKs for JavaScript, Python, Go
