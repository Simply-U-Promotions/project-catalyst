# Deployment Provider Integration Guide

## Overview

Project Catalyst supports multiple deployment providers, allowing users to deploy their applications to their preferred platform. This document provides setup instructions, testing procedures, and integration details for each provider.

## Supported Providers

### 1. Catalyst (Built-in)
**Status:** ✅ Fully Integrated

**Features:**
- Zero-configuration deployment
- Automatic authentication
- Real-time deployment logs
- Deployment history and rollback
- Custom domain support
- Environment variable management
- Database provisioning

**Setup:**
No setup required. Authentication is handled automatically through the platform.

**Testing:**
```bash
# Test deployment through UI
1. Navigate to project detail page
2. Click "Deploy to Catalyst" tab
3. Click "Deploy Now" button
4. Monitor real-time logs
5. Verify deployment status
```

---

### 2. Vercel
**Status:** ✅ UI Complete, API Integration Pending

**Required Credentials:**
- Vercel API Token (required)
- Team ID (optional, for team deployments)

**Setup Instructions:**
1. Go to [Vercel Account Tokens](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Name your token (e.g., "Project Catalyst")
4. Copy the generated token
5. In Project Catalyst:
   - Navigate to Project Settings → External Providers
   - Select "Vercel"
   - Click "Credentials" tab
   - Paste your token
   - Click "Verify Credentials"
   - Click "Save"

**API Integration:**
```typescript
// server/services/vercel.ts
import { Vercel } from '@vercel/sdk';

export async function deployToVercel(config: {
  token: string;
  projectName: string;
  files: Record<string, string>;
  teamId?: string;
}) {
  const vercel = new Vercel({ bearerToken: config.token });
  
  // Create deployment
  const deployment = await vercel.deployments.create({
    name: config.projectName,
    files: config.files,
    projectSettings: {
      framework: 'vite',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
    },
    target: 'production',
  });
  
  return deployment;
}
```

**Testing Checklist:**
- [ ] Token validation
- [ ] Project creation
- [ ] File upload
- [ ] Build trigger
- [ ] Deployment status polling
- [ ] Custom domain configuration
- [ ] Environment variables sync

---

### 3. Netlify
**Status:** ✅ UI Complete, API Integration Pending

**Required Credentials:**
- Netlify Personal Access Token (required)

**Setup Instructions:**
1. Go to [Netlify User Applications](https://app.netlify.com/user/applications#personal-access-tokens)
2. Click "New access token"
3. Name your token (e.g., "Project Catalyst")
4. Copy the generated token
5. In Project Catalyst:
   - Navigate to Project Settings → External Providers
   - Select "Netlify"
   - Click "Credentials" tab
   - Paste your token
   - Click "Verify Credentials"
   - Click "Save"

**API Integration:**
```typescript
// server/services/netlify.ts
import { NetlifyAPI } from 'netlify';

export async function deployToNetlify(config: {
  token: string;
  siteName: string;
  files: Record<string, Buffer>;
}) {
  const client = new NetlifyAPI(config.token);
  
  // Create site
  const site = await client.createSite({
    body: {
      name: config.siteName,
      custom_domain: `${config.siteName}.netlify.app`,
    },
  });
  
  // Deploy files
  const deploy = await client.createSiteDeploy({
    site_id: site.id,
    body: {
      files: config.files,
    },
  });
  
  return { site, deploy };
}
```

**Testing Checklist:**
- [ ] Token validation
- [ ] Site creation
- [ ] File upload
- [ ] Build configuration
- [ ] Deployment status polling
- [ ] Custom domain setup
- [ ] Environment variables sync

---

### 4. Railway
**Status:** ✅ UI Complete, API Integration Pending

**Required Credentials:**
- Railway API Token (required)
- Project ID (optional, creates new project if not provided)

**Setup Instructions:**
1. Go to [Railway Account Tokens](https://railway.app/account/tokens)
2. Click "Create Token"
3. Name your token (e.g., "Project Catalyst")
4. Copy the generated token
5. In Project Catalyst:
   - Navigate to Project Settings → External Providers
   - Select "Railway"
   - Click "Credentials" tab
   - Paste your token
   - Optionally add Project ID
   - Click "Verify Credentials"
   - Click "Save"

**API Integration:**
```typescript
// server/services/railway.ts
import axios from 'axios';

const RAILWAY_API = 'https://backboard.railway.app/graphql/v2';

export async function deployToRailway(config: {
  token: string;
  projectName: string;
  repoUrl: string;
  projectId?: string;
}) {
  const headers = {
    Authorization: `Bearer ${config.token}`,
    'Content-Type': 'application/json',
  };
  
  // Create or use existing project
  const projectId = config.projectId || await createProject(config.projectName, headers);
  
  // Create service from GitHub repo
  const mutation = `
    mutation {
      serviceCreate(input: {
        projectId: "${projectId}"
        source: {
          repo: "${config.repoUrl}"
        }
      }) {
        id
        name
      }
    }
  `;
  
  const response = await axios.post(RAILWAY_API, { query: mutation }, { headers });
  return response.data;
}
```

**Testing Checklist:**
- [ ] Token validation
- [ ] Project creation
- [ ] Service deployment
- [ ] Build logs streaming
- [ ] Deployment status polling
- [ ] Environment variables sync
- [ ] Database provisioning

---

### 5. Render
**Status:** ✅ UI Complete, API Integration Pending

**Required Credentials:**
- Render API Key (required)

**Setup Instructions:**
1. Go to [Render API Keys](https://dashboard.render.com/account/api-keys)
2. Click "Create API Key"
3. Name your key (e.g., "Project Catalyst")
4. Copy the generated key
5. In Project Catalyst:
   - Navigate to Project Settings → External Providers
   - Select "Render"
   - Click "Credentials" tab
   - Paste your API key
   - Click "Verify Credentials"
   - Click "Save"

**API Integration:**
```typescript
// server/services/render.ts
import axios from 'axios';

const RENDER_API = 'https://api.render.com/v1';

export async function deployToRender(config: {
  apiKey: string;
  serviceName: string;
  repoUrl: string;
  branch?: string;
}) {
  const headers = {
    Authorization: `Bearer ${config.apiKey}`,
    'Content-Type': 'application/json',
  };
  
  // Create web service
  const response = await axios.post(
    `${RENDER_API}/services`,
    {
      type: 'web_service',
      name: config.serviceName,
      repo: config.repoUrl,
      branch: config.branch || 'main',
      autoDeploy: 'yes',
      serviceDetails: {
        env: 'node',
        buildCommand: 'npm install && npm run build',
        startCommand: 'npm start',
      },
    },
    { headers }
  );
  
  return response.data;
}
```

**Testing Checklist:**
- [ ] API key validation
- [ ] Service creation
- [ ] Build configuration
- [ ] Deployment trigger
- [ ] Status polling
- [ ] Environment variables sync
- [ ] Custom domain setup

---

## Integration Architecture

### Provider Service Pattern

All provider integrations follow a consistent pattern:

```typescript
// server/services/providers/base.ts
export interface DeploymentProvider {
  name: string;
  validateCredentials(credentials: Record<string, string>): Promise<boolean>;
  deploy(config: DeploymentConfig): Promise<DeploymentResult>;
  getStatus(deploymentId: string): Promise<DeploymentStatus>;
  getLogs(deploymentId: string): Promise<string[]>;
  rollback(deploymentId: string): Promise<void>;
}

export interface DeploymentConfig {
  projectName: string;
  files?: Record<string, string | Buffer>;
  repoUrl?: string;
  branch?: string;
  buildCommand?: string;
  startCommand?: string;
  envVars?: Record<string, string>;
}

export interface DeploymentResult {
  id: string;
  url: string;
  status: 'pending' | 'building' | 'ready' | 'error';
  provider: string;
}

export interface DeploymentStatus {
  status: 'pending' | 'building' | 'ready' | 'error';
  progress?: number;
  message?: string;
  url?: string;
}
```

### Database Schema

```typescript
// drizzle/schema.ts - Provider credentials table
export const providerCredentials = mysqlTable("provider_credentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id),
  provider: varchar("provider", { length: 50 }).notNull(), // 'vercel', 'netlify', etc.
  credentials: text("credentials").notNull(), // Encrypted JSON
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// External deployments table
export const externalDeployments = mysqlTable("external_deployments", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull().references(() => projects.id),
  provider: varchar("provider", { length: 50 }).notNull(),
  deploymentId: varchar("deployment_id", { length: 255 }).notNull(),
  url: text("url"),
  status: varchar("status", { length: 50 }).notNull(),
  logs: text("logs"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
```

---

## Testing Strategy

### Manual Testing

1. **Credential Validation**
   - Test with valid credentials → should show "Verified" badge
   - Test with invalid credentials → should show error message
   - Test with missing required fields → should disable verify button

2. **Deployment Flow**
   - Select provider
   - Configure deployment settings
   - Verify credentials are loaded
   - Trigger deployment
   - Monitor real-time logs
   - Verify deployment URL is accessible

3. **Error Handling**
   - Test with expired tokens
   - Test with insufficient permissions
   - Test with rate limiting
   - Test with network failures

### Automated Testing

```typescript
// server/__tests__/providers.test.ts
describe('Provider Integrations', () => {
  describe('Vercel', () => {
    it('should validate credentials', async () => {
      const result = await vercelProvider.validateCredentials({
        vercel_token: 'valid_token',
      });
      expect(result).toBe(true);
    });

    it('should deploy project', async () => {
      const result = await vercelProvider.deploy({
        projectName: 'test-project',
        files: { 'index.html': '<html>Test</html>' },
      });
      expect(result.status).toBe('pending');
      expect(result.url).toBeDefined();
    });
  });

  // Similar tests for other providers
});
```

---

## Security Considerations

### Credential Storage

- All credentials are encrypted using AES-256-GCM before storage
- Encryption keys are stored in environment variables, never in code
- Credentials are decrypted only when needed for API calls
- Credentials are never exposed in logs or UI

### API Key Permissions

Each provider requires specific permissions:

**Vercel:**
- `deployments:write` - Create and manage deployments
- `projects:write` - Create and manage projects

**Netlify:**
- `sites:write` - Create and manage sites
- `deploys:write` - Create and manage deployments

**Railway:**
- `projects:write` - Create and manage projects
- `services:write` - Deploy services

**Render:**
- `services:write` - Create and manage services
- `deploys:write` - Trigger deployments

---

## Rate Limiting

Each provider has different rate limits:

| Provider | Rate Limit | Notes |
|----------|-----------|-------|
| Vercel | 100 req/min | Per token |
| Netlify | 500 req/hour | Per account |
| Railway | 1000 req/hour | Per token |
| Render | 100 req/min | Per API key |

Implement exponential backoff for rate limit errors:

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## Monitoring & Logging

### Deployment Events

Log all deployment events for debugging and analytics:

```typescript
export const deploymentEvents = mysqlTable("deployment_events", {
  id: int("id").autoincrement().primaryKey(),
  deploymentId: int("deployment_id").notNull(),
  provider: varchar("provider", { length: 50 }).notNull(),
  event: varchar("event", { length: 100 }).notNull(), // 'started', 'building', 'completed', 'failed'
  message: text("message"),
  metadata: text("metadata"), // JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### Metrics to Track

- Deployment success rate per provider
- Average deployment time per provider
- API error rates
- Credential validation failures
- User adoption per provider

---

## Future Enhancements

### Phase 2 (Q1 2026)
- [ ] Add Cloudflare Pages support
- [ ] Add AWS Amplify support
- [ ] Add DigitalOcean App Platform support
- [ ] Implement deployment webhooks
- [ ] Add deployment preview URLs

### Phase 3 (Q2 2026)
- [ ] Multi-region deployments
- [ ] A/B testing support
- [ ] Canary deployments
- [ ] Automatic rollback on errors
- [ ] Cost comparison across providers

---

## Support & Resources

### Documentation Links
- [Vercel API Docs](https://vercel.com/docs/rest-api)
- [Netlify API Docs](https://docs.netlify.com/api/get-started/)
- [Railway API Docs](https://docs.railway.app/reference/public-api)
- [Render API Docs](https://render.com/docs/api)

### Troubleshooting

**Common Issues:**

1. **"Invalid credentials" error**
   - Verify token hasn't expired
   - Check token permissions
   - Ensure token is for correct account

2. **"Deployment failed" error**
   - Check build logs for errors
   - Verify build command is correct
   - Ensure all dependencies are listed

3. **"Rate limit exceeded" error**
   - Wait for rate limit window to reset
   - Consider upgrading provider plan
   - Implement request queuing

---

## Conclusion

This multi-provider deployment system gives users flexibility to choose their preferred platform while maintaining a consistent deployment experience. The modular architecture makes it easy to add new providers in the future.

For questions or issues, contact the development team or open an issue on GitHub.
