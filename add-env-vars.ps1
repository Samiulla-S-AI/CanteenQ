# Add Environment Variables to Netlify

Write-Host ""
Write-Host "🔐 Adding Environment Variables to Netlify" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""

Write-Host "⚠️  IMPORTANT: You need to add your API keys to Netlify!" -ForegroundColor Yellow
Write-Host ""

Write-Host "📋 Copy these commands and replace with YOUR actual values from .env file:" -ForegroundColor Cyan
Write-Host ""

Write-Host "# Razorpay Keys" -ForegroundColor Yellow
Write-Host 'netlify env:set VITE_RAZORPAY_KEY_ID "YOUR_RAZORPAY_KEY_ID_HERE"' -ForegroundColor White
Write-Host 'netlify env:set VITE_RAZORPAY_KEY_SECRET "YOUR_RAZORPAY_SECRET_HERE"' -ForegroundColor White
Write-Host ""

Write-Host "# Supabase Keys" -ForegroundColor Yellow
Write-Host 'netlify env:set VITE_SUPABASE_URL "YOUR_SUPABASE_URL_HERE"' -ForegroundColor White
Write-Host 'netlify env:set VITE_SUPABASE_ANON_KEY "YOUR_SUPABASE_ANON_KEY_HERE"' -ForegroundColor White
Write-Host ""

Write-Host "# Clerk Key" -ForegroundColor Yellow
Write-Host 'netlify env:set VITE_CLERK_PUBLISHABLE_KEY "YOUR_CLERK_KEY_HERE"' -ForegroundColor White
Write-Host ""

Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Instructions:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Open your .env file:" -ForegroundColor Yellow
Write-Host "   notepad .env" -ForegroundColor White
Write-Host ""
Write-Host "2. Copy each value from .env" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Run each netlify env:set command above with YOUR values" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. After adding all variables, redeploy:" -ForegroundColor Yellow
Write-Host "   netlify deploy --prod" -ForegroundColor White
Write-Host ""

Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Example (with fake values):" -ForegroundColor Cyan
Write-Host ""
Write-Host 'netlify env:set VITE_RAZORPAY_KEY_ID "rzp_test_abc123xyz"' -ForegroundColor Gray
Write-Host 'netlify env:set VITE_RAZORPAY_KEY_SECRET "mysecretkey123"' -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  Replace with YOUR actual keys from .env!" -ForegroundColor Yellow
Write-Host ""
