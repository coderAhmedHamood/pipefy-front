# سكريبت لإعادة تشغيل السيرفر واختبار الإشعارات

Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔄 إعادة تشغيل السيرفر واختبار Notification Endpoints" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# الخطوة 1: إيقاف أي عملية Node.js تعمل على المنفذ 3004
Write-Host "1️⃣ إيقاف السيرفر القديم..." -ForegroundColor Yellow
$processes = Get-NetTCPConnection -LocalPort 3004 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($processes) {
    foreach ($proc in $processes) {
        Stop-Process -Id $proc -Force -ErrorAction SilentlyContinue
        Write-Host "   ✅ تم إيقاف العملية $proc" -ForegroundColor Green
    }
    Start-Sleep -Seconds 2
} else {
    Write-Host "   ℹ️  لا توجد عملية تعمل على المنفذ 3004" -ForegroundColor Gray
}

Write-Host ""

# الخطوة 2: بدء السيرفر في الخلفية
Write-Host "2️⃣ بدء السيرفر..." -ForegroundColor Yellow
$job = Start-Job -ScriptBlock {
    Set-Location "e:\laravel\xampp old\htdocs\laravel\pipefy-main\project\api"
    npm run dev
}

Write-Host "   ⏳ انتظار بدء السيرفر..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# الخطوة 3: التحقق من أن السيرفر يعمل
Write-Host ""
Write-Host "3️⃣ التحقق من السيرفر..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3004/api" -UseBasicParsing -TimeoutSec 5
    Write-Host "   ✅ السيرفر يعمل بنجاح!" -ForegroundColor Green
} catch {
    Write-Host "   ❌ السيرفر لم يبدأ بعد، انتظر قليلاً..." -ForegroundColor Red
    Start-Sleep -Seconds 5
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ السيرفر جاهز! الآن يمكنك اختبار الـ endpoints" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 للاختبار، شغّل:" -ForegroundColor Yellow
Write-Host "   node test-fix-verification.js" -ForegroundColor White
Write-Host ""
Write-Host "🌐 أو افتح Swagger UI:" -ForegroundColor Yellow
Write-Host "   http://localhost:3004/api-docs" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  ملاحظة: السيرفر يعمل الآن في الخلفية" -ForegroundColor Yellow
Write-Host "   لإيقافه، استخدم: Stop-Job -Id $($job.Id); Remove-Job -Id $($job.Id)" -ForegroundColor Gray
Write-Host ""
