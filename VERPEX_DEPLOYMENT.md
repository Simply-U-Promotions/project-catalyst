# Verpex cPanel Node.js Deployment Guide

Complete guide for deploying Project Catalyst to Verpex shared hosting with cPanel Node.js support.

## Prerequisites

- Verpex hosting account with cPanel access
- Node.js App feature enabled in cPanel
- MySQL database access
- SSH access (optional but recommended)
- Domain or subdomain configured

## Overview

Verpex's cPanel provides a "Setup Node.js App" feature that allows you to run Node.js applications on shared hosting. This guide will walk you through deploying Project Catalyst.

---

## Step 1: Prepare Your Database

### 1.1 Create MySQL Database

1. Log into cPanel
2. Go to **MySQL® Databases**
3. Create a new database:
   - Database name: `project_catalyst`
4. Create a database user:
   - Username: `catalyst_user`
   - Password: (generate strong password)
5. Add user to database with **ALL PRIVILEGES**
6. Note down:
   - Database name: `username_project_catalyst`
   - Username: `username_catalyst_user`
   - Password: `your_password`
   - Host: `localhost`

### 1.2 Construct DATABASE_URL

```
DATABASE_URL=mysql://username_catalyst_user:your_password@localhost:3306/username_project_catalyst
```

---

## Step 2: Upload Project Files

### Option A: Using Git (Recommended)

1. Log into cPanel
2. Open **Terminal** (if available)
3. Navigate to your home directory:
```bash
cd ~/
```

4. Clone the repository:
```bash
git clone https://github.com/Simply-U-Promotions/project-catalyst.git
```

5. The files will be in `~/project-catalyst/`

### Option B: Using File Manager

1. Download the repository as ZIP from GitHub
2. Upload to cPanel using **File Manager**
3. Extract the ZIP file
4. Ensure files are in `~/project-catalyst/` or `~/public_html/project-catalyst/`

---

## Step 3: Set Up Node.js App in cPanel

### 3.1 Create Node.js Application

1. In cPanel, go to **Software** → **Setup Node.js App**
2. Click **Create Application**
3. Configure:
   - **Node.js version**: 20.x (latest available)
   - **Application mode**: Production
   - **Application root**: `project-catalyst`
   - **Application URL**: Choose your domain or subdomain
   - **Application startup file**: `dist/index.js`
   - **Passenger log file**: Leave default

4. Click **Create**

### 3.2 Important Notes

- The application root should point to where you uploaded the files
- The startup file is `dist/index.js` (the built server file)
- cPanel will automatically install dependencies from `package.json`

---

## Step 4: Configure Environment Variables

### 4.1 Add Environment Variables in cPanel

In the Node.js App settings, add these environment variables:

**Required Variables:**

```bash
# Database
DATABASE_URL=mysql://username_catalyst_user:password@localhost:3306/username_project_catalyst

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-generated-secret-here

# Node Environment
NODE_ENV=production

# Trust Proxy (important for cPanel)
TRUST_PROXY=1

# AWS S3 Storage (use your credentials or Cloudflare R2)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
AWS_S3_ENDPOINT=https://s3.amazonaws.com

# OAuth (Manus OAuth or your own)
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
VITE_APP_ID=your-app-id

# Owner Info
OWNER_OPEN_ID=your-openid
OWNER_NAME=Your Name

# App Branding
VITE_APP_TITLE=Project Catalyst
VITE_APP_LOGO=https://your-domain.com/logo.png

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=https://analytics.your-domain.com
VITE_ANALYTICS_WEBSITE_ID=your-website-id
```

### 4.2 Generate JWT Secret

Use one of these methods:

**Method 1: OpenSSL (if SSH access)**
```bash
openssl rand -base64 32
```

**Method 2: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Method 3: Online Generator**
Visit: https://generate-secret.vercel.app/32

---

## Step 5: Build the Application

### 5.1 SSH Access (Recommended)

If you have SSH access:

```bash
# Navigate to project directory
cd ~/project-catalyst

# Install dependencies
npm install --production=false

# Build the application
npm run build

# Install production dependencies only
npm prune --production
```

### 5.2 Without SSH Access

If you don't have SSH access:

1. Build locally on your computer:
```bash
git clone https://github.com/Simply-U-Promotions/project-catalyst.git
cd project-catalyst
npm install
npm run build
```

2. Upload the `dist/` folder to your Verpex hosting via File Manager

---

## Step 6: Run Database Migrations

### 6.1 Push Database Schema

You need to create the database tables. Two options:

**Option A: Using Drizzle Kit (SSH required)**
```bash
cd ~/project-catalyst
npx drizzle-kit push
```

**Option B: Manual SQL Import**

1. Export the schema from your local development:
```bash
npx drizzle-kit generate
```

2. Find the generated SQL files in `drizzle/` folder
3. Import them via cPanel **phpMyAdmin**:
   - Go to phpMyAdmin
   - Select your database
   - Click "Import"
   - Upload the SQL file
   - Execute

---

## Step 7: Start the Application

### 7.1 Start via cPanel

1. Go back to **Setup Node.js App**
2. Find your application
3. Click **Start App** or **Restart App**
4. Wait for the application to start (may take 30-60 seconds)

### 7.2 Verify It's Running

1. Check the status in cPanel Node.js App interface
2. Visit your domain/subdomain
3. You should see the Project Catalyst homepage

---

## Step 8: Configure Domain (Optional)

### 8.1 Point Domain to Application

If using a custom domain:

1. In cPanel, go to **Domains**
2. Add your domain or subdomain
3. Point it to the application directory
4. Update DNS records if needed

### 8.2 SSL Certificate

1. Go to **SSL/TLS Status**
2. Enable AutoSSL for your domain
3. Wait for certificate to be issued (5-15 minutes)

---

## Troubleshooting

### Application Won't Start

**Check logs:**
1. In cPanel Node.js App, click on your app
2. View the **Passenger log file**
3. Look for errors

**Common issues:**
- Missing environment variables
- Database connection failed
- Port already in use
- Build files missing

### Database Connection Errors

**Verify:**
- DATABASE_URL is correct
- Database user has ALL PRIVILEGES
- Database exists
- Host is `localhost` (not `127.0.0.1`)

### Memory Errors

cPanel shared hosting has memory limits. If you hit them:

1. Reduce concurrent connections in code
2. Optimize database queries
3. Consider upgrading to VPS

### Port Issues

cPanel assigns ports automatically. Don't hardcode port 3000. Use:

```javascript
const PORT = process.env.PORT || 3000;
```

(This is already configured in Project Catalyst)

---

## Performance Optimization

### 1. Enable Passenger Caching

In cPanel Node.js App settings:
- Enable **Static file caching**
- Set cache duration to 1 week

### 2. Use CDN

Consider using Cloudflare:
1. Point your domain DNS to Cloudflare
2. Enable CDN and caching
3. Configure SSL/TLS

### 3. Optimize Database

- Add indexes to frequently queried columns
- Use connection pooling (already configured)
- Monitor slow queries

---

## Updating the Application

### Method 1: Git Pull (SSH)

```bash
cd ~/project-catalyst
git pull origin main
npm install
npm run build
# Restart app via cPanel
```

### Method 2: Manual Upload

1. Build locally
2. Upload `dist/` folder
3. Restart app via cPanel

---

## Monitoring

### Check Application Status

1. cPanel → Setup Node.js App
2. View status and resource usage
3. Check Passenger logs for errors

### Monitor Database

1. cPanel → phpMyAdmin
2. Check table sizes
3. Monitor slow query log

---

## Backup Strategy

### 1. Database Backups

- Use cPanel **Backup Wizard**
- Schedule automatic backups
- Download backups regularly

### 2. File Backups

- Backup `project-catalyst/` directory
- Include `.env` file (store securely)
- Keep backups off-server

---

## Security Checklist

- ✅ Strong JWT_SECRET generated
- ✅ Database user has minimum required privileges
- ✅ SSL certificate installed
- ✅ Environment variables not in code
- ✅ `.env` file not publicly accessible
- ✅ Regular backups configured
- ✅ Software kept up to date

---

## Support

### Verpex Support

- **Ticket System**: https://verpex.com/support
- **Live Chat**: Available in cPanel
- **Knowledge Base**: https://verpex.com/kb

### Project Catalyst Issues

- **GitHub**: https://github.com/Simply-U-Promotions/project-catalyst/issues
- **Documentation**: See README.md and other guides

---

## Next Steps

1. ✅ Deploy application
2. ✅ Test all features
3. ✅ Configure monitoring
4. ✅ Set up backups
5. ✅ Point custom domain
6. ✅ Enable SSL
7. ✅ Optimize performance
8. ✅ Launch! 🚀

---

## Quick Reference

**cPanel Locations:**
- Node.js App: Software → Setup Node.js App
- MySQL: Databases → MySQL® Databases
- File Manager: Files → File Manager
- Terminal: Advanced → Terminal
- SSL: Security → SSL/TLS Status

**Important Files:**
- Application entry: `dist/index.js`
- Environment: Set in cPanel Node.js App
- Database schema: `drizzle/schema.ts`
- Build output: `dist/` folder

**Useful Commands (SSH):**
```bash
# Navigate to app
cd ~/project-catalyst

# View logs
tail -f ~/passenger.log

# Restart app (via cPanel is better)
# touch tmp/restart.txt

# Check Node version
node --version

# Check npm version
npm --version
```

---

## Conclusion

You now have Project Catalyst running on Verpex cPanel hosting! The application should be accessible via your domain and fully functional.

For any issues, check the troubleshooting section or contact Verpex support.

Happy deploying! 🎉
