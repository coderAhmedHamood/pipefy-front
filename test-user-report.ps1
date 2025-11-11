$headers = @{
    'accept' = 'application/json'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1ODhiZTMxZi03MTMwLTQwZjItOTJjOS0zNGRhNDFhMjAxNDIiLCJlbWFpbCI6ImFkbWluQHBpcGVmeS5jb20iLCJyb2xlIjoiNTUwZTg0MDAtZTI5Yi00MWQ0LWE3MTYtNDQ2NjU1NDQwMDAxIiwiaWF0IjoxNzYwNTU3MzMyLCJleHAiOjE3NjA2NDM3MzJ9.rNRAxWSGZR915-9ebRkfnqwhWynp3e240QLwCqufBjU'
}

Write-Host "Testing User Report API..." -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:3004/api/reports/user/588be31f-7130-40f2-92c9-34da41a20142' -Method Get -Headers $headers
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "User Info:" -ForegroundColor Yellow
    Write-Host "  Name: $($response.data.user.name)"
    Write-Host "  Email: $($response.data.user.email)"
    Write-Host "  Role: $($response.data.user.role.name)"
    Write-Host ""
    Write-Host "Basic Stats:" -ForegroundColor Yellow
    Write-Host "  Total Tickets: $($response.data.basic_stats.total_tickets)"
    Write-Host "  Active: $($response.data.basic_stats.active_tickets)"
    Write-Host "  Completed: $($response.data.basic_stats.completed_tickets)"
    Write-Host "  Overdue: $($response.data.basic_stats.overdue_tickets)"
    Write-Host ""
    Write-Host "Stage Distribution:" -ForegroundColor Yellow
    foreach ($stage in $response.data.stage_distribution) {
        Write-Host "  - $($stage.stage_name) ($($stage.process_name)): $($stage.ticket_count) tickets ($($stage.percentage)%)"
    }
    Write-Host ""
    Write-Host "Priority Distribution:" -ForegroundColor Yellow
    foreach ($priority in $response.data.priority_distribution) {
        Write-Host "  - $($priority.priority): $($priority.count) tickets ($($priority.percentage)%)"
    }
    Write-Host ""
    Write-Host "Completion Rate:" -ForegroundColor Yellow
    Write-Host "  Completed: $($response.data.completion_rate.completed_count)"
    Write-Host "  On Time: $($response.data.completion_rate.on_time_count)"
    Write-Host "  Late: $($response.data.completion_rate.late_count)"
    Write-Host "  Avg Days: $($response.data.completion_rate.avg_completion_days)"
    Write-Host "  On Time %: $($response.data.completion_rate.on_time_percentage)%"
    
} catch {
    Write-Host "❌ Error!" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    }
}
