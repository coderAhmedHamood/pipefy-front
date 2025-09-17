$baseUrl = "http://localhost:3000/api"

$loginBody = @{
    email = "admin@example.com"
    password = "admin123"
} | ConvertTo-Json

Write-Host "Logging in..."
$loginResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Headers @{'Content-Type'='application/json'} -Body $loginBody
$loginData = $loginResponse.Content | ConvertFrom-Json
$token = $loginData.data.token
Write-Host "Login successful!"

$headers = @{
    'Authorization' = "Bearer $token"
    'Content-Type' = 'application/json'
}

Write-Host "Testing Automation Rules..."
$automationResponse = Invoke-WebRequest -Uri "$baseUrl/automation/rules" -Method GET -Headers $headers
$automationData = $automationResponse.Content | ConvertFrom-Json
Write-Host "Found $($automationData.data.Count) automation rules"

Write-Host "Testing Recurring Rules..."
$recurringResponse = Invoke-WebRequest -Uri "$baseUrl/recurring/rules" -Method GET -Headers $headers
$recurringData = $recurringResponse.Content | ConvertFrom-Json
Write-Host "Found $($recurringData.data.Count) recurring rules"

Write-Host "Testing Comments..."
$commentsResponse = Invoke-WebRequest -Uri "$baseUrl/comments/search" -Method GET -Headers $headers
$commentsData = $commentsResponse.Content | ConvertFrom-Json
Write-Host "Found $($commentsData.data.Count) comments"

Write-Host "Testing Attachments..."
$attachmentsResponse = Invoke-WebRequest -Uri "$baseUrl/attachments/search" -Method GET -Headers $headers
$attachmentsData = $attachmentsResponse.Content | ConvertFrom-Json
Write-Host "Found $($attachmentsData.data.Count) attachments"

Write-Host "Testing Audit Logs..."
$auditResponse = Invoke-WebRequest -Uri "$baseUrl/audit/logs" -Method GET -Headers $headers
$auditData = $auditResponse.Content | ConvertFrom-Json
Write-Host "Found $($auditData.data.Count) audit logs"

Write-Host "Testing Reports Dashboard..."
$reportsResponse = Invoke-WebRequest -Uri "$baseUrl/reports/dashboard" -Method GET -Headers $headers
$reportsData = $reportsResponse.Content | ConvertFrom-Json
Write-Host "Total tickets: $($reportsData.data.general.total_tickets)"

Write-Host "All tests completed successfully!"
