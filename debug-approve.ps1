$baseUrl = "http://localhost:3000/api"

$body = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

Write-Host "=== LOGIN ===" -ForegroundColor Cyan
$login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $body
$token = $login.token
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

# Create a leave request
Write-Host "`n=== Creating leave request ===" -ForegroundColor Cyan
$leaveBody = @{
    tipoPermisoId = 1
    fechaInicio = "2026-04-20"
    fechaFin = "2026-04-21"
    motivo = "Test approval"
    diasLaborables = 2
} | ConvertTo-Json
$leaveResult = Invoke-RestMethod -Uri "$baseUrl/leaves/request" -Method Post -Headers $headers -Body $leaveBody
$leaveId = $leaveResult.solicitudId
Write-Host "Created leave request ID: $leaveId" -ForegroundColor Yellow

# Try to approve it
Write-Host "`n=== Approving leave request ===" -ForegroundColor Cyan
$approveBody = @{ comentarios = "Approved" } | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/leaves/$leaveId/approve" -Method Put -Headers $headers -Body $approveBody
    Write-Host "APPROVE LEAVE PASS" -ForegroundColor Green
    Write-Host "Result: $($result | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    $responseStream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($responseStream)
    $responseBody = $reader.ReadToEnd()
    Write-Host "APPROVE LEAVE FAIL ($statusCode): $responseBody" -ForegroundColor Red
}

# Try to reject a leave request
Write-Host "`n=== Creating another leave request for rejection ===" -ForegroundColor Cyan
$leaveBody2 = @{
    tipoPermisoId = 2
    fechaInicio = "2026-04-22"
    fechaFin = "2026-04-23"
    motivo = "Test rejection"
    diasLaborables = 2
} | ConvertTo-Json
$leaveResult2 = Invoke-RestMethod -Uri "$baseUrl/leaves/request" -Method Post -Headers $headers -Body $leaveBody2
$leaveId2 = $leaveResult2.solicitudId
Write-Host "Created leave request ID: $leaveId2" -ForegroundColor Yellow

Write-Host "`n=== Rejecting leave request ===" -ForegroundColor Cyan
$rejectBody = @{ comentarios = "Rejected" } | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/leaves/$leaveId2/reject" -Method Put -Headers $headers -Body $rejectBody
    Write-Host "REJECT LEAVE PASS" -ForegroundColor Green
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    $responseStream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($responseStream)
    $responseBody = $reader.ReadToEnd()
    Write-Host "REJECT LEAVE FAIL ($statusCode): $responseBody" -ForegroundColor Red
}
