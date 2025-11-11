$headers = @{
    'accept' = 'application/json'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMDBhMmY4ZS0yODQzLTQxZGEtODA4MC02ZWI0Y2QwYTcwNmIiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IjRkOWJlZjgzLWI2NGItNDg0Mi1iNDI4LTMzODFjYWY3YzEyMyIsImlhdCI6MTc2MDY0NTk5MSwiZXhwIjoxNzYwNzMyMzkxfQ.vu12BCN4M2YsLdl_ivlYoKsK7RKhvbsNFFEDCnQ3GpQ'
}

Write-Host "Testing Performance Metrics API..." -ForegroundColor Cyan
Write-Host ""

try {
    $processId = "d6f7574c-d937-4e55-8cb1-0b19269e6061"
    $response = Invoke-RestMethod -Uri "http://localhost:3004/api/reports/process/$processId" -Method Get -Headers $headers
    
    Write-Host "✅ API Response Received" -ForegroundColor Green
    Write-Host ""
    
    # Check if performance_metrics exists
    if ($response.data.performance_metrics) {
        Write-Host "✅ performance_metrics EXISTS" -ForegroundColor Green
        Write-Host "   Structure:" -ForegroundColor Yellow
        $response.data.performance_metrics | ConvertTo-Json -Depth 3
        Write-Host ""
        
        if ($response.data.performance_metrics.net_performance_hours) {
            Write-Host "✅ net_performance_hours EXISTS" -ForegroundColor Green
            Write-Host "   Value: $($response.data.performance_metrics.net_performance_hours)" -ForegroundColor Cyan
            
            $hours = [double]$response.data.performance_metrics.net_performance_hours
            $absHours = [Math]::Abs($hours)
            $days = [Math]::Floor($absHours / 24)
            $remainingHours = [Math]::Floor($absHours % 24)
            
            Write-Host ""
            Write-Host "Calculated Display:" -ForegroundColor Yellow
            if ($absHours -ge 24) {
                Write-Host "   $days يوم $remainingHours ساعة" -ForegroundColor $(if ($hours -lt 0) { "Red" } else { "Green" })
            } else {
                Write-Host "   $($hours.ToString('F1')) ساعة" -ForegroundColor $(if ($hours -lt 0) { "Red" } else { "Green" })
            }
        } else {
            Write-Host "❌ net_performance_hours is NULL or MISSING" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ performance_metrics DOES NOT EXIST" -ForegroundColor Red
        Write-Host ""
        Write-Host "Available keys in data:" -ForegroundColor Yellow
        $response.data.PSObject.Properties.Name | ForEach-Object {
            Write-Host "   - $_" -ForegroundColor Gray
        }
    }
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    # Check if completed_tickets_details exists
    if ($response.data.completed_tickets_details) {
        Write-Host "✅ completed_tickets_details EXISTS" -ForegroundColor Green
        Write-Host "   Count: $($response.data.completed_tickets_details.Count)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ completed_tickets_details DOES NOT EXIST" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Error!" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    }
}
