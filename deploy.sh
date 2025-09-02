#!/bin/bash

# Scanner Pro Deployment Script to Vercel
# This script prepares and deploys the application to Vercel

echo "🚀 Starting Scanner Pro deployment to Vercel..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in the Scanner Pro directory"
    exit 1
fi

# Build the application first
echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix build errors before deploying."
    exit 1
fi

echo "✅ Build successful!"

# Create .vercelignore if it doesn't exist
cat > .vercelignore << EOF
.git
.next
node_modules
logs
*.log
test_*.js
.env.local
.env
ecosystem.config.js
pm2.json
EOF

echo "📝 Created .vercelignore file"

# Create environment variables file for Vercel
cat > .env.production << EOF
# Production Environment Variables
# These will be set in Vercel Dashboard
POLYGON_API_KEY=\${POLYGON_API_KEY}
FMP_API_KEY=\${FMP_API_KEY}
ORTEX_API_KEY=\${ORTEX_API_KEY}
NODE_ENV=production
EOF

echo "📝 Created .env.production template"

# Display deployment instructions
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "                    VERCEL DEPLOYMENT READY                     "
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Run the deployment command:"
echo "   npx vercel --prod"
echo ""
echo "2. When prompted:"
echo "   - Link to existing project or create new one"
echo "   - Select 'scanner-pro' as project name"
echo "   - Choose defaults for other options"
echo ""
echo "3. Set environment variables in Vercel Dashboard:"
echo "   https://vercel.com/dashboard/project/scanner-pro/settings/environment-variables"
echo ""
echo "   Add these variables:"
echo "   • POLYGON_API_KEY = 75rlu6cWGNnIqqR_x8M384YUjBgGk6kT"
echo "   • FMP_API_KEY = m2XfxOS0sZxs6hLEY5yRzUgDyp5Dur4V"
echo "   • ORTEX_API_KEY = Q0VpvWFI.wPuSEG6CNr7uoRZbtFcmVeeXpoJvjz75"
echo ""
echo "4. Redeploy after adding environment variables"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "🎯 Current Features Status:"
echo "✅ Scanning 1000+ stocks (expanded from 52)"
echo "✅ Real-time data from Polygon API"
echo "✅ Complete options chains with strikes & expirations"
echo "✅ Multi-leg strategies (Iron Condor, Spreads, etc.)"
echo "✅ Mass Scanner fixed (no more 400 errors)"
echo "✅ FMP integration for bid/ask data"
echo ""
echo "════════════════════════════════════════════════════════════════"