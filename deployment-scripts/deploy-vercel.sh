#!/bin/bash
# Deploy Project Catalyst to Vercel
set -e
echo "🚀 Deploying to Vercel..."
npm install -g vercel 2>/dev/null || true
vercel --prod
echo "✅ Deployment complete!"
echo "Next: Add environment variables in Vercel dashboard"
