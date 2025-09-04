#!/bin/bash

echo "========================================="
echo "  Deploying to scanner-clean (CORRECT PROJECT)"
echo "========================================="
echo ""
echo "This will deploy to your ACTUAL project: scanner-clean"
echo ""

# Remove any existing .vercel directory to start fresh
if [ -d ".vercel" ]; then
    echo "Removing old .vercel link..."
    rm -rf .vercel
fi

echo "Linking to scanner-clean project..."
echo ""
echo "IMPORTANT: When prompted:"
echo "1. Set up and deploy? → Answer: Y"
echo "2. Which scope? → Select: Greg Lagiovane's projects"
echo "3. Link to existing project? → Answer: Y"
echo "4. What's the name? → Type: scanner-clean"
echo ""
echo "Press Enter to continue..."
read

# Link to scanner-clean and deploy
npx vercel link
echo ""
echo "Now deploying to production..."
npx vercel --prod

echo ""
echo "========================================="
echo "Deployment complete!"
echo "Your app should now be live on scanner-clean with all the fixes!"
echo "========================================="