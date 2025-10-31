# Deployment Guide - Project Catalyst

This guide explains how to deploy Project Catalyst to production environments outside of Manus.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Deployment Options](#deployment-options)
   - [Vercel (Recommended)](#option-1-vercel-recommended)
   - [Railway](#option-2-railway)
   - [Render](#option-3-render)
   - [AWS](#option-4-aws)
   - [DigitalOcean](#option-5-digitalocean)
4. [Database Setup](#database-setup)
5. [Post-Deployment](#post-deployment)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

1. **GitHub Repository** - Code must be in a GitHub repository
2. **Database** - MySQL/TiDB database (we recommend PlanetScale or TiDB Cloud)
3. **OAuth Provider** - Manus OAuth credentials OR configure your own OAuth (Google, GitHub, etc.)
4. **S3-Compatible Storage** - AWS S3, Cloudflare R2, or DigitalOcean Spaces
5. **Domain** (optional) - Custom domain for production

---

## Environment Variables

Create a `.env.production` file with these required variables:

```bash
# Database
DATABASE_URL="mysql://user:password@host:port/database?ssl=true"

# Authentication
JWT_SECRET="your-secure-random-string-min-32-chars"
OAUTH_SERVER_URL="https://api.manus.im"  # Or your OAuth provider
VITE_OAUTH_PORTAL_URL="https://auth.manus.im"  # Or your OAuth portal
VITE_APP_ID="your-app-id"

# Owner Info
OWNER_OPEN_ID="your-openid"
OWNER_NAME="Your Name"

# App Config
VITE_APP_TITLE="Project Catalyst"
VITE_APP_LOGO="https://your-cdn.com/logo.png"

# Storage (S3-compatible)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"
AWS_S3_ENDPOINT="https://s3.amazonaws.com"  # Or your S3-compatible endpoint

# LLM (Optional - for AI features)
BUILT_IN_FORGE_API_URL="https://api.your-llm-provider.com"
BUILT_IN_FORGE_API_KEY="your-llm-api-key"

# Analytics (Optional)
VITE_ANALYTICS_WEBSITE_ID="your-analytics-id"
VITE_ANALYTICS_ENDPOINT="https://analytics.your-domain.com"

# GitHub Integration (Optional)
GITHUB_TOKEN="ghp_your_github_personal_access_token"
```

### Generating Secrets

```bash
# Generate JWT_SECRET (32+ characters)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Deployment Options

### Option 1: Vercel (Recommended)

**Best for:** Quick deployment, automatic scaling, global CDN

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Configure Project

Create `vercel.json` in project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/_core/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/client"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/_core/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/client/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### Step 3: Deploy

```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod

# Add environment variables via Vercel dashboard or CLI
vercel env add DATABASE_URL
vercel env add JWT_SECRET
# ... add all other env vars
```

#### Step 4: Configure Database

```bash
# Push database schema
pnpm db:push
```

**Pros:**
- Zero-config deployment
- Automatic HTTPS
- Global CDN
- Serverless functions
- Free tier available

**Cons:**
- 10-second function timeout on free tier
- Limited to serverless architecture

---

### Option 2: Railway

**Best for:** Full-stack apps, persistent connections, WebSockets

#### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

#### Step 2: Create Project

```bash
# Login
railway login

# Initialize project
railway init

# Link to GitHub repo
railway link
```

#### Step 3: Add Services

```bash
# Add MySQL database
railway add --database mysql

# Deploy application
railway up
```

#### Step 4: Configure Environment

```bash
# Add environment variables
railway variables set JWT_SECRET="your-secret"
railway variables set AWS_ACCESS_KEY_ID="your-key"
# ... add all other env vars
```

#### Step 5: Deploy

```bash
# Railway will automatically deploy on git push
git push origin main
```

**Pros:**
- Built-in database
- WebSocket support
- Automatic deployments
- Simple pricing

**Cons:**
- More expensive than serverless
- Limited free tier

---

### Option 3: Render

**Best for:** Simple deployment, managed services

#### Step 1: Create Render Account

Visit [render.com](https://render.com) and sign up

#### Step 2: Create Web Service

1. Click "New +" → "Web Service"
2. Connect GitHub repository
3. Configure:
   - **Name:** project-catalyst
   - **Environment:** Node
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `pnpm start`
   - **Instance Type:** Choose based on needs

#### Step 3: Add Environment Variables

In Render dashboard, add all environment variables from the list above

#### Step 4: Create Database

1. Click "New +" → "PostgreSQL" (or use external MySQL)
2. Copy `DATABASE_URL` to web service environment variables

#### Step 5: Deploy

Render will automatically deploy on git push to main branch

**Pros:**
- Simple setup
- Managed databases
- Auto-deploy from GitHub
- Free tier available

**Cons:**
- Slower cold starts on free tier
- Limited customization

---

### Option 4: AWS

**Best for:** Enterprise deployments, full control, scalability

#### Architecture

- **Compute:** ECS Fargate or EC2
- **Database:** RDS MySQL
- **Storage:** S3
- **CDN:** CloudFront
- **Load Balancer:** ALB

#### Step 1: Setup Infrastructure

```bash
# Install AWS CLI
brew install awscli  # macOS
# or
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS
aws configure
```

#### Step 2: Create RDS Database

```bash
aws rds create-db-instance \
  --db-instance-identifier project-catalyst-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --master-username admin \
  --master-user-password YourPassword123 \
  --allocated-storage 20
```

#### Step 3: Create S3 Bucket

```bash
aws s3 mb s3://project-catalyst-storage
aws s3api put-bucket-cors --bucket project-catalyst-storage --cors-configuration file://cors.json
```

Create `cors.json`:
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"]
    }
  ]
}
```

#### Step 4: Deploy with ECS

Create `Dockerfile`:
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

Build and push to ECR:
```bash
# Create ECR repository
aws ecr create-repository --repository-name project-catalyst

# Build and push
docker build -t project-catalyst .
docker tag project-catalyst:latest <account-id>.dkr.ecr.<region>.amazonaws.com/project-catalyst:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/project-catalyst:latest
```

Create ECS task and service via AWS Console or CLI

**Pros:**
- Full control
- Highly scalable
- Enterprise features
- Extensive AWS ecosystem

**Cons:**
- Complex setup
- Higher cost
- Requires AWS expertise

---

### Option 5: DigitalOcean

**Best for:** Simple VPS deployment, cost-effective

#### Step 1: Create Droplet

1. Sign up at [digitalocean.com](https://digitalocean.com)
2. Create Droplet:
   - **Image:** Ubuntu 22.04 LTS
   - **Plan:** Basic ($6/month minimum)
   - **Region:** Choose closest to users

#### Step 2: Setup Server

```bash
# SSH into droplet
ssh root@your-droplet-ip

# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2 (process manager)
npm install -g pm2
```

#### Step 3: Deploy Application

```bash
# Clone repository
git clone https://github.com/Simply-U-Promotions/project-catalyst.git
cd project-catalyst

# Install dependencies
pnpm install

# Create .env file
nano .env
# Paste all environment variables

# Build application
pnpm build

# Start with PM2
pm2 start dist/index.js --name project-catalyst
pm2 save
pm2 startup
```

#### Step 4: Setup Nginx

```bash
# Install Nginx
apt install -y nginx

# Create Nginx config
nano /etc/nginx/sites-available/project-catalyst
```

Add configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/project-catalyst /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### Step 5: Setup SSL

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d your-domain.com
```

**Pros:**
- Full control
- Cost-effective
- Simple pricing
- Good documentation

**Cons:**
- Manual server management
- No auto-scaling
- Requires sysadmin skills

---

## Database Setup

### Option 1: PlanetScale (Recommended)

1. Sign up at [planetscale.com](https://planetscale.com)
2. Create database: `project-catalyst`
3. Get connection string
4. Add to `DATABASE_URL` environment variable

```bash
DATABASE_URL="mysql://user:password@host.psdb.cloud/project-catalyst?ssl=true&sslaccept=strict"
```

### Option 2: TiDB Cloud

1. Sign up at [tidbcloud.com](https://tidbcloud.com)
2. Create cluster
3. Get connection string
4. Add to environment variables

### Option 3: Self-Hosted MySQL

```bash
# Install MySQL
apt install -y mysql-server

# Secure installation
mysql_secure_installation

# Create database
mysql -u root -p
CREATE DATABASE project_catalyst;
CREATE USER 'catalyst'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON project_catalyst.* TO 'catalyst'@'localhost';
FLUSH PRIVILEGES;
```

### Push Database Schema

```bash
# After deployment, push schema
pnpm db:push
```

---

## Post-Deployment

### 1. Verify Deployment

```bash
# Check health endpoint
curl https://your-domain.com/health

# Expected response:
# {"status":"ok","timestamp":"2025-01-31T...","uptime":123}
```

### 2. Run Database Migrations

```bash
pnpm db:push
```

### 3. Create Admin User

Access the application and sign up. Then manually set role to 'admin' in database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

### 4. Configure DNS

Point your domain to deployment:
- **Vercel/Render:** Add CNAME record
- **AWS:** Add A record to ALB
- **DigitalOcean:** Add A record to Droplet IP

### 5. Setup Monitoring

- Enable error tracking (Sentry)
- Configure uptime monitoring (UptimeRobot, Pingdom)
- Setup log aggregation (Logtail, Papertrail)

### 6. Configure Backups

- Database: Enable automated backups
- S3: Enable versioning
- Code: Ensure GitHub backups

---

## Troubleshooting

### Build Fails

**Issue:** Build runs out of memory

**Solution:**
```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```

### Database Connection Fails

**Issue:** Can't connect to database

**Solutions:**
1. Check `DATABASE_URL` format
2. Verify SSL settings
3. Check firewall rules
4. Ensure database is running

### OAuth Not Working

**Issue:** Authentication fails

**Solutions:**
1. Verify `OAUTH_SERVER_URL` and `VITE_OAUTH_PORTAL_URL`
2. Check `JWT_SECRET` is set
3. Ensure callback URL is configured in OAuth provider
4. Verify `VITE_APP_ID` matches OAuth app

### S3 Upload Fails

**Issue:** File uploads don't work

**Solutions:**
1. Verify AWS credentials
2. Check bucket permissions
3. Verify CORS configuration
4. Check `AWS_S3_ENDPOINT` URL

### Rate Limiting Issues

**Issue:** `X-Forwarded-For` header warning

**Solution:** Add to server config:
```typescript
app.set('trust proxy', 1);
```

---

## Quick Start Scripts

### Deploy to Vercel

```bash
#!/bin/bash
# deploy-vercel.sh

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

echo "Deployment complete! Don't forget to:"
echo "1. Add environment variables in Vercel dashboard"
echo "2. Run 'pnpm db:push' to setup database"
echo "3. Configure custom domain"
```

### Deploy to Railway

```bash
#!/bin/bash
# deploy-railway.sh

# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up

echo "Deployment complete! Don't forget to:"
echo "1. Add environment variables via 'railway variables set'"
echo "2. Run 'pnpm db:push' to setup database"
```

---

## Support

For deployment issues:

1. Check [GitHub Issues](https://github.com/Simply-U-Promotions/project-catalyst/issues)
2. Review [Documentation](https://github.com/Simply-U-Promotions/project-catalyst)
3. Contact support

---

**Last Updated:** January 31, 2025
