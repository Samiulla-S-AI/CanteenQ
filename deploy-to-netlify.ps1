# Quick Deploy Script for Netlify
# This script builds your project and prepares it for drag-and-drop deployment

Write-Host ""
Write-Host "🚀 CanteenQ - Quick Deploy to Netlify" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

# Step 1: Check environment
Write-Host "Step 1: Checking environment..." -ForegroundColor Cyan

if (!(Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "📝 Please create a .env file from .env.example" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Run this command:" -ForegroundColor Cyan
    Write-Host "   copy .env.example .env" -ForegroundColor White
    Write-Host ""
    Write-Host "Then edit .env and add your API keys" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Environment file found" -ForegroundColor Green
Write-Host ""

# Step 2: Clean previous build
Write-Host "Step 2: Cleaning previous build..." -ForegroundColor Cyan
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✅ Cleaned previous build" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No previous build found" -ForegroundColor Gray
}
Write-Host ""

# Step 3: Install dependencies
Write-Host "Step 3: Installing dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 4: Build project
Write-Host "Step 4: Building project for production..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Write-Host "Please check the errors above and fix them." -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Build completed successfully!" -ForegroundColor Green
Write-Host ""

# Step 5: Verify build
Write-Host "Step 5: Verifying build..." -ForegroundColor Cyan
if (!(Test-Path "dist")) {
    Write-Host "❌ dist folder not found after build!" -ForegroundColor Red
    exit 1
}

$distFiles = Get-ChildItem -Path "dist" -Recurse
$distSize = ($distFiles | Measure-Object -Property Length -Sum).Sum / 1MB

Write-Host "✅ Build verified" -ForegroundColor Green
Write-Host "📦 Dist folder size: $([math]::Round($distSize, 2)) MB" -ForegroundColor Cyan
Write-Host "📁 Total files: $($distFiles.Count)" -ForegroundColor Cyan
Write-Host ""

# Step 6: Success message
Write-Host "================================================" -ForegroundColor Green
Write-Host "✨ Build Ready for Deployment! ✨" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Your 'dist' folder is ready to deploy!" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Drag & Drop Deployment (Easiest)" -ForegroundColor Cyan
Write-Host "  1. Go to: https://app.netlify.com/drop" -ForegroundColor White
Write-Host "  2. Drag the 'dist' folder onto the page" -ForegroundColor White
Write-Host "  3. Wait for upload to complete" -ForegroundColor White
Write-Host "  4. Set environment variables in Netlify Dashboard" -ForegroundColor White
Write-Host "  5. Redeploy to apply the variables" -ForegroundColor White
Write-Host ""
Write-Host "Option 2: Git Deployment (Recommended)" -ForegroundColor Cyan
Write-Host "  1. Push to GitHub:" -ForegroundColor White
Write-Host "     git add ." -ForegroundColor Gray
Write-Host "     git commit -m 'Ready for deployment'" -ForegroundColor Gray
Write-Host "     git push" -ForegroundColor Gray
Write-Host "  2. Connect to Netlify via GitHub" -ForegroundColor White
Write-Host "  3. Auto-deploy on every push!" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT: Environment Variables" -ForegroundColor Yellow
Write-Host "Don't forget to add these in Netlify Dashboard:" -ForegroundColor White
Write-Host "  - VITE_RAZORPAY_KEY_ID" -ForegroundColor Gray
Write-Host "  - VITE_RAZORPAY_KEY_SECRET" -ForegroundColor Gray
Write-Host "  - VITE_SUPABASE_URL" -ForegroundColor Gray
Write-Host "  - VITE_SUPABASE_ANON_KEY" -ForegroundColor Gray
Write-Host "  - VITE_CLERK_PUBLISHABLE_KEY" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 For detailed instructions, read:" -ForegroundColor Cyan
Write-Host "   - NETLIFY_DEPLOYMENT.md" -ForegroundColor White
Write-Host "   - DEPLOYMENT_CHECKLIST.md" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Happy Deploying!" -ForegroundColor Green
Write-Host ""

# Open the dist folder in Explorer
Write-Host "Opening 'dist' folder in Explorer..." -ForegroundColor Cyan
Start-Process explorer.exe -ArgumentList (Resolve-Path "dist").Path
Write-Host ""
