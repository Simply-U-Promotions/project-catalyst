#!/bin/bash
# Deploy to Railway
set -e
echo "🚀 Deploying to Railway..."
npm install -g @railway/cli 2>/dev/null || true
railway login
railway up
echo "✅ Deployment complete!"
