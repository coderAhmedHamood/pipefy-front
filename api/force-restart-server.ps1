# سكريبت لإعادة تشغيل السيرفر بالقوة

Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Red
Write-Host "⚠️  إعادة تشغيل السيرفر بالقوة" -ForegroundColor Red
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Red
Write-Host ""

# الخطوة 1: إيقاف جميع عمليات Node.js على المنفذ 3004
Write-Host "1️⃣ إيقاف السيرفر القديم..." -ForegroundColor Yellow

try {
    $connections = Get-NetTCPConnection -LocalPort 3004 -ErrorAction SilentlyContinue
    if ($connections) {
        $processes = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($proc in $processes) {
            Write-Host "   ⏹️  إيقاف العملية $proc..." -ForegroundColor Gray
            Stop-Process -Id $proc -Force -ErrorAction SilentlyContinue
            Write-Host "   ✅ تم إيقاف العملية $proc" -ForegroundColor Green
        }
        Start-Sleep -Seconds 2
    } else {
        Write-Host "   ℹ️  لا توجد عملية تعمل على المنفذ 3004" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ⚠️  لم نتمكن من إيقاف العمليات تلقائياً" -ForegroundColor Yellow
    Write-Host "   💡 يرجى إيقاف السيرفر يدوياً بـ Ctrl+C" -ForegroundColor Yellow
}

Write-Host ""

# الخطوة 2: الانتقال إلى مجلد المشروع
Write-Host "2️⃣ الانتقال إلى مجلد المشروع..." -ForegroundColor Yellow
Set-Location "e:\laravel\xampp old\htdocs\laravel\pipefy-main\project\api"
Write-Host "   ✅ تم" -ForegroundColor Green

Write-Host ""

# الخطوة 3: بدء السيرفر
Write-Host "3️⃣ بدء السيرفر..." -ForegroundColor Yellow
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 السيرفر يبدأ الآن..." -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "⏳ انتظر حتى ترى: 'Database connected successfully!'" -ForegroundColor Yellow
Write-Host ""

# بدء السيرفر
npm run dev
