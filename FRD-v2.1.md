# Functional Requirements Document (FRD)
## Project Catalyst - AI-Powered Development Platform

**Document Version:** 2.1  
**Date:** October 30, 2025  
**Prepared By:** Project Catalyst Engineering Team  
**Status:** Active Development

---

## Table of Contents
1. System Overview
2. Technical Architecture
3. Module Specifications
4. API Documentation
5. Security Requirements
6. Performance Requirements
7. Testing Strategy

---

## 1. System Overview

### 1.1 Technology Stack

**Frontend:**
- React 19
- TypeScript 5.3
- Tailwind CSS 4.0
- tRPC 11 (type-safe API client)
- Wouter (routing)
- shadcn/ui (component library)

**Backend:**
- Node.js 22
- Express 4
- tRPC 11 (API framework)
- Drizzle ORM
- MySQL/TiDB (database)

**Infrastructure:**
- **Platform Backend**: AWS Fargate / Google Cloud Run (serverless)
- **User Deployments**: Docker Engine (MVP) → Kubernetes (Year 2)
- **Reverse Proxy**: Traefik 2.10+
- **Build System**: Nixpacks

**External Services:**
- GitHub API (OAuth, repositories, PRs)
- OpenAI/Anthropic API (LLM)
- Manus Built-in APIs (LLM, storage, notifications)

### 1.2 System Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     Frontend (React + tRPC)                     │
│  Dashboard | Projects | Import | Deploy | Admin | Cost Monitor │
└──────────────────────────┬─────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌────────────────────────────────────────────────────────────────┐
│              Platform Backend (Serverless - Fargate)            │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Auth Module  │  │  AI Module   │  │ GitHub Module│        │
│  │ (OAuth, JWT) │  │ (Code Gen,   │  │ (Import, PR) │        │
│  └──────────────┘  │  Modify)     │  └──────────────┘        │
│                     └──────────────┘                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │Deploy Module │  │Security Module│  │ Cost Module  │        │
│  │(Docker API)  │  │(Prompt Inject)│  │(LLM Tracking)│        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└──────────────────────────┬─────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌─────────────┐  ┌──────────────────┐
│  MySQL/TiDB  │  │  LLM API    │  │ Docker Engine    │
│  (Metadata)  │  │  (OpenAI)   │  │ (User Containers)│
└──────────────┘  └─────────────┘  └──────────────────┘
```

**Key Architecture Decisions:**

1. **Serverless Platform Backend** (Critical Decision from Review)
   - **Why**: Avoid 10x DevOps burden of managing K8s for our own backend
   - **Benefit**: Focus on AI/DevEx, not infrastructure management
   - **Trade-off**: Less control, but massive operational simplification

2. **Docker for User Deployments** (MVP)
   - **Why**: Full control, industry-standard, simpler than K8s initially
   - **Future**: Migrate to Kubernetes when scale demands (Year 2, 2,000+ users)

3. **tRPC for API Layer**
   - **Why**: End-to-end type safety, no API documentation needed
   - **Benefit**: Faster development, fewer runtime errors

---

## 2. Module Specifications

### Module 1: Authentication & Authorization

**Requirements:**
- OAuth integration with Manus platform
- JWT-based session management
- Role-based access control (admin, user)
- GitHub OAuth for repository access

**Database Schema:**
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**API Endpoints:**
```typescript
auth.me.useQuery() → User | null
auth.logout.useMutation() → { success: boolean }
```

---

### Module 2: AI Code Generation

**Requirements:**
- Natural language to code conversion
- Template-based generation (8 templates)
- Full-stack application generation (React + Node.js + DB)
- Automatic GitHub repository creation

**LLM Integration:**
```typescript
import { invokeLLM } from "./server/_core/llm";

const response = await invokeLLM({
  messages: [
    { role: "system", content: "You are a code generation expert..." },
    { role: "user", content: userPrompt }
  ],
  response_format: {
    type: "json_schema",
    json_schema: { /* structured output */ }
  }
});
```

**Cost Tracking:**
- Every LLM call logged to `llm_api_calls` table
- Real-time cost calculation based on token usage
- Admin dashboard displays per-user costs

**Database Schema:**
```sql
CREATE TABLE projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  githubRepoUrl VARCHAR(500),
  isImported TINYINT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE files (
  id INT PRIMARY KEY AUTO_INCREMENT,
  projectId INT NOT NULL,
  filePath VARCHAR(500) NOT NULL,
  content LONGTEXT,
  language VARCHAR(50)
);
```

---

### Module 3: Existing Repository Integration

**Requirements:**
- Import GitHub repositories via URL
- Parse and validate repository structure
- Fetch up to 100 files
- Store file content in database

**GitHub API Integration:**
```typescript
// server/githubImport.ts
export async function importRepository(repoUrl: string, userId: number) {
  const { owner, repo } = parseGitHubUrl(repoUrl);
  
  // Fetch repository info
  const repoInfo = await octokit.rest.repos.get({ owner, repo });
  
  // Get file tree
  const tree = await octokit.rest.git.getTree({
    owner, repo,
    tree_sha: repoInfo.data.default_branch,
    recursive: "true"
  });
  
  // Fetch file contents (limit 100)
  const files = await Promise.all(
    tree.data.tree.slice(0, 100).map(file => fetchFileContent(owner, repo, file.path))
  );
  
  return { repoInfo, files };
}
```

**API Endpoints:**
```typescript
github.import.useMutation({ repoUrl: string }) → Project
github.getRepoInfo.useQuery({ repoUrl: string }) → RepoInfo
github.getFileTree.useQuery({ owner, repo }) → FileTree[]
```

---

### Module 4: AI-Powered Codebase Analysis

**Requirements:**
- Analyze imported repositories
- Detect tech stack (frameworks, libraries, languages)
- Assess complexity (simple/moderate/complex)
- Generate improvement recommendations

**Analysis Service:**
```typescript
// server/codeModificationService.ts
export async function analyzeCodebase(files: File[], projectId: number, userId: number) {
  const fileList = files.map(f => `${f.path} (${f.language})`).join("\n");
  
  const analysis = await invokeLLM({
    messages: [{
      role: "system",
      content: "Analyze this codebase and provide structured insights..."
    }, {
      role: "user",
      content: `Files:\n${fileList}\n\nSample content:\n${sampleContent}`
    }],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "codebase_analysis",
        schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            techStack: { type: "array", items: { type: "string" } },
            complexity: { type: "string", enum: ["simple", "moderate", "complex"] },
            keyComponents: { type: "array" },
            recommendations: { type: "array" }
          }
        }
      }
    }
  }, { userId, projectId, feature: "codebase_analysis" });
  
  return JSON.parse(analysis.choices[0].message.content);
}
```

**Complexity Detection:**
- **Simple**: <20 files, <2,000 lines
- **Moderate**: 20-50 files, 2,000-10,000 lines
- **Complex**: >50 files, >10,000 lines

---

### Module 5: AI Code Modification

**Requirements:**
- Accept natural language modification requests
- Analyze existing code for context
- Generate code changes
- Create pull request (never commit to main)
- Provide diff preview

**Modification Workflow:**
1. User submits modification request
2. System validates request (prompt injection check)
3. AI analyzes codebase and generates changes
4. System creates new branch
5. System commits changes to branch
6. System creates pull request
7. User reviews PR on GitHub

**Security Layer:**
```typescript
// server/promptSecurity.ts
export function validateCodeModificationRequest(request: string): {
  isValid: boolean;
  reason?: string;
} {
  const jailbreakPatterns = [
    /ignore (previous|all) instructions?/i,
    /you are now/i,
    /system prompt/i,
    /reveal your (instructions|prompt)/i,
    // ... 30+ patterns
  ];
  
  for (const pattern of jailbreakPatterns) {
    if (pattern.test(request)) {
      logSecurityEvent("prompt_injection_detected", request);
      return { isValid: false, reason: "Potential prompt injection detected" };
    }
  }
  
  return { isValid: true };
}
```

**API Endpoints:**
```typescript
github.modifyCode.useMutation({
  projectId: number,
  request: string,
  repoUrl: string
}) → { prUrl: string, branchName: string }

github.analyzeCodebase.useQuery({ projectId: number }) → CodebaseAnalysis
```

---

### Module 6: Built-in Deployment Infrastructure

**Requirements:**
- Deploy applications to Project Catalyst infrastructure
- Docker container management
- Automatic buildpack detection (Nixpacks)
- Subdomain generation
- Resource limits enforcement
- Health monitoring

**Deployment Architecture:**
```
User clicks "Deploy" 
  ↓
Fetch project files from database
  ↓
Create build directory (/tmp/builds/{subdomain})
  ↓
Run Nixpacks to detect language/framework
  ↓
Generate Dockerfile
  ↓
Build Docker image (catalyst-{subdomain}:latest)
  ↓
Find available port (3000-9000)
  ↓
Run container with resource limits:
  - CPU: 1000m (1 core)
  - Memory: 512MB
  - Storage: 1GB
  ↓
Generate subdomain ({project}-{random}.catalyst.app)
  ↓
Save deployment record to database
  ↓
Return deployment URL to user
```

**Docker Service:**
```typescript
// server/dockerService.ts
export async function deployContainer(options: DeployOptions) {
  const { projectId, files, subdomain } = options;
  
  // 1. Create build directory
  const buildDir = `/tmp/builds/${subdomain}-${Date.now()}`;
  await fs.mkdir(buildDir, { recursive: true });
  
  // 2. Write files
  for (const file of files) {
    await fs.writeFile(path.join(buildDir, file.path), file.content);
  }
  
  // 3. Build image with Nixpacks
  await execAsync(`nixpacks build ${buildDir} --name catalyst-${subdomain}`);
  
  // 4. Run container
  const port = await findAvailablePort();
  const containerId = await execAsync(`
    docker run -d \
      --name ${subdomain} \
      --cpus="1.0" \
      --memory="512m" \
      --storage-opt size=1G \
      -p ${port}:${detectAppPort(buildDir)} \
      -l traefik.enable=true \
      -l traefik.http.routers.${subdomain}.rule=Host(\`${subdomain}.catalyst.app\`) \
      catalyst-${subdomain}
  `);
  
  return {
    containerId,
    deploymentUrl: `https://${subdomain}.catalyst.app`,
    port
  };
}
```

**Database Schema:**
```sql
CREATE TABLE built_in_deployments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  projectId INT NOT NULL,
  userId INT NOT NULL,
  containerId VARCHAR(255),
  subdomain VARCHAR(255) UNIQUE NOT NULL,
  deploymentUrl VARCHAR(500) NOT NULL,
  status ENUM('pending', 'building', 'running', 'stopped', 'failed'),
  buildLogs TEXT,
  port INT,
  cpuLimit INT DEFAULT 1000,  -- millicores
  memoryLimit INT DEFAULT 512,  -- MB
  storageLimit INT DEFAULT 1024,  -- MB
  healthStatus ENUM('healthy', 'unhealthy', 'unknown'),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Supported Languages:**
| Language | Detection File | Build Command | Start Command |
|----------|---------------|---------------|---------------|
| Node.js | package.json | npm install && npm run build | npm start |
| Python | requirements.txt | pip install -r requirements.txt | python app.py |
| Go | go.mod | go build | ./main |
| Static | index.html | - | npx serve -s . |

**API Endpoints:**
```typescript
builtInDeployment.deploy.useMutation({ projectId: number }) → Deployment
builtInDeployment.stop.useMutation({ deploymentId: number }) → { success: boolean }
builtInDeployment.restart.useMutation({ deploymentId: number }) → { success: boolean }
builtInDeployment.logs.useQuery({ deploymentId: number }) → { logs: string }
builtInDeployment.status.useQuery({ projectId: number }) → Deployment[]
```

---

### Module 7: Security & Admin Controls

**Requirements:**
- Prompt injection detection
- Admin kill switches for features
- Security event logging
- Cost monitoring dashboard
- Rate limiting

**Security Features:**

**7.1 Prompt Injection Protection**
```typescript
// 30+ jailbreak patterns
const JAILBREAK_PATTERNS = [
  /ignore (previous|all) instructions?/i,
  /you are now/i,
  /system prompt/i,
  /reveal your (instructions|prompt)/i,
  /bypass (security|safety)/i,
  // ... 25+ more patterns
];
```

**7.2 Admin Kill Switches**
```typescript
// Feature flags stored in database
CREATE TABLE feature_flags (
  feature VARCHAR(50) PRIMARY KEY,
  enabled TINYINT DEFAULT 1,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

// Runtime check
export async function isFeatureEnabled(feature: string): Promise<boolean> {
  const flag = await db.select().from(featureFlags).where(eq(featureFlags.feature, feature));
  return flag[0]?.enabled === 1;
}
```

**7.3 Security Event Logging**
```sql
CREATE TABLE security_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT,
  eventType VARCHAR(100) NOT NULL,
  details TEXT,
  severity ENUM('low', 'medium', 'high', 'critical'),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**7.4 Cost Monitoring**
```sql
CREATE TABLE llm_api_calls (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  projectId INT,
  feature VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  promptTokens INT NOT NULL,
  completionTokens INT NOT NULL,
  totalTokens INT NOT NULL,
  estimatedCost DECIMAL(10, 6) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Cost Calculation:**
```typescript
const MODEL_PRICING = {
  "gpt-4": { input: 0.03 / 1000, output: 0.06 / 1000 },
  "gpt-4-turbo": { input: 0.01 / 1000, output: 0.03 / 1000 },
  "gpt-3.5-turbo": { input: 0.0015 / 1000, output: 0.002 / 1000 }
};

function calculateCost(model: string, promptTokens: number, completionTokens: number): number {
  const pricing = MODEL_PRICING[model];
  return (promptTokens * pricing.input) + (completionTokens * pricing.output);
}
```

**7.5 Rate Limiting**
- **Default**: 10 requests/hour per user
- **Pro Tier**: 50 requests/hour
- **Team Tier**: 200 requests/hour
- **Implementation**: In-memory cache with sliding window

**API Endpoints:**
```typescript
admin.getCostStats.useQuery() → CostStatistics
admin.getUserCosts.useQuery() → UserCost[]
admin.getSecurityEvents.useQuery() → SecurityEvent[]
admin.toggleFeature.useMutation({ feature: string, enabled: boolean }) → { success: boolean }
```

---

### Module 8: Testing Infrastructure

**Requirements:**
- Unit tests for services
- Integration tests for API endpoints
- Repo Gauntlet for AI quality validation
- Automated test execution

**Test Framework:**
- **Vitest** for unit and integration tests
- **Testing Library** for React components
- **Custom framework** for Repo Gauntlet

**Repo Gauntlet:**
```typescript
// tests/repoGauntlet.test.ts
const TEST_REPOSITORIES = [
  { url: "https://github.com/vercel/next.js", complexity: "complex" },
  { url: "https://github.com/facebook/react", complexity: "complex" },
  { url: "https://github.com/expressjs/express", complexity: "moderate" },
  { url: "https://github.com/tailwindlabs/tailwindcss", complexity: "moderate" },
  { url: "https://github.com/simple-icons/simple-icons", complexity: "simple" }
];

describe("Repo Gauntlet - AI Quality Validation", () => {
  for (const repo of TEST_REPOSITORIES) {
    it(`should analyze ${repo.url} correctly`, async () => {
      const analysis = await analyzeCodebase(repo.url);
      
      expect(analysis.techStack).toBeDefined();
      expect(analysis.techStack.length).toBeGreaterThan(0);
      expect(analysis.complexity).toBe(repo.complexity);
      expect(analysis.keyComponents.length).toBeGreaterThan(0);
    });
  }
});
```

**Test Coverage:**
- **Unit Tests**: 18 tests covering services
- **Integration Tests**: API endpoint validation
- **Component Tests**: React component rendering
- **Repo Gauntlet**: 5 representative repositories

---

## 3. API Documentation

### 3.1 tRPC Router Structure

```typescript
export const appRouter = router({
  auth: authRouter,
  projects: projectsRouter,
  github: githubRouter,
  builtInDeployment: builtInDeploymentRouter,
  admin: adminRouter
});
```

### 3.2 Complete API Reference

**Authentication:**
```typescript
auth.me.useQuery() → User | null
auth.logout.useMutation() → { success: boolean }
```

**Projects:**
```typescript
projects.list.useQuery() → Project[]
projects.get.useQuery({ id: number }) → Project
projects.create.useMutation({ name, description }) → Project
projects.delete.useMutation({ id: number }) → { success: boolean }
```

**GitHub Integration:**
```typescript
github.import.useMutation({ repoUrl: string }) → Project
github.getRepoInfo.useQuery({ repoUrl: string }) → RepoInfo
github.getFileTree.useQuery({ owner, repo }) → FileTree[]
github.getFileContent.useQuery({ owner, repo, path }) → string
github.modifyCode.useMutation({ projectId, request, repoUrl }) → { prUrl: string }
github.analyzeCodebase.useQuery({ projectId: number }) → CodebaseAnalysis
github.createPR.useMutation({ owner, repo, title, body, head, base }) → { prUrl: string }
```

**Built-in Deployment:**
```typescript
builtInDeployment.deploy.useMutation({ projectId: number }) → Deployment
builtInDeployment.stop.useMutation({ deploymentId: number }) → { success: boolean }
builtInDeployment.restart.useMutation({ deploymentId: number }) → { success: boolean }
builtInDeployment.logs.useQuery({ deploymentId: number }) → { logs: string }
builtInDeployment.status.useQuery({ projectId: number }) → Deployment[]
```

**Admin:**
```typescript
admin.getCostStats.useQuery() → { totalCost, avgPerUser, highCostUsers }
admin.getUserCosts.useQuery() → UserCost[]
admin.getSecurityEvents.useQuery() → SecurityEvent[]
admin.toggleFeature.useMutation({ feature, enabled }) → { success: boolean }
```

---

## 4. Security Requirements

### 4.1 Authentication & Authorization
- OAuth 2.0 with Manus platform
- JWT tokens with 7-day expiration
- Role-based access control (admin, user)
- GitHub OAuth for repository access

### 4.2 Prompt Injection Protection
- 30+ jailbreak pattern detection
- Security event logging for suspicious requests
- Automatic request blocking
- Admin notification for critical events

### 4.3 Container Security
- Isolated Docker containers per deployment
- Resource limits enforced (CPU, memory, storage)
- No SSH access to containers
- Read-only root filesystem (where possible)
- Network isolation via Docker networks

### 4.4 Data Protection
- Encrypted database connections (TLS)
- Secure environment variable storage
- No sensitive data in logs
- GitHub tokens stored securely

### 4.5 Rate Limiting
- 10 requests/hour per user (default)
- 50 requests/hour (Pro tier)
- 200 requests/hour (Team tier)
- Sliding window implementation

---

## 5. Performance Requirements

### 5.1 Response Times
- **API Endpoints**: <200ms (p95)
- **AI Code Generation**: <30 seconds
- **Repository Import**: <60 seconds (100 files)
- **Codebase Analysis**: <45 seconds
- **Deployment Build**: <5 minutes
- **Container Start**: <10 seconds

### 5.2 Scalability
- **Concurrent Users**: 1,000 (Year 1)
- **Concurrent Deployments**: 3,000 containers
- **Database Connections**: 100 pool size
- **LLM API Calls**: 10,000/day

### 5.3 Availability
- **Platform Uptime**: 99.5% (MVP), 99.9% (Year 2)
- **Deployment Success Rate**: >95%
- **Database Availability**: 99.95% (managed service)

---

## 6. Infrastructure Requirements

### 6.1 Platform Backend (Serverless)
- **Hosting**: AWS Fargate / Google Cloud Run
- **Compute**: Auto-scaling (0-100 instances)
- **Memory**: 2GB per instance
- **Database**: Managed MySQL/TiDB
- **Estimated Cost**: $500-1,000/month (1,000 users)

### 6.2 User Deployments (Docker)
- **Hosting**: Docker Engine on dedicated servers
- **Compute**: 1 core per container (default)
- **Memory**: 512MB per container (default)
- **Storage**: 1GB per container (default)
- **Estimated Cost**: $5,000-8,000/month (1,000 users, 3,000 containers)

### 6.3 Future Migration (Kubernetes)
- **Timeline**: Year 2 (2,000+ users)
- **Rationale**: Better orchestration, autoscaling, multi-region
- **Trade-off**: Increased operational complexity

---

## 7. Testing Strategy

### 7.1 Unit Tests
- Service layer functions
- Utility functions
- Database queries
- **Target Coverage**: 70%

### 7.2 Integration Tests
- API endpoint validation
- GitHub API integration
- LLM API integration
- **Target Coverage**: 80% of critical paths

### 7.3 Component Tests
- React component rendering
- User interactions
- State management
- **Target Coverage**: 60%

### 7.4 Repo Gauntlet (AI Quality)
- Test against 20 real-world repositories
- Validate tech stack detection accuracy
- Validate complexity assessment
- Validate modification quality
- **Target**: >85% user satisfaction

### 7.5 Load Testing
- 1,000 concurrent users
- 100 deployments/hour
- 1,000 LLM API calls/hour
- **Target**: <5% error rate

---

## Appendix

### Version History
- **v1.0** (January 30, 2025): Initial FRD with core modules
- **v2.0** (October 15, 2025): Added repository integration, codebase analysis, code modification
- **v2.1** (October 30, 2025): Added built-in deployment, security controls, cost monitoring, infrastructure architecture

### Technology References
- tRPC Documentation: https://trpc.io
- Drizzle ORM: https://orm.drizzle.team
- Nixpacks: https://nixpacks.com
- Docker API: https://docs.docker.com/engine/api
- GitHub API: https://docs.github.com/en/rest

---

**Document Status**: Active  
**Next Review**: November 30, 2025  
**Owner**: Project Catalyst Engineering Team

