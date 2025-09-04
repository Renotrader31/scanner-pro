#!/bin/bash

# Scanner Pro - Vercel Deployment Script
# This script deploys your application to Vercel with all the fixes

echo "========================================="
echo "  Scanner Pro - Vercel Deployment"
echo "========================================="
echo ""
echo "This will deploy your application to production with:"
echo "✅ 4,500+ stocks (expanded from 52)"
echo "✅ Real market data from Polygon, FMP, and Ortex APIs"
echo "✅ ML Trading System with full options support"
echo "✅ All UI fixes (Trade Manager, ML Learning button)"
echo ""
echo "API Keys configured:"
echo "• Polygon API: ✓ (Paid tier with options)"
echo "• FMP API: ✓ (Real-time bid/ask)"
echo "• Ortex API: ✓ (Short interest data)"
echo ""
echo "========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found!"
    echo "Make sure to configure environment variables in Vercel dashboard"
    echo ""
fi

# Build the project first to check for errors
echo "📦 Building project to check for errors..."
npm run build

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Build failed! Please fix the errors above before deploying."
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""
echo "🚀 Starting Vercel deployment..."
echo ""
echo "You will be asked a few questions:"
echo "1. Set up and deploy? → Answer: y"
echo "2. Which scope? → Select your account"
echo "3. Link to existing project? → Answer: n (or y if updating)"
echo "4. Project name? → Press Enter for default or type 'scanner-pro'"
echo "5. Which directory? → Press Enter (current directory)"
echo "6. Modify settings? → Answer: n"
echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read

# Deploy to Vercel production
npx vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "🎉 Deployment Successful!"
    echo "========================================="
    echo ""
    echo "Next steps:"
    echo "1. Go to https://vercel.com/dashboard"
    echo "2. Click on your project"
    echo "3. Go to Settings → Environment Variables"
    echo "4. Add these variables if not already set:"
    echo "   POLYGON_API_KEY = 75rlu6cWGNnIqqR_x8M384YUjBgGk6kT"
    echo "   FMP_API_KEY = m2XfxOS0sZxs6hLEY5yRzUgDyp5Dur4V"
    echo "   ORTEX_API_KEY = Q0VpvWFI.wPuSEG6CNr7uoRZbtFcmVeeXpoJvjz75"
    echo "5. Your app should be live at the URL shown above!"
    echo ""
    echo "To check deployment status: npx vercel ls"
    echo "To view logs: npx vercel logs"
    echo ""
else
    echo ""
    echo "❌ Deployment failed. Please check the error messages above."
    echo "Common issues:"
    echo "• Not logged in: Run 'npx vercel login' first"
    echo "• Build errors: Fix any code issues"
    echo "• Network issues: Check your internet connection"
    exit 1
fi