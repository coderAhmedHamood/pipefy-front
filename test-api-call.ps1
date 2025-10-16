$response = Invoke-RestMethod -Uri 'http://localhost:3003/api/reports/process/d6f7574c-d937-4e55-8cb1-0b19269e6061' -Method Get -Headers @{
    'accept'='application/json'
    'Authorization'='Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMDBhMmY4ZS0yODQzLTQxZGEtODA4MC02ZWI0Y2QwYTcwNmIiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IjRkOWJlZjgzLWI2NGItNDg0Mi1iNDI4LTMzODFjYWY3YzEyMyIsImlhdCI6MTc2MDY0NTk5MSwiZXhwIjoxNzYwNzMyMzkxfQ.vu12BCN4M2YsLdl_ivlYoKsK7RKhvbsNFFEDCnQ3GpQ'
}

Write-Host "net_performance_hours: $($response.data.performance_metrics.net_performance_hours)"
