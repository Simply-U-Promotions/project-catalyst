#!/bin/bash

# Verpex cPanel Deployment Script
# This script helps deploy Project Catalyst to Verpex hosting

set -e

echo "🚀 Verpex cPanel Deployment Script"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the project directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo -e "${BLUE}Step 1: Building application locally...${NC}"
npm install
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}Error: Build failed. dist/ directory not found.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build successful${NC}"
echo ""

echo -e "${BLUE}Step 2: Creating deployment package...${NC}"

# Create a temporary directory for deployment
DEPLOY_DIR="verpex-deploy-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEPLOY_DIR"

# Copy necessary files
cp -r dist "$DEPLOY_DIR/"
cp package.json "$DEPLOY_DIR/"
cp package-lock.json "$DEPLOY_DIR/" 2>/dev/null || cp pnpm-lock.yaml "$DEPLOY_DIR/" 2>/dev/null || true
cp -r drizzle "$DEPLOY_DIR/" 2>/dev/null || true
cp -r server "$DEPLOY_DIR/" 2>/dev/null || true
cp -r shared "$DEPLOY_DIR/" 2>/dev/null || true
cp -r storage "$DEPLOY_DIR/" 2>/dev/null || true
cp .cpanel.yml "$DEPLOY_DIR/" 2>/dev/null || true

# Create a README for deployment
cat > "$DEPLOY_DIR/DEPLOY_README.txt" << 'EOF'
Verpex cPanel Deployment Package
================================

This package contains the built Project Catalyst application ready for deployment to Verpex cPanel.

Deployment Steps:
1. Upload this entire folder to your Verpex hosting via cPanel File Manager or FTP
2. In cPanel, go to "Setup Node.js App"
3. Create a new application:
   - Node.js version: 20.x
   - Application mode: Production
   - Application root: path/to/this/folder
   - Application startup file: dist/index.js
4. Add environment variables (see VERPEX_DEPLOYMENT.md for full list)
5. Start the application

For detailed instructions, see VERPEX_DEPLOYMENT.md in the repository.
EOF

echo -e "${GREEN}✓ Deployment package created: $DEPLOY_DIR${NC}"
echo ""

echo -e "${BLUE}Step 3: Creating compressed archive...${NC}"
tar -czf "$DEPLOY_DIR.tar.gz" "$DEPLOY_DIR"
echo -e "${GREEN}✓ Archive created: $DEPLOY_DIR.tar.gz${NC}"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment package ready!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Upload $DEPLOY_DIR.tar.gz to your Verpex hosting"
echo "2. Extract the archive in cPanel File Manager"
echo "3. Follow the instructions in VERPEX_DEPLOYMENT.md"
echo ""
echo "Files included:"
echo "  - dist/ (built application)"
echo "  - package.json (dependencies)"
echo "  - server/ (server code)"
echo "  - drizzle/ (database schema)"
echo ""
echo -e "${BLUE}Tip: You can upload via FTP, cPanel File Manager, or Git${NC}"
echo ""

# Optional: Upload via SCP if credentials are provided
read -p "Do you want to upload via SCP now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter SSH host (e.g., yourdomain.com): " SSH_HOST
    read -p "Enter SSH username: " SSH_USER
    read -p "Enter remote path (e.g., ~/project-catalyst): " REMOTE_PATH
    
    echo "Uploading..."
    scp -r "$DEPLOY_DIR" "$SSH_USER@$SSH_HOST:$REMOTE_PATH"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Upload successful${NC}"
        echo ""
        echo "Now SSH into your server and:"
        echo "  cd $REMOTE_PATH/$DEPLOY_DIR"
        echo "  npm install --production"
        echo "  # Configure environment variables in cPanel"
        echo "  # Start the app via cPanel Node.js App interface"
    else
        echo -e "${RED}Upload failed. Please upload manually.${NC}"
    fi
fi

echo ""
echo -e "${GREEN}Done!${NC}"
