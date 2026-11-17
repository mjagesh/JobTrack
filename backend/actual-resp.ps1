$email = Read-Host "Enter your registered email"
$securePassword = Read-Host "Enter your password" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)

try {
    $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)

    $login = Invoke-RestMethod `
        -Method Post `
        -Uri "http://localhost:5001/api/auth/login" `
        -ContentType "application/json" `
        -Body (@{
            email = $email
            password = $password
        } | ConvertTo-Json)
}
finally {
    if ($ptr -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }
    $password = $null
}

$headers = @{
    Authorization = "Bearer $($login.token)"
}

Write-Host "`n--- ANALYTICS RESPONSE ---"
$analytics = Invoke-RestMethod `
    -Uri "http://localhost:5001/api/analytics" `
    -Headers $headers

$analytics | ConvertTo-Json -Depth 8

Write-Host "`n--- JOB APPLICATIONS RESPONSE ---"
$jobs = Invoke-RestMethod `
    -Uri "http://localhost:5001/api/jobs" `
    -Headers $headers

$jobs | ConvertTo-Json -Depth 8