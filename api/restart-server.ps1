# إيقاف السيرفر القديم
Write-Host "🛑 إيقاف السيرفر القديم..." -ForegroundColor Yellow
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# بدء السيرفر الجديد
Write-Host "🚀 بدء السيرفر الجديد..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; node server.js"

Write-Host "✅ تم إعادة تشغيل السيرفر!" -ForegroundColor Green
Write-Host "⏳ انتظر 3 ثواني ثم اختبر الـ endpoints..." -ForegroundColor Cyan
