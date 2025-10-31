#!/bin/bash
# Deploy to DigitalOcean Droplet
set -e
echo "🚀 Deploying to DigitalOcean..."
echo "Enter droplet IP:"
read DROPLET_IP
ssh root@$DROPLET_IP << 'EOF'
cd /var/www/project-catalyst || git clone https://github.com/Simply-U-Promotions/project-catalyst.git /var/www/project-catalyst
cd /var/www/project-catalyst
git pull
pnpm install
pnpm build
pm2 restart project-catalyst || pm2 start dist/index.js --name project-catalyst
EOF
echo "✅ Deployment complete!"
