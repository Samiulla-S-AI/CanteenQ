# Quick Fix Script - Deploy to Netlify Properly

Write-Host ""
Write-Host "🚀 CanteenQ - Proper Netlify Deployment" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "This script will deploy your app WITH functions!" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Netlify CLI
Write-Host "Step 1: Checking Netlify CLI..." -ForegroundColor Cyan
$netlifyVersion = netlify --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Netlify CLI not found!" -ForegroundColor Red
    Write-Host "Installing Netlify CLI..." -ForegroundColor Yellow
    npm install -g netlify-cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Netlify CLI" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Netlify CLI ready: $netlifyVersion" -ForegroundColor Green
Write-Host ""

# Step 2: Build the project
Write-Host "Step 2: Building project..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build completed!" -ForegroundColor Green
Write-Host ""

# Step 3: Instructions for deployment
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Ready to Deploy!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host ""

Write-Host "1️⃣  Delete your current broken Netlify site:" -ForegroundColor Cyan
Write-Host "   - Go to: https://app.netlify.com/" -ForegroundColor White
Write-Host "   - Click your site: silly-kringle-fbd730" -ForegroundColor White
Write-Host "   - Site settings → Danger zone → Delete site" -ForegroundColor White
Write-Host ""

Write-Host "2️⃣  Login to Netlify CLI:" -ForegroundColor Cyan
Write-Host "   netlify login" -ForegroundColor Yellow
Write-Host ""

Write-Host "3️⃣  Deploy to Netlify:" -ForegroundColor Cyan
Write-Host "   netlify deploy" -ForegroundColor Yellow
Write-Host ""
Write-Host "   When prompted:" -ForegroundColor White
Write-Host "   - Create new site? → Press Enter (Yes)" -ForegroundColor Gray
Write-Host "   - Site name → Type: canteenq" -ForegroundColor Gray
Write-Host "   - Publish directory → Type: dist" -ForegroundColor Gray
Write-Host ""

Write-Host "4️⃣  Test the draft URL it gives you" -ForegroundColor Cyan
Write-Host "   Visit: [draft-url]/api/commission-details/test" -ForegroundColor White
Write-Host "   Should return: {\"status\":\"ok\"}" -ForegroundColor Gray
Write-Host ""

Write-Host "5️⃣  If it works, deploy to production:" -ForegroundColor Cyan
Write-Host "   netlify deploy --prod" -ForegroundColor Yellow
Write-Host ""

Write-Host "6️⃣  Add environment variables:" -ForegroundColor Cyan
Write-Host "   netlify env:set VITE_RAZORPAY_KEY_ID \"your_key\"" -ForegroundColor Yellow
Write-Host "   netlify env:set VITE_RAZORPAY_KEY_SECRET \"your_secret\"" -ForegroundColor Yellow
Write-Host "   netlify env:set VITE_SUPABASE_URL \"your_url\"" -ForegroundColor Yellow
Write-Host "   netlify env:set VITE_SUPABASE_ANON_KEY \"your_key\"" -ForegroundColor Yellow
Write-Host "   netlify env:set VITE_CLERK_PUBLISHABLE_KEY \"your_key\"" -ForegroundColor Yellow
Write-Host ""

Write-Host "7️⃣  Redeploy with env vars:" -ForegroundColor Cyan
Write-Host "   netlify deploy --prod" -ForegroundColor Yellow
Write-Host ""

Write-Host "================================================" -ForegroundColor Green
Write-Host "📚 For detailed instructions, read:" -ForegroundColor Cyan
Write-Host "   - DEPLOY_WITH_CLI.md" -ForegroundColor White
Write-Host "   - FIX_404_ERROR.md" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Ready? Start with:" -ForegroundColor Yellow
Write-Host "   netlify login" -ForegroundColor White
Write-Host ""
