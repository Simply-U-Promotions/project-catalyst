# Project Catalyst CLI Tool

## Overview

The Project Catalyst CLI tool enables developers to deploy and manage their applications directly from the command line, integrating seamlessly with CI/CD pipelines.

## Installation

### NPM (Recommended)

```bash
npm install -g @project-catalyst/cli
```

### Yarn

```bash
yarn global add @project-catalyst/cli
```

### Direct Download

```bash
curl -fsSL https://cli.catalyst.app/install.sh | bash
```

## Authentication

Before using the CLI, authenticate with your Project Catalyst account:

```bash
catalyst login
```

This will open a browser window for OAuth authentication. Alternatively, use an API token:

```bash
catalyst login --token YOUR_API_TOKEN
```

Generate an API token in your Project Catalyst dashboard under Settings → API Keys.

## Commands

### `catalyst init`

Initialize a new project or link an existing one.

```bash
# Interactive initialization
catalyst init

# With options
catalyst init --name my-app --template saas --framework react
```

**Options:**
- `--name <name>` - Project name
- `--template <template>` - Template to use (saas, dashboard, ecommerce, blog, portfolio, api, crypto, todo)
- `--framework <framework>` - Framework (react, vue, nextjs, express)
- `--link` - Link to existing Catalyst project

### `catalyst deploy`

Deploy your application to Project Catalyst.

```bash
# Deploy to production
catalyst deploy

# Deploy to specific environment
catalyst deploy --env staging

# Deploy with custom build command
catalyst deploy --build "npm run build:prod"
```

**Options:**
- `--env <environment>` - Target environment (production, staging, development)
- `--build <command>` - Custom build command
- `--no-build` - Skip build step
- `--force` - Force deployment even with warnings
- `--watch` - Watch deployment logs in real-time

**Examples:**

```bash
# Deploy to staging with logs
catalyst deploy --env staging --watch

# Deploy without building (pre-built)
catalyst deploy --no-build

# Force deploy ignoring warnings
catalyst deploy --force
```

### `catalyst logs`

View deployment logs.

```bash
# View latest logs
catalyst logs

# Follow logs in real-time
catalyst logs --follow

# View logs for specific environment
catalyst logs --env staging

# View last N lines
catalyst logs --tail 100
```

**Options:**
- `--follow, -f` - Follow log output
- `--env <environment>` - Environment to view logs from
- `--tail <lines>` - Number of lines to show
- `--since <time>` - Show logs since timestamp (e.g., "1h", "30m", "2024-10-30")

### `catalyst env`

Manage environment variables.

```bash
# List all environment variables
catalyst env list

# Set an environment variable
catalyst env set API_KEY=abc123

# Set multiple variables
catalyst env set API_KEY=abc123 DB_URL=postgres://...

# Remove an environment variable
catalyst env remove API_KEY

# Pull environment variables to local .env file
catalyst env pull

# Push local .env file to Catalyst
catalyst env push
```

**Options:**
- `--env <environment>` - Target environment
- `--secret` - Mark variable as secret (masked in UI)

### `catalyst db`

Manage provisioned databases.

```bash
# List databases
catalyst db list

# Create a new database
catalyst db create --type postgresql --size small

# Get connection info
catalyst db info <database-id>

# Create backup
catalyst db backup <database-id>

# Restore from backup
catalyst db restore <database-id> <backup-id>

# Delete database
catalyst db delete <database-id>
```

**Database Types:**
- `postgresql` - PostgreSQL database
- `mysql` - MySQL database
- `mongodb` - MongoDB database
- `redis` - Redis cache

**Sizes:**
- `small` - 1GB storage, 1 vCPU
- `medium` - 10GB storage, 2 vCPU
- `large` - 50GB storage, 4 vCPU

### `catalyst projects`

Manage projects.

```bash
# List all projects
catalyst projects list

# Get project details
catalyst projects info <project-id>

# Delete project
catalyst projects delete <project-id>

# Switch active project
catalyst projects switch <project-id>
```

### `catalyst rollback`

Rollback to a previous deployment.

```bash
# List available deployments
catalyst rollback list

# Rollback to specific deployment
catalyst rollback <deployment-id>

# Rollback to previous deployment
catalyst rollback --previous
```

### `catalyst status`

Check deployment status.

```bash
# Check current deployment status
catalyst status

# Check specific environment
catalyst status --env staging

# Watch status in real-time
catalyst status --watch
```

### `catalyst domains`

Manage custom domains.

```bash
# List domains
catalyst domains list

# Add custom domain
catalyst domains add example.com

# Remove domain
catalyst domains remove example.com

# Verify domain
catalyst domains verify example.com
```

### `catalyst scale`

Manually scale deployments.

```bash
# Scale to specific number of instances
catalyst scale 3

# Enable autoscaling
catalyst scale auto --min 1 --max 5

# Disable autoscaling
catalyst scale manual
```

### `catalyst config`

Manage CLI configuration.

```bash
# Show current configuration
catalyst config list

# Set configuration value
catalyst config set key value

# Reset configuration
catalyst config reset
```

## Configuration File

Create a `catalyst.config.json` in your project root:

```json
{
  "name": "my-app",
  "projectId": "abc123",
  "environments": {
    "production": {
      "branch": "main",
      "buildCommand": "npm run build",
      "startCommand": "npm start",
      "envVars": {
        "NODE_ENV": "production"
      }
    },
    "staging": {
      "branch": "develop",
      "buildCommand": "npm run build:staging",
      "startCommand": "npm start",
      "envVars": {
        "NODE_ENV": "staging"
      }
    }
  },
  "autoscaling": {
    "enabled": true,
    "minInstances": 1,
    "maxInstances": 5,
    "cpuThreshold": 70,
    "memoryThreshold": 80
  }
}
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Deploy to Catalyst

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Catalyst CLI
        run: npm install -g @project-catalyst/cli
      
      - name: Deploy to Catalyst
        run: catalyst deploy --token ${{ secrets.CATALYST_TOKEN }}
        env:
          CATALYST_TOKEN: ${{ secrets.CATALYST_TOKEN }}
```

### GitLab CI

```yaml
deploy:
  stage: deploy
  script:
    - npm install -g @project-catalyst/cli
    - catalyst deploy --token $CATALYST_TOKEN
  only:
    - main
```

### CircleCI

```yaml
version: 2.1

jobs:
  deploy:
    docker:
      - image: node:18
    steps:
      - checkout
      - run: npm install -g @project-catalyst/cli
      - run: catalyst deploy --token $CATALYST_TOKEN

workflows:
  deploy:
    jobs:
      - deploy:
          filters:
            branches:
              only: main
```

## Environment Variables

The CLI respects the following environment variables:

- `CATALYST_TOKEN` - API authentication token
- `CATALYST_PROJECT_ID` - Default project ID
- `CATALYST_ENV` - Default environment (production, staging, development)
- `CATALYST_API_URL` - API endpoint (default: https://api.catalyst.app)

## Examples

### Complete Deployment Workflow

```bash
# 1. Initialize project
catalyst init --name my-app --template saas

# 2. Set environment variables
catalyst env set DATABASE_URL=postgres://... API_KEY=abc123 --secret

# 3. Deploy to staging first
catalyst deploy --env staging --watch

# 4. Test staging deployment
curl https://staging-my-app.catalyst.app

# 5. Deploy to production
catalyst deploy --env production --watch

# 6. Monitor logs
catalyst logs --follow
```

### Database Management

```bash
# Create PostgreSQL database
catalyst db create --type postgresql --size medium

# Get connection string
catalyst db info db-abc123

# Set as environment variable
catalyst env set DATABASE_URL=$(catalyst db info db-abc123 --format connection-string)

# Create backup
catalyst db backup db-abc123

# List backups
catalyst db backups db-abc123
```

### Autoscaling Configuration

```bash
# Enable autoscaling with custom thresholds
catalyst scale auto \
  --min 2 \
  --max 10 \
  --cpu-threshold 75 \
  --memory-threshold 85 \
  --strategy balanced

# Check current scaling status
catalyst status --watch
```

## Troubleshooting

### Authentication Issues

```bash
# Clear cached credentials
catalyst logout
catalyst login

# Verify authentication
catalyst whoami
```

### Deployment Failures

```bash
# View detailed logs
catalyst logs --tail 500

# Check deployment status
catalyst status

# Rollback to previous version
catalyst rollback --previous
```

### Connection Issues

```bash
# Test API connectivity
catalyst config test

# Use custom API endpoint
catalyst config set api-url https://api.catalyst.app

# Enable debug mode
catalyst deploy --debug
```

## Support

- Documentation: https://docs.catalyst.app/cli
- Issues: https://github.com/project-catalyst/cli/issues
- Discord: https://discord.gg/catalyst

## Version

Check your CLI version:

```bash
catalyst --version
```

Update to latest version:

```bash
npm update -g @project-catalyst/cli
```

## License

MIT License - see LICENSE file for details
