#!/bin/bash
# Railway Deployment Quick Start
# Run this script untuk deploy ke Railway dalam hitungan menit

set -e

echo "🚀 VeridFace Railway Deployment Helper"
echo "======================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi
echo "✅ Node.js $(node -v) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found"
    exit 1
fi
echo "✅ npm $(npm -v) detected"

# Check git
if ! command -v git &> /dev/null; then
    echo "❌ git not found"
    exit 1
fi
echo "✅ git $(git --version | awk '{print $3}')"

echo ""
echo "📋 Checking project structure..."

# Check essential files
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found"
    exit 1
fi
echo "✅ package.json found"

if [ ! -f "src/index.js" ]; then
    echo "❌ src/index.js not found"
    exit 1
fi
echo "✅ src/index.js found"

if [ ! -f "railway.json" ]; then
    echo "❌ railway.json not found"
    exit 1
fi
echo "✅ railway.json configured"

echo ""
echo "🔐 Checking credentials..."
if grep -q "process.env" src/index.js; then
    echo "✅ Code using environment variables"
else
    echo "⚠️  Warning: Check for hardcoded credentials"
fi

echo ""
echo "📦 Dependencies check..."
npm list --depth=0 > /dev/null 2>&1 || {
    echo "⚠️  node_modules not installed, installing..."
    npm install
}
echo "✅ Dependencies OK"

echo ""
echo "✅ All checks passed!"
echo ""
echo "════════════════════════════════════════"
echo "Next steps for Railway deployment:"
echo "════════════════════════════════════════"
echo ""
echo "1️⃣  Ensure .env is in .gitignore"
echo "   grep '.env' .gitignore > /dev/null && echo 'OK' || echo 'MISSING'"
echo ""
echo "2️⃣  Push to GitHub"
echo "   git add ."
echo "   git commit -m 'Ready for Railway deployment'"
echo "   git push origin main"
echo ""
echo "3️⃣  Install Railway CLI (optional)"
echo "   npm install -g @railway/cli"
echo ""
echo "4️⃣  Go to https://railway.app"
echo "   - Login dengan GitHub account"
echo "   - Create New Project"
echo "   - Select 'Deploy from GitHub'"
echo "   - Authorize app dan pilih repo ini"
echo ""
echo "5️⃣  Set Environment Variables di Railway Dashboard:"
echo "   - MYSQLHOST"
echo "   - MYSQLPORT (3306)"
echo "   - MYSQLUSER"
echo "   - MYSQLPASSWORD"
echo "   - MYSQLDATABASE (veridface)"
echo "   - MQTT_BROKER_URL (optional)"
echo "   - MQTT_USERNAME (optional)"
echo "   - MQTT_PASSWORD (optional)"
echo "   - LOG_LEVEL (info)"
echo ""
echo "6️⃣  Add MySQL Service (optional)"
echo "   - Di Railway dashboard: Add Service → MySQL"
echo "   - Variables akan auto-added"
echo ""
echo "7️⃣  Deploy! 🎉"
echo "   - Push button di Railway atau 'railway up'"
echo ""
echo "8️⃣  Test endpoints:"
echo "   - curl https://your-railway-url.railway.app/"
echo "   - curl https://your-railway-url.railway.app/health"
echo ""
echo "📖 For more details, see:"
echo "   - RAILWAY_DEPLOYMENT.md"
echo "   - DEPLOYMENT_CHECKLIST.md"
echo ""
