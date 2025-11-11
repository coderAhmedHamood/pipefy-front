$headers = @{
    'accept' = 'application/json'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMDBhMmY4ZS0yODQzLTQxZGEtODA4MC02ZWI0Y2QwYTcwNmIiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IjRkOWJlZjgzLWI2NGItNDg0Mi1iNDI4LTMzODFjYWY3YzEyMyIsImlhdCI6MTc2MDY0NTk5MSwiZXhwIjoxNzYwNzMyMzkxfQ.vu12BCN4M2YsLdl_ivlYoKsK7RKhvbsNFFEDCnQ3GpQ'
}

Write-Host "Checking Completed Tickets Data..." -ForegroundColor Cyan
Write-Host ""

try {
    $processId = "d6f7574c-d937-4e55-8cb1-0b19269e6061"
    $response = Invoke-RestMethod -Uri "http://localhost:3004/api/reports/process/$processId" -Method Get -Headers $headers
    
    Write-Host "Stage Distribution:" -ForegroundColor Yellow
    $response.data.stage_distribution | ForEach-Object {
        $finalMark = if ($_.is_final) { " ← FINAL STAGE" } else { "" }
        Write-Host "  - $($_.stage_name): $($_.ticket_count) tickets (is_final: $($_.is_final))$finalMark" -ForegroundColor $(if ($_.is_final) { "Green" } else { "Gray" })
    }
    
    Write-Host ""
    Write-Host "Recent Tickets (showing completed ones):" -ForegroundColor Yellow
    $completedTickets = $response.data.recent_tickets | Where-Object { $_.completed_at -ne $null }
    
    if ($completedTickets.Count -gt 0) {
        $completedTickets | ForEach-Object {
            Write-Host ""
            Write-Host "  Ticket: $($_.ticket_number)" -ForegroundColor Cyan
            Write-Host "    Stage: $($_.stage_name)" -ForegroundColor Gray
            Write-Host "    Status: $($_.status)" -ForegroundColor Gray
            Write-Host "    Created: $($_.created_at)" -ForegroundColor Gray
            Write-Host "    Due: $($_.due_date)" -ForegroundColor Gray
            Write-Host "    Completed: $($_.completed_at)" -ForegroundColor Gray
            
            if ($_.due_date -and $_.completed_at) {
                $due = [DateTime]::Parse($_.due_date)
                $completed = [DateTime]::Parse($_.completed_at)
                $diff = ($due - $completed).TotalHours
                Write-Host "    Variance: $($diff.ToString('F2')) hours" -ForegroundColor $(if ($diff -gt 0) { "Green" } else { "Red" })
            }
        }
        
        Write-Host ""
        Write-Host "Total Completed Tickets with due_date: $($completedTickets.Count)" -ForegroundColor Cyan
    } else {
        Write-Host "  No completed tickets found!" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Completion Rate Data:" -ForegroundColor Yellow
    Write-Host "  Completed Count: $($response.data.completion_rate.completed_count)" -ForegroundColor Gray
    Write-Host "  On Time Count: $($response.data.completion_rate.on_time_count)" -ForegroundColor Gray
    Write-Host "  Late Count: $($response.data.completion_rate.late_count)" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Error!" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
