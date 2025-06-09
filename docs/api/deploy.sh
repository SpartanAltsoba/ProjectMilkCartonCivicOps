#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting optimized deployment process..."

# 1. Environment Check
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found!"
    exit 1
fi

# 2. Install Dependencies
echo "📦 Installing dependencies..."
npm ci --production

# 3. Type Checking
echo "🔍 Running type check..."
npx tsc --noEmit

# 4. Linting
echo "🧹 Running linter..."
npm run lint

# 5. Testing
echo "🧪 Running tests..."
npm run test

# 6. Build Optimization
echo "⚡ Building optimized production bundle..."
ANALYZE=true npm run build

# 7. Cache Optimization
echo "💾 Clearing old cache..."
rm -rf .next/cache

# 8. Firebase Configuration Check
echo "🔧 Checking Firebase configuration..."
if [ ! -f firebase.json ]; then
    echo "❌ Error: firebase.json not found!"
    exit 1
fi

# 9. Deploy to Firebase
echo "🚀 Deploying to Firebase..."

# 9.1 Deploy Functions First
echo "⚙️ Deploying Firebase Functions..."
cd functions
npm ci --production
npm run build
cd ..
firebase deploy --only functions

# 9.2 Deploy Firestore Rules and Indexes
echo "📚 Deploying Firestore configuration..."
firebase deploy --only firestore:rules,firestore:indexes

# 9.3 Deploy Storage Rules
echo "📁 Deploying Storage rules..."
firebase deploy --only storage

# 9.4 Deploy Hosting
echo "🌐 Deploying hosting..."
firebase deploy --only hosting

# 10. Post-deployment Checks
echo "✅ Running post-deployment checks..."

# 10.1 Check Functions
echo "⚙️ Checking Firebase Functions status..."
firebase functions:log --limit 1

# 10.2 Check Hosting
echo "🌐 Checking deployed site..."
DEPLOYED_URL=$(firebase hosting:channel:list --json | jq -r '.result.channels[0].url')
curl -s -o /dev/null -w "Deployed site status: %{http_code}\n" $DEPLOYED_URL

# 10.3 Check Error Logs
echo "📋 Checking for deployment errors..."
firebase functions:log --only error --limit 10

echo "✨ Deployment complete!"
echo "🔍 Please verify the following:"
echo "  1. Visit the deployed site and check functionality"
echo "  2. Monitor Firebase Console for any errors"
echo "  3. Check API response times and cache hit rates"
echo "  4. Verify security rules are working as expected"

# Optional: Run Load Testing
if [ "$1" == "--with-load-test" ]; then
    echo "🔥 Running load tests..."
    npm run test:load
fi
