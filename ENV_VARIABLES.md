# Environment Variables Guide

This document explains all environment variables needed to deploy Project Catalyst.

## Required Variables

### Database

**DATABASE_URL**
- **Description:** MySQL/TiDB connection string
- **Format:** `mysql://user:password@host:port/database?ssl=true`
- **Example:** `mysql://admin:pass123@db.example.com:3306/catalyst?ssl=true`
- **Where to get:** Your database provider (PlanetScale, TiDB Cloud, AWS RDS, etc.)

### Authentication

**JWT_SECRET**
- **Description:** Secret key for signing JWT tokens
- **Format:** Random string, minimum 32 characters
- **Generate:**
  ```bash
  openssl rand -base64 32
  # or
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
- **Example:** `dGhpcyBpcyBhIHNlY3JldCBrZXkgZm9yIGp3dCB0b2tlbnM=`

**OAUTH_SERVER_URL**
- **Description:** OAuth server API endpoint
- **Default:** `https://api.manus.im` (for Manus OAuth)
- **Custom:** Your OAuth provider's API URL

**VITE_OAUTH_PORTAL_URL**
- **Description:** OAuth login portal URL (frontend)
- **Default:** `https://auth.manus.im` (for Manus OAuth)
- **Custom:** Your OAuth provider's login page

**VITE_APP_ID**
- **Description:** OAuth application ID
- **Where to get:** Your OAuth provider's app settings

### Owner Information

**OWNER_OPEN_ID**
- **Description:** OpenID of the primary owner/admin
- **Where to get:** From your OAuth provider after first login
- **Purpose:** Automatically grants admin role to this user

**OWNER_NAME**
- **Description:** Display name of the owner
- **Example:** `"John Doe"`

### Application Config

**VITE_APP_TITLE**
- **Description:** Application title shown in UI
- **Default:** `"Project Catalyst"`
- **Example:** `"My Code Platform"`

**VITE_APP_LOGO**
- **Description:** URL to application logo image
- **Format:** Full URL to image file
- **Example:** `"https://cdn.example.com/logo.png"`

### Storage (S3-Compatible)

**AWS_ACCESS_KEY_ID**
- **Description:** S3 access key ID
- **Where to get:** AWS IAM, Cloudflare R2, or DigitalOcean Spaces
- **Example:** `AKIAIOSFODNN7EXAMPLE`

**AWS_SECRET_ACCESS_KEY**
- **Description:** S3 secret access key
- **Where to get:** Same as access key ID
- **Example:** `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
- **Security:** Never commit to git, use secrets management

**AWS_REGION**
- **Description:** S3 bucket region
- **Example:** `us-east-1`, `eu-west-1`
- **Default:** `us-east-1`

**AWS_S3_BUCKET**
- **Description:** S3 bucket name for file storage
- **Example:** `project-catalyst-storage`
- **Note:** Bucket must exist and have proper CORS configuration

**AWS_S3_ENDPOINT**
- **Description:** S3 API endpoint URL
- **AWS S3:** `https://s3.amazonaws.com`
- **Cloudflare R2:** `https://<account-id>.r2.cloudflarestorage.com`
- **DigitalOcean:** `https://<region>.digitaloceanspaces.com`

## Optional Variables

### LLM / AI Features

**BUILT_IN_FORGE_API_URL**
- **Description:** LLM API endpoint for AI code generation
- **Example:** `https://api.openai.com/v1`
- **Alternatives:** Anthropic, Azure OpenAI, custom LLM

**BUILT_IN_FORGE_API_KEY**
- **Description:** API key for LLM service
- **Example:** `sk-proj-...` (OpenAI format)
- **Where to get:** Your LLM provider's API keys page

### Analytics

**VITE_ANALYTICS_WEBSITE_ID**
- **Description:** Website ID for analytics tracking
- **Example:** `abc123-def456-ghi789`
- **Providers:** Plausible, Umami, custom analytics

**VITE_ANALYTICS_ENDPOINT**
- **Description:** Analytics API endpoint
- **Example:** `https://analytics.example.com`

### GitHub Integration

**GITHUB_TOKEN**
- **Description:** GitHub Personal Access Token
- **Scopes needed:** `repo`, `read:user`, `user:email`
- **Where to get:** GitHub Settings → Developer settings → Personal access tokens
- **Format:** `ghp_...`

### Deployment Providers

**VERCEL_TOKEN**
- **Description:** Vercel API token for deployments
- **Where to get:** Vercel Account Settings → Tokens

**NETLIFY_TOKEN**
- **Description:** Netlify API token for deployments
- **Where to get:** Netlify User Settings → Applications → Personal access tokens

**RAILWAY_TOKEN**
- **Description:** Railway API token for deployments
- **Where to get:** Railway Account Settings → Tokens

### Monitoring

**SENTRY_DSN**
- **Description:** Sentry Data Source Name for error tracking
- **Format:** `https://...@sentry.io/...`
- **Where to get:** Sentry Project Settings → Client Keys (DSN)

### Server Configuration

**TRUST_PROXY**
- **Description:** Trust proxy headers for rate limiting
- **Values:** `0` (false), `1` (true)
- **When to use:** Set to `1` if behind reverse proxy/load balancer
- **Default:** `0`

**NODE_ENV**
- **Description:** Node environment
- **Values:** `development`, `production`, `test`
- **Production:** Always set to `production`

**PORT**
- **Description:** Server port number
- **Default:** `3000`
- **Note:** Some platforms (Heroku, Railway) set this automatically

## Platform-Specific Setup

### Vercel

Add environment variables in Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add each variable
3. Select environments (Production, Preview, Development)
4. Save

### Railway

```bash
railway variables set DATABASE_URL="mysql://..."
railway variables set JWT_SECRET="..."
# ... add all other variables
```

### Render

Add environment variables in Render Dashboard:
1. Go to your web service
2. Click "Environment"
3. Add each variable
4. Save changes (triggers redeploy)

### AWS

Use AWS Systems Manager Parameter Store:
```bash
aws ssm put-parameter \
  --name "/project-catalyst/DATABASE_URL" \
  --value "mysql://..." \
  --type "SecureString"
```

### DigitalOcean

Add to `.env` file on droplet:
```bash
nano /var/www/project-catalyst/.env
# Paste all variables
# Save and exit (Ctrl+X, Y, Enter)
```

## Security Best Practices

### 1. Never Commit Secrets

Add to `.gitignore`:
```
.env
.env.local
.env.production
.env.*.local
```

### 2. Use Secrets Management

- **Development:** `.env.local` (gitignored)
- **Production:** Platform secrets manager (Vercel, Railway, AWS Secrets Manager)

### 3. Rotate Secrets Regularly

- Change `JWT_SECRET` every 90 days
- Rotate API keys quarterly
- Update database passwords annually

### 4. Limit Permissions

- S3: Grant only necessary permissions (PutObject, GetObject)
- Database: Use separate user with limited privileges
- OAuth: Request minimum required scopes

### 5. Monitor Access

- Enable CloudTrail (AWS)
- Review access logs regularly
- Set up alerts for suspicious activity

## Validation

### Check Required Variables

```bash
# Create validation script
cat > check-env.sh << 'EOF'
#!/bin/bash

REQUIRED_VARS=(
  "DATABASE_URL"
  "JWT_SECRET"
  "OAUTH_SERVER_URL"
  "VITE_OAUTH_PORTAL_URL"
  "VITE_APP_ID"
  "OWNER_OPEN_ID"
  "OWNER_NAME"
  "AWS_ACCESS_KEY_ID"
  "AWS_SECRET_ACCESS_KEY"
  "AWS_S3_BUCKET"
)

echo "Checking required environment variables..."
MISSING=()

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING+=("$var")
  fi
done

if [ ${#MISSING[@]} -eq 0 ]; then
  echo "✅ All required variables are set"
  exit 0
else
  echo "❌ Missing required variables:"
  printf '%s\n' "${MISSING[@]}"
  exit 1
fi
EOF

chmod +x check-env.sh
./check-env.sh
```

### Test Database Connection

```bash
# Test MySQL connection
mysql -h <host> -u <user> -p<password> -e "SELECT 1"
```

### Test S3 Access

```bash
# Upload test file
aws s3 cp test.txt s3://your-bucket/test.txt

# Download test file
aws s3 cp s3://your-bucket/test.txt test-download.txt
```

## Troubleshooting

### "DATABASE_URL is not defined"

**Solution:** Ensure `DATABASE_URL` is set in environment variables

### "Invalid JWT token"

**Solution:** Check `JWT_SECRET` is set and consistent across deployments

### "S3 upload failed"

**Solutions:**
1. Verify AWS credentials are correct
2. Check bucket exists and is accessible
3. Verify CORS configuration on bucket
4. Ensure IAM permissions allow PutObject

### "OAuth callback failed"

**Solutions:**
1. Verify `OAUTH_SERVER_URL` and `VITE_OAUTH_PORTAL_URL`
2. Check callback URL is registered with OAuth provider
3. Ensure `VITE_APP_ID` matches OAuth app

## Example Configurations

### Minimal Production Setup

```bash
DATABASE_URL="mysql://user:pass@db.example.com:3306/catalyst?ssl=true"
JWT_SECRET="generated-secret-32-chars-minimum"
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://auth.manus.im"
VITE_APP_ID="your-app-id"
OWNER_OPEN_ID="your-openid"
OWNER_NAME="Your Name"
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket"
AWS_S3_ENDPOINT="https://s3.amazonaws.com"
NODE_ENV="production"
```

### Full Production Setup

Add all optional variables for complete functionality:
- LLM API keys for AI features
- Analytics configuration
- GitHub token for repository operations
- Deployment provider tokens
- Monitoring/error tracking

---

**Last Updated:** January 31, 2025
