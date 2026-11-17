
# JobTrack Backend API Test Script
# Run from the backend folder:
# .\test-backend.ps1

$BaseUrl = "http://localhost:5001"
$TestPrefix = "jobtrack-test-$(Get-Date -Format 'yyyyMMddHHmmss')"
$TestEmail = "$TestPrefix@example.com"
$TestPassword = "TestPass123!"

$script:Passed = 0
$script:Failed = 0
$script:Token = $null
$script:JobId = $null

function Write-TestResult {
    param(
        [string]$Name,
        [bool]$Success,
        [string]$Details = ""
    )

    if ($Success) {
        $script:Passed++
        Write-Host "[PASS] $Name $Details" -ForegroundColor Green
    }
    else {
        $script:Failed++
        Write-Host "[FAIL] $Name $Details" -ForegroundColor Red
    }
}

function Invoke-Api {
    param(
        [Parameter(Mandatory)]
        [string]$Method,

        [Parameter(Mandatory)]
        [string]$Path,

        [object]$Body = $null,

        [switch]$Authenticated
    )

    $Headers = @{}
    if ($Authenticated) {
        $Headers["Authorization"] = "Bearer $script:Token"
    }

    $Params = @{
        Uri             = "$BaseUrl$Path"
        Method          = $Method
        Headers         = $Headers
        UseBasicParsing = $true
        ErrorAction     = "Stop"
    }

    if ($null -ne $Body) {
        $Params["ContentType"] = "application/json"
        $Params["Body"] = ConvertTo-Json -InputObject $Body -Depth 10
    }

    try {
        $Response = Invoke-WebRequest @Params
        $ParsedBody = $null

        if ($Response.Content) {
            $ParsedBody = $Response.Content | ConvertFrom-Json
        }

        return @{
            Status = [int]$Response.StatusCode
            Body   = $ParsedBody
        }
    }
    catch {
        $StatusCode = 0
        $ParsedBody = $null

        if ($_.Exception.Response) {
            try {
                $StatusCode = [int]$_.Exception.Response.StatusCode
                $Stream = $_.Exception.Response.GetResponseStream()

                if ($Stream) {
                    $Reader = New-Object System.IO.StreamReader($Stream)
                    $Content = $Reader.ReadToEnd()
                    $Reader.Close()

                    if ($Content) {
                        try {
                            $ParsedBody = $Content | ConvertFrom-Json
                        }
                        catch {
                            $ParsedBody = $Content
                        }
                    }
                }
            }
            catch {
                # Keep the available status and response details.
            }
        }

        return @{
            Status = $StatusCode
            Body   = $ParsedBody
        }
    }
}

function Test-Api {
    param(
        [string]$Name,
        [scriptblock]$Action
    )

    try {
        & $Action
    }
    catch {
        Write-TestResult -Name $Name -Success $false `
            -Details "Unexpected error: $($_.Exception.Message)"
    }
}

Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host " JobTrack Backend API Tests" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

# 1. Check whether the backend is running.
Test-Api "Backend is reachable" {
    $Response = Invoke-Api -Method GET -Path "/api/jobs"
    # An unauthenticated request should normally return 401 or 403.
    $Ok = $Response.Status -in @(401, 403)
    Write-TestResult "Backend is reachable" $Ok `
        "(HTTP $($Response.Status))"
}

# 2. Register a dedicated test user.
Test-Api "Register test user" {
    $Response = Invoke-Api -Method POST -Path "/api/auth/register" -Body @{
        name     = "JobTrack API Test"
        email    = $TestEmail
        password = $TestPassword
    }

    $Ok = $Response.Status -in @(200, 201) -and
          $Response.Body.success -eq $true -and
          -not [string]::IsNullOrWhiteSpace($Response.Body.token)

    if ($Ok) {
        $script:Token = $Response.Body.token
    }

    Write-TestResult "Register test user" $Ok `
        "(HTTP $($Response.Status))"
}

# 3. Verify login using the newly registered account.
Test-Api "Login test user" {
    $Response = Invoke-Api -Method POST -Path "/api/auth/login" -Body @{
        email    = $TestEmail
        password = $TestPassword
    }

    $Ok = $Response.Status -eq 200 -and
          $Response.Body.success -eq $true -and
          -not [string]::IsNullOrWhiteSpace($Response.Body.token)

    if ($Ok) {
        $script:Token = $Response.Body.token
    }

    Write-TestResult "Login test user" $Ok `
        "(HTTP $($Response.Status))"
}

if (-not $script:Token) {
    Write-Host "`nAuthentication failed. Remaining tests cannot run." `
        -ForegroundColor Red
    Write-Host "Check the auth routes and backend terminal output."
    return
}

# 4. Verify the authenticated user endpoint.
Test-Api "Get current user" {
    $Response = Invoke-Api -Method GET -Path "/api/auth/me" -Authenticated
    $Ok = $Response.Status -eq 200 -and $Response.Body.success -eq $true
    Write-TestResult "Get current user" $Ok "(HTTP $($Response.Status))"
}

# 5. Create a valid job application.
$AppliedDate = (Get-Date).Date.AddDays(-5).ToString("yyyy-MM-dd")

Test-Api "Create job application" {
    $Response = Invoke-Api -Method POST -Path "/api/jobs" -Authenticated -Body @{
        company      = "Test Company"
        jobTitle     = "Frontend Developer"
        location     = "Remote"
        jobUrl       = "https://example.com/jobs/frontend"
        salary       = "12 LPA"
        status       = "Applied"
        appliedDate  = $AppliedDate
        interviewDate = $null
        notes        = "Created by automated API test."
    }

    $Ok = $Response.Status -eq 201 -and
          $Response.Body.success -eq $true -and
          $null -ne $Response.Body.job._id

    if ($Ok) {
        $script:JobId = $Response.Body.job._id
    }

    Write-TestResult "Create job application" $Ok `
        "(HTTP $($Response.Status))"
}

if (-not $script:JobId) {
    Write-Host "`nJob creation failed. CRUD tests cannot continue." `
        -ForegroundColor Red
    Write-Host "Check the create-job validation and model."
    return
}

# 6. List applications.
Test-Api "List applications" {
    $Response = Invoke-Api -Method GET -Path "/api/jobs?page=1&limit=10" -Authenticated
    $Ok = $Response.Status -eq 200 -and
          $Response.Body.success -eq $true -and
          $null -ne $Response.Body.pagination

    Write-TestResult "List applications" $Ok "(HTTP $($Response.Status))"
}

# 7. Search applications.
Test-Api "Search applications" {
    $Response = Invoke-Api -Method GET `
        -Path "/api/jobs?search=Test%20Company" -Authenticated

    $Found = $false
    if ($Response.Body.jobs) {
        $Found = @($Response.Body.jobs | Where-Object {
            $_._id -eq $script:JobId
        }).Count -gt 0
    }

    Write-TestResult "Search applications" `
        ($Response.Status -eq 200 -and $Found) `
        "(HTTP $($Response.Status))"
}

# 8. Filter by status.
Test-Api "Filter by Applied status" {
    $Response = Invoke-Api -Method GET `
        -Path "/api/jobs?status=Applied" -Authenticated

    $Found = $false
    if ($Response.Body.jobs) {
        $Found = @($Response.Body.jobs | Where-Object {
            $_._id -eq $script:JobId -and $_.status -eq "Applied"
        }).Count -gt 0
    }

    Write-TestResult "Filter by Applied status" `
        ($Response.Status -eq 200 -and $Found) `
        "(HTTP $($Response.Status))"
}

# 9. Get the application by ID.
Test-Api "Get application by ID" {
    $Response = Invoke-Api -Method GET `
        -Path "/api/jobs/$script:JobId" -Authenticated

    $Ok = $Response.Status -eq 200 -and
          $Response.Body.success -eq $true -and
          $Response.Body.job._id -eq $script:JobId

    Write-TestResult "Get application by ID" $Ok "(HTTP $($Response.Status))"
}

# 10. Update the application.
Test-Api "Update application" {
    $Response = Invoke-Api -Method PATCH `
        -Path "/api/jobs/$script:JobId" -Authenticated -Body @{
            status = "Screening"
            notes  = "Updated by automated API test."
        }

    $Ok = $Response.Status -eq 200 -and
          $Response.Body.success -eq $true -and
          $Response.Body.job.status -eq "Screening"

    Write-TestResult "Update application" $Ok "(HTTP $($Response.Status))"
}

# 11. Confirm the updated status filter works.
Test-Api "Filter by Screening status" {
    $Response = Invoke-Api -Method GET `
        -Path "/api/jobs?status=Screening" -Authenticated

    $Found = $false
    if ($Response.Body.jobs) {
        $Found = @($Response.Body.jobs | Where-Object {
            $_._id -eq $script:JobId -and $_.status -eq "Screening"
        }).Count -gt 0
    }

    Write-TestResult "Filter by Screening status" `
        ($Response.Status -eq 200 -and $Found) `
        "(HTTP $($Response.Status))"
}

# 12. Reject an invalid status.
Test-Api "Reject invalid status filter" {
    $Response = Invoke-Api -Method GET `
        -Path "/api/jobs?status=InvalidStatus" -Authenticated

    Write-TestResult "Reject invalid status filter" `
        ($Response.Status -eq 400) "(HTTP $($Response.Status))"
}

# 13. Reject a future application date.
Test-Api "Reject future application date" {
    $FutureDate = (Get-Date).Date.AddDays(10).ToString("yyyy-MM-dd")

    $Response = Invoke-Api -Method POST -Path "/api/jobs" -Authenticated -Body @{
        company     = "Invalid Date Company"
        jobTitle    = "Frontend Developer"
        appliedDate = $FutureDate
        status      = "Applied"
    }

    Write-TestResult "Reject future application date" `
        ($Response.Status -eq 400) "(HTTP $($Response.Status))"
}

# 14. Require an interview date when status is Interview.
Test-Api "Require interview date" {
    $Response = Invoke-Api -Method POST -Path "/api/jobs" -Authenticated -Body @{
        company     = "Interview Test Company"
        jobTitle    = "React Developer"
        appliedDate = $AppliedDate
        status      = "Interview"
    }

    Write-TestResult "Require interview date" `
        ($Response.Status -eq 400) "(HTTP $($Response.Status))"
}

# 15. Reject an invalid job URL.
Test-Api "Reject invalid job URL" {
    $Response = Invoke-Api -Method POST -Path "/api/jobs" -Authenticated -Body @{
        company     = "Invalid URL Company"
        jobTitle    = "Frontend Developer"
        appliedDate = $AppliedDate
        status      = "Applied"
        jobUrl      = "not-a-valid-url"
    }

    Write-TestResult "Reject invalid job URL" `
        ($Response.Status -eq 400) "(HTTP $($Response.Status))"
}

# 16. Analytics endpoint.
Test-Api "Get analytics" {
    $Response = Invoke-Api -Method GET -Path "/api/analytics" -Authenticated

    $Ok = $Response.Status -eq 200 -and
          $Response.Body.success -eq $true -and
          $null -ne $Response.Body.analytics

    Write-TestResult "Get analytics" $Ok "(HTTP $($Response.Status))"
}

# 17. Reject a malformed application ID.
Test-Api "Reject invalid application ID" {
    $Response = Invoke-Api -Method GET `
        -Path "/api/jobs/not-a-valid-id" -Authenticated

    Write-TestResult "Reject invalid application ID" `
        ($Response.Status -eq 400) "(HTTP $($Response.Status))"
}

# 18. Delete the test application.
Test-Api "Delete application" {
    $Response = Invoke-Api -Method DELETE `
        -Path "/api/jobs/$script:JobId" -Authenticated

    $Ok = $Response.Status -eq 200 -and $Response.Body.success -eq $true

    Write-TestResult "Delete application" $Ok "(HTTP $($Response.Status))"
}

# 19. Verify the deleted application cannot be fetched.
Test-Api "Deleted application returns 404" {
    $Response = Invoke-Api -Method GET `
        -Path "/api/jobs/$script:JobId" -Authenticated

    Write-TestResult "Deleted application returns 404" `
        ($Response.Status -eq 404) "(HTTP $($Response.Status))"
}

Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host " Test Summary" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Passed: $script:Passed" -ForegroundColor Green
Write-Host "Failed: $script:Failed" -ForegroundColor Red
Write-Host "Test user: $TestEmail"
Write-Host "Test password: $TestPassword"
Write-Host "======================================`n" -ForegroundColor Cyan

if ($script:Failed -gt 0) {
    Write-Host "Some tests failed. Review the failed test and backend logs." `
        -ForegroundColor Yellow
}
else {
    Write-Host "All tests passed!" -ForegroundColor Green
}
