$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:5001/api"
$email = "jobtrack.test.20261012121458@example.com"
$password = "JobTrackTest123!"

Write-Host "`n=== 1. LOGIN ===" -ForegroundColor Cyan

$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

$login = Invoke-RestMethod `
    -Method Post `
    -Uri "$baseUrl/auth/login" `
    -ContentType "application/json" `
    -Body $loginBody

$headers = @{
    Authorization = "Bearer $($login.token)"
}

Write-Host "Login successful" -ForegroundColor Green

Write-Host "`n=== 2. FETCH ANALYTICS ===" -ForegroundColor Cyan

$dashboard = Invoke-RestMethod `
    -Method Get `
    -Uri "$baseUrl/analytics" `
    -Headers $headers

$dashboard.analytics | ConvertTo-Json -Depth 10

Write-Host "`n=== 3. TEST AUTHENTICATION ===" -ForegroundColor Cyan

try {
    Invoke-RestMethod -Method Get -Uri "$baseUrl/analytics"
    throw "ERROR: Analytics endpoint accepted a request without a token."
} catch {
    if ($_.Exception.Response.StatusCode.value__ -ne 401) {
        throw
    }

    Write-Host "Unauthorized request correctly rejected" -ForegroundColor Green
}

Write-Host "`n=== ANALYTICS TEST COMPLETED ===" -ForegroundColor Green