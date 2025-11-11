$headers = @{
    'accept' = 'application/json'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1ODhiZTMxZi03MTMwLTQwZjItOTJjOS0zNGRhNDFhMjAxNDIiLCJlbWFpbCI6ImFkbWluQHBpcGVmeS5jb20iLCJyb2xlIjoiNTUwZTg0MDAtZTI5Yi00MWQ0LWE3MTYtNDQ2NjU1NDQwMDAxIiwiaWF0IjoxNzYwNTU3MzMyLCJleHAiOjE3NjA2NDM3MzJ9.rNRAxWSGZR915-9ebRkfnqwhWynp3e240QLwCqufBjU'
}

Write-Host "Testing Process Report API with Performance Metrics..." -ForegroundColor Cyan
Write-Host ""

try {
    # استبدل بـ process_id الخاص بك
    $processId = "YOUR_PROCESS_ID_HERE"
    $response = Invoke-RestMethod -Uri "http://localhost:3004/api/reports/process/$processId" -Method Get -Headers $headers
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Process Info:" -ForegroundColor Yellow
    Write-Host "  Name: $($response.data.process.name)"
    Write-Host ""
    
    Write-Host "Basic Stats:" -ForegroundColor Yellow
    Write-Host "  Total Tickets: $($response.data.basic_stats.total_tickets)"
    Write-Host "  Completed: $($response.data.basic_stats.completed_tickets)"
    Write-Host "  Overdue: $($response.data.basic_stats.overdue_tickets)"
    Write-Host ""
    
    if ($response.data.performance_metrics) {
        Write-Host "Performance Metrics:" -ForegroundColor Green
        Write-Host "  Total Completed with Due Date: $($response.data.performance_metrics.total_completed_with_due_date)"
        Write-Host "  Early Completed: $($response.data.performance_metrics.early_completed) ($($response.data.performance_metrics.early_rate)%)"
        Write-Host "  On Time Completed: $($response.data.performance_metrics.on_time_completed) ($($response.data.performance_metrics.on_time_rate)%)"
        Write-Host "  Late Completed: $($response.data.performance_metrics.late_completed) ($($response.data.performance_metrics.late_rate)%)"
        Write-Host ""
        Write-Host "  Avg Actual Days: $($response.data.performance_metrics.avg_actual_days)"
        Write-Host "  Avg Planned Days: $($response.data.performance_metrics.avg_planned_days)"
        Write-Host "  Avg Variance Days: $($response.data.performance_metrics.avg_variance_days)"
        Write-Host ""
        Write-Host "  Total Days Saved: $($response.data.performance_metrics.total_days_saved)"
        Write-Host "  Total Days Delayed: $($response.data.performance_metrics.total_days_delayed)"
        Write-Host "  Net Performance Days: $($response.data.performance_metrics.net_performance_days)" -ForegroundColor $(
            if ([double]$response.data.performance_metrics.net_performance_days -ge 0) { "Green" } else { "Red" }
        )
        Write-Host ""
    }
    
    if ($response.data.completed_tickets_details) {
        Write-Host "Completed Tickets Details: $($response.data.completed_tickets_details.Count) tickets" -ForegroundColor Magenta
        Write-Host ""
        foreach ($ticket in $response.data.completed_tickets_details | Select-Object -First 3) {
            Write-Host "  - $($ticket.ticket_number): $($ticket.title)"
            Write-Host "    Priority: $($ticket.priority) | Assigned: $($ticket.assigned_to_name)"
            Write-Host "    Actual: $($ticket.actual_days) days | Planned: $($ticket.planned_days) days | Variance: $($ticket.variance_days) days"
            Write-Host "    Status: $($ticket.performance_status)" -ForegroundColor $(
                if ($ticket.performance_status -eq "early") { "Green" }
                elseif ($ticket.performance_status -eq "on_time") { "Yellow" }
                else { "Red" }
            )
            Write-Host ""
        }
        if ($response.data.completed_tickets_details.Count -gt 3) {
            Write-Host "  ... and $($response.data.completed_tickets_details.Count - 3) more tickets"
        }
    }
    
} catch {
    Write-Host "❌ Error!" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    }
}
