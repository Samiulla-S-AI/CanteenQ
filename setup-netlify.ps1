# Netlify CLI Setup and Testing Script

Write-Host "🚀 CanteenQ - Netlify Setup Script" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
Write-Host "📦 Checking Node.js installation..." -ForegroundColor Cyan
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
$npmVersion = npm --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ npm installed: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "❌ npm is not installed. Please install npm first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
Write-Host ""

# Check if Netlify CLI is installed
Write-Host "🔧 Checking Netlify CLI..." -ForegroundColor Cyan
$netlifyVersion = netlify --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚙️  Installing Netlify CLI globally..." -ForegroundColor Yellow
    npm install -g netlify-cli
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Netlify CLI installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install Netlify CLI." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Netlify CLI already installed: $netlifyVersion" -ForegroundColor Green
}

Write-Host ""
Write-Host "🏗️  Building the project..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Please check the errors above." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed successfully!" -ForegroundColor Green
Write-Host ""

Write-Host "================================================" -ForegroundColor Green
Write-Host "✨ Setup Complete! ✨" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "What's Next?" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Test locally with Netlify Functions:" -ForegroundColor Yellow
Write-Host "   npm run dev:netlify" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣  Deploy to Netlify (Drag & Drop):" -ForegroundColor Yellow
Write-Host "   - Go to: https://app.netlify.com/drop" -ForegroundColor White
Write-Host "   - Drag the 'dist' folder onto the page" -ForegroundColor White
Write-Host "   - Set environment variables (see .env.example)" -ForegroundColor White
Write-Host ""
Write-Host "3️⃣  Or deploy via Git:" -ForegroundColor Yellow
Write-Host "   - Push to GitHub" -ForegroundColor White
Write-Host "   - Connect repository in Netlify" -ForegroundColor White
Write-Host "   - Auto-deploy on every push!" -ForegroundColor White
Write-Host ""
Write-Host "📚 Read NETLIFY_DEPLOYMENT.md for detailed instructions" -ForegroundColor Cyan
Write-Host ""
