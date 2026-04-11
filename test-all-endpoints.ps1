# MAYA RCH API Test Script
param(
    [string]$BackendDir = "C:\Users\josee\Documents\Galileo\Cliclo VII\Admin\MAYA RCH\backend"
)

$baseUrl = "http://localhost:3000/api"
$results = @()

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$Token = $null,
        [string]$Description = ""
    )
    
    $headers = @{"Content-Type" = "application/json"}
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }
    
    try {
        $url = "$baseUrl$Endpoint"
        $params = @{
            Uri = $url
            Method = $Method
            Headers = $headers
        }
        if ($Body) {
            $params["Body"] = ($Body | ConvertTo-Json)
        }
        
        $response = Invoke-RestMethod @params -ErrorAction Stop
        $status = "PASS"
        $errorMsg = ""
    }
    catch {
        $status = "FAIL"
        $errorMsg = $_.Exception.Message
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            $errorMsg = "$statusCode - $errorMsg"
        }
        $response = $null
    }
    
    return @{
        Method = $Method
        Endpoint = $Endpoint
        Description = $Description
        Status = $status
        Error = $errorMsg
        Response = $response
    }
}

# Check if backend is already running
$backendRunning = $false
try {
    Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body '{"username":"test","password":"test"}' -ErrorAction SilentlyContinue | Out-Null
    $backendRunning = $true
    Write-Host "Backend already running!" -ForegroundColor Green
}
catch {
    # Start backend
    Write-Host "Starting backend..." -ForegroundColor Cyan
    $backendProcess = Start-Process -FilePath "node" -ArgumentList "dist/main.js" -WorkingDirectory $BackendDir -PassThru -WindowStyle Hidden
    Start-Sleep -Seconds 8
    
    # Check if backend started
    try {
        Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body '{"username":"test","password":"test"}' -ErrorAction SilentlyContinue | Out-Null
        $backendRunning = $true
        Write-Host "Backend started!" -ForegroundColor Green
    }
    catch {
        Write-Host "Backend failed to start. Exiting." -ForegroundColor Red
        exit 1
    }
}

# Step 1: Login
Write-Host "`n=== Testing Authentication ===" -ForegroundColor Yellow
$result = Test-Endpoint -Method "POST" -Endpoint "/auth/login" -Body @{username="admin";password="admin123"} -Description "Login"
$results += $result
if ($result.Response) {
    $token = $result.Response.token
    $usuarioId = $result.Response.usuarioId
    $empleadoId = $result.Response.empleadoId
    Write-Host "Token received: $($token.Substring(0, [Math]::Min(20, $token.Length)))..." -ForegroundColor Green
} else {
    Write-Host "Login FAILED: $($result.Error)" -ForegroundColor Red
    exit 1
}

# Step 2: Test Attendance endpoints
Write-Host "`n=== Testing Attendance Endpoints ===" -ForegroundColor Yellow

$result = Test-Endpoint -Method "POST" -Endpoint "/attendance/check-in" -Token $token -Description "Check-in"
$results += $result
Write-Host "[$($result.Status)] POST /attendance/check-in: $($result.Error)" -ForegroundColor $(if($result.Status -eq "PASS"){"Green"}else{"Red"})

$result = Test-Endpoint -Method "POST" -Endpoint "/attendance/check-out" -Token $token -Description "Check-out"
$results += $result
Write-Host "[$($result.Status)] POST /attendance/check-out: $($result.Error)" -ForegroundColor $(if($result.Status -eq "PASS"){"Green"}else{"Red"})

# Step 3: Test Leave endpoints
Write-Host "`n=== Testing Leave Endpoints ===" -ForegroundColor Yellow

$result = Test-Endpoint -Method "GET" -Endpoint "/leaves/types" -Token $token -Description "Get leave types"
$results += $result
Write-Host "[$($result.Status)] GET /leaves/types: $($result.Error)" -ForegroundColor $(if($result.Status -eq "PASS"){"Green"}else{"Red"})

# Create leave request
$leaveTypes = if ($result.Response) { $result.Response[0].id } else { 1 }
$result = Test-Endpoint -Method "POST" -Endpoint "/leaves/request" -Token $token -Body @{
    tipoPermisoId = $leaveTypes
    fechaInicio = "2026-04-15"
    fechaFin = "2026-04-16"
    observaciones = "Test leave request"
    diasLaborables = 2
} -Description "Create leave request"
$results += $result
Write-Host "[$($result.Status)] POST /leaves/request: $($result.Error)" -ForegroundColor $(if($result.Status -eq "PASS"){"Green"}else{"Red"})

$leaveRequestId = if ($result.Response) { $result.Response.id } else { 1 }

$result = Test-Endpoint -Method "GET" -Endpoint "/leaves/my-requests" -Token $token -Description "Get my requests"
$results += $result
Write-Host "[$($result.Status)] GET /leaves/my-requests: $($result.Error)" -ForegroundColor $(if($result.Status -eq "PASS"){"Green"}else{"Red"})

# Test approve/reject (need supervisor role - using admin)
$result = Test-Endpoint -Method "PUT" -Endpoint "/leaves/$leaveRequestId/approve" -Token $token -Body @{comentarios="Approved"} -Description "Approve leave"
$results += $result
Write-Host "[$($result.Status)] PUT /leaves/$leaveRequestId/approve: $($result.Error)" -ForegroundColor $(if($result.Status -eq "PASS"){"Green"}else{"Red"})

# Step 4: Test Timesheet endpoints
Write-Host "`n=== Testing Timesheet Endpoints ===" -ForegroundColor Yellow

# Get projects for timesheet
$result = Test-Endpoint -Method "GET" -Endpoint "/projects" -Token $token -Description "Get projects"
$results += $result
$projectId = if ($result.Response -and $result.Response.Length -gt 0) { $result.Response[0].id } else { 1 }

$result = Test-Endpoint -Method "POST" -Endpoint "/timesheets/entry" -Token $token -Body @{
    proyectoId = $projectId
    fecha = "2026-04-10"
    horas = 4
    actividad = "Test activity"
    comentarios = "Test timesheet entry"
} -Description "Create timesheet entry"
$results += $result
Write-Host "[$($result.Status)] POST /timesheets/entry: $($result.Error)" -ForegroundColor $(if($result.Status -eq "PASS"){"Green"}else{"Red"})

$timesheetId = if ($result.Response) { $result.Response.id } else { 1 }

$result = Test-Endpoint -Method "GET" -Endpoint "/timesheets" -Token $token -Description "Get timesheets"
$results += $result
Write-Host "[$($result.Status)] GET /timesheets: $($result.Error)" -ForegroundColor $(if($result.Status -eq "PASS"){"Green"}else{"Red"})

$result = Test-Endpoint -Method "PUT" -Endpoint "/timesheets/$timesheetId/approve" -Token $token -Body @{comentarios="Approved"} -Description "Approve timesheet"
$results += $result
Write-Host "[$($result.Status)] PUT /timesheets/$timesheetId/approve: $($result.Error)" -ForegroundColor $(if($result.Status -eq "PASS"){"Green"}else{"Red"})

# Step 5: Test Users endpoints
Write-Host "`n=== Testing Users Endpoints ===" -ForegroundColor Yellow

$result = Test-Endpoint -Method "GET" -Endpoint "/users" -Token $token -Description "Get all users"
$results += $result
Write-Host "[$($result.Status)] GET /users: $($result.Error)" -ForegroundColor $(if($result.Status -eq "PASS"){"Green"}else{"Red"})

$result = Test-Endpoint -Method "POST" -Endpoint "/users" -Token $token -Body @{
    primerNombre = "Test"
    segundoNombre = "User"
    primerApellido = "Test"
    segundoApellido = "Apellido"
    telefono = "12345678"
    correo = "test@email.com"
    puesto = "Developer"
    departamento = "Tecnología"
    codigo = "EMP-TEST"
} -Description "Create user"
$results += $result
Write-Host "[$($result.Status)] POST /users: $($result.Error)" -ForegroundColor $(if($result.Status -eq "PASS"){"Green"}else{"Red"})

$newUserId = if ($result.Response) { $result.Response.id } else { $empleadoId }

$result = Test-Endpoint -Method "PUT" -Endpoint "/users/$newUserId" -Token $token -Body @{
    telefono = "87654321"
} -Description "Update user"
$results += $result
$userUpdateStatus = if($result.Status -eq "PASS"){"Green"}else{"Red"}
Write-Host "[$($result.Status)] PUT /users/$newUserId - $($result.Error)" -ForegroundColor $userUpdateStatus

# Step 6: Test Projects endpoints
Write-Host "`n=== Testing Projects Endpoints ===" -ForegroundColor Yellow

$result = Test-Endpoint -Method "POST" -Endpoint "/projects" -Token $token -Body @{
    codigo = "TEST-001"
    nombre = "Test Project"
    descripcion = "Test description"
    estado = "Activo"
} -Description "Create project"
$results += $result
Write-Host "[$($result.Status)] POST /projects: $($result.Error)" -ForegroundColor $(if($result.Status -eq "PASS"){"Green"}else{"Red"})

$projectId = if ($result.Response) { $result.Response.id } else { 1 }

$result = Test-Endpoint -Method "PUT" -Endpoint "/projects/$projectId" -Token $token -Body @{
    nombre = "Test Project Updated"
} -Description "Update project"
$results += $result
$projStatus = if($result.Status -eq "PASS"){"Green"}else{"Red"}
Write-Host "[$($result.Status)] PUT /projects/${projectId} - $($result.Error)" -ForegroundColor $projStatus

# Step 7: Test Admin endpoints (Shifts)
Write-Host "`n=== Testing Admin Endpoints ===" -ForegroundColor Yellow

$result = Test-Endpoint -Method "GET" -Endpoint "/admin/shifts" -Token $token -Description "Get shifts"
$results += $result
Write-Host "[$($result.Status)] GET /admin/shifts: $($result.Error)" -ForegroundColor $(if($result.Status -eq "PASS"){"Green"}else{"Red"})

$result = Test-Endpoint -Method "POST" -Endpoint "/admin/shifts" -Token $token -Body @{
    codigo = "T-TEST"
    nombre = "Test Shift"
    horaEntrada = "09:00"
    horaSalida = "18:00"
    toleranciaMinutos = 10
    horasLaborales = 8
    diasLaborales = "L-V"
    estado = "Activo"
} -Description "Create shift"
$results += $result
Write-Host "[$($result.Status)] POST /admin/shifts: $($result.Error)" -ForegroundColor $(if($result.Status -eq "PASS"){"Green"}else{"Red"})

$shiftId = if ($result.Response) { $result.Response.id } else { 1 }

$result = Test-Endpoint -Method "PUT" -Endpoint "/admin/shifts/$shiftId" -Token $token -Body @{
    nombre = "Test Shift Updated"
} -Description "Update shift"
$results += $result
$shiftUpdStatus = if($result.Status -eq "PASS"){"Green"}else{"Red"}
Write-Host "[$($result.Status)] PUT /admin/shifts/${shiftId} - $($result.Error)" -ForegroundColor $shiftUpdStatus

$result = Test-Endpoint -Method "DELETE" -Endpoint "/admin/shifts/$shiftId" -Token $token -Description "Delete shift"
$results += $result
$shiftDelStatus = if($result.Status -eq "PASS"){"Green"}else{"Red"}
Write-Host "[$($result.Status)] DELETE /admin/shifts/${shiftId} - $($result.Error)" -ForegroundColor $shiftDelStatus

# Step 8: Test Payroll endpoints
Write-Host "`n=== Testing Payroll Endpoints ===" -ForegroundColor Yellow

$result = Test-Endpoint -Method "GET" -Endpoint "/payroll/periods" -Token $token -Description "Get payroll periods"
$results += $result
Write-Host "[$($result.Status)] GET /payroll/periods: $($result.Error)" -ForegroundColor $(if($result.Status -eq "PASS"){"Green"}else{"Red"})

$result = Test-Endpoint -Method "POST" -Endpoint "/payroll/periods" -Token $token -Body @{
    codigo = "2026-05"
    mes = 5
    anio = 2026
    fechaInicio = "2026-05-01"
    fechaFin = "2026-05-31"
    estado = "Abierto"
} -Description "Create payroll period"
$results += $result
Write-Host "[$($result.Status)] POST /payroll/periods: $($result.Error)" -ForegroundColor $(if($result.Status -eq "PASS"){"Green"}else{"Red"})

$result = Test-Endpoint -Method "GET" -Endpoint "/payroll/concepts" -Token $token -Description "Get payroll concepts"
$results += $result
Write-Host "[$($result.Status)] GET /payroll/concepts: $($result.Error)" -ForegroundColor $(if($result.Status -eq "PASS"){"Green"}else{"Red"})

# Summary
Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
$passCount = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red

if ($failCount -gt 0) {
    Write-Host "`nFailed endpoints:" -ForegroundColor Red
    $results | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
        Write-Host "  [$($_.Method)] $($_.Endpoint) - $($_.Error)" -ForegroundColor Red
    }
}

# Cleanup
Write-Host "`nStopping backend..." -ForegroundColor Cyan
Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue

# Save results to file
$results | ConvertTo-Json -Depth 10 | Out-File -FilePath "test-results.json" -Encoding UTF8
Write-Host "`nResults saved to test-results.json" -ForegroundColor Cyan
