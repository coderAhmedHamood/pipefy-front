# Test API Script
$baseUrl = "http://localhost:3004/api"

# Login to get token
$loginBody = @{
    email = "admin@example.com"
    password = "admin123"
} | ConvertTo-Json

Write-Host "🔐 Logging in..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Headers @{'Content-Type'='application/json'} -Body $loginBody
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.data.token
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0,20))..." -ForegroundColor Cyan
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Set authorization header
$headers = @{
    'Authorization' = "Bearer $token"
    'Content-Type' = 'application/json'
}

Write-Host "`n📋 Testing new APIs..." -ForegroundColor Yellow

# Test Automation Rules
Write-Host "`n🤖 Testing Automation Rules API..." -ForegroundColor Cyan
try {
    $automationResponse = Invoke-WebRequest -Uri "$baseUrl/automation/rules" -Method GET -Headers $headers
    $automationData = $automationResponse.Content | ConvertFrom-Json
    Write-Host "✅ Automation Rules: Found $($automationData.data.Count) rules" -ForegroundColor Green
} catch {
    Write-Host "❌ Automation Rules failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Recurring Rules
Write-Host "`n🔄 Testing Recurring Rules API..." -ForegroundColor Cyan
try {
    $recurringResponse = Invoke-WebRequest -Uri "$baseUrl/recurring/rules" -Method GET -Headers $headers
    $recurringData = $recurringResponse.Content | ConvertFrom-Json
    Write-Host "✅ Recurring Rules: Found $($recurringData.data.Count) rules" -ForegroundColor Green
} catch {
    Write-Host "❌ Recurring Rules failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Comments
Write-Host "`n💬 Testing Comments API..." -ForegroundColor Cyan
try {
    $commentsResponse = Invoke-WebRequest -Uri "$baseUrl/comments/search" -Method GET -Headers $headers
    $commentsData = $commentsResponse.Content | ConvertFrom-Json
    Write-Host "✅ Comments: Found $($commentsData.data.Count) comments" -ForegroundColor Green
} catch {
    Write-Host "❌ Comments failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Attachments
Write-Host "`n📎 Testing Attachments API..." -ForegroundColor Cyan
try {
    $attachmentsResponse = Invoke-WebRequest -Uri "$baseUrl/attachments/search" -Method GET -Headers $headers
    $attachmentsData = $attachmentsResponse.Content | ConvertFrom-Json
    Write-Host "✅ Attachments: Found $($attachmentsData.data.Count) attachments" -ForegroundColor Green
} catch {
    Write-Host "❌ Attachments failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Audit Logs
Write-Host "`n🔍 Testing Audit Logs API..." -ForegroundColor Cyan
try {
    $auditResponse = Invoke-WebRequest -Uri "$baseUrl/audit/logs" -Method GET -Headers $headers
    $auditData = $auditResponse.Content | ConvertFrom-Json
    Write-Host "✅ Audit Logs: Found $($auditData.data.Count) logs" -ForegroundColor Green
} catch {
    Write-Host "❌ Audit Logs failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Reports
Write-Host "`n📊 Testing Reports API..." -ForegroundColor Cyan
try {
    $reportsResponse = Invoke-WebRequest -Uri "$baseUrl/reports/dashboard" -Method GET -Headers $headers
    $reportsData = $reportsResponse.Content | ConvertFrom-Json
    Write-Host "✅ Reports Dashboard: $($reportsData.data.general.total_tickets) total tickets" -ForegroundColor Green
} catch {
    Write-Host "❌ Reports failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nAPI Testing Complete!" -ForegroundColor Green
