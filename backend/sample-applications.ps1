
# Enter your existing JobTrack credentials
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

    $token = $login.token
}
finally {
    if ($ptr -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }
    $password = $null
}

$headers = @{
    Authorization = "Bearer $token"
}

$today = Get-Date

$applications = @(
    @{
        company = "Acme Technologies"
        jobTitle = "Senior React Developer"
        location = "Remote"
        status = "Interview"
        appliedDate = $today.AddDays(-5).ToString("yyyy-MM-dd")
        interviewDate = $today.AddDays(3).ToString("yyyy-MM-dd")
        notes = "Technical interview scheduled"
    },
    @{
        company = "Nova Digital"
        jobTitle = "Frontend Engineer"
        location = "Bengaluru"
        status = "Applied"
        appliedDate = $today.AddDays(-15).ToString("yyyy-MM-dd")
        notes = "Application submitted"
    },
    @{
        company = "CloudWorks"
        jobTitle = "Senior Software Developer"
        location = "Remote"
        status = "Offer"
        appliedDate = $today.AddDays(-35).ToString("yyyy-MM-dd")
        notes = "Offer received"
    }
)

foreach ($application in $applications) {
    $body = $application | ConvertTo-Json -Depth 5

    Invoke-RestMethod `
        -Method Post `
        -Uri "http://localhost:5001/api/jobs" `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $body
}

Write-Host "Three sample applications created successfully."
