$baseUrl = "http://localhost:3000/api"

$body = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

Write-Host "=== LOGIN ===" -ForegroundColor Cyan
try {
    $login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $body
    $token = $login.token
    $usuarioId = $login.user.usuarioId
    $empleadoId = $login.user.empleadoId
    Write-Host "LOGIN PASS" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, [Math]::Min(30, $token.Length)))..."
    Write-Host "UsuarioId: $usuarioId, EmpleadoId: $empleadoId" -ForegroundColor Yellow
} catch {
    Write-Host "LOGIN FAIL: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

Write-Host "`n=== ATTENDANCE: CHECK-IN ===" -ForegroundColor Cyan
Write-Host "Testing as user with empleadoId: $empleadoId" -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/attendance/check-in" -Method Post -Headers $headers -Body "{}"
    Write-Host "CHECK-IN PASS" -ForegroundColor Green
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    $responseStream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($responseStream)
    $responseBody = $reader.ReadToEnd()
    Write-Host "CHECK-IN FAIL ($statusCode): $responseBody" -ForegroundColor Red
}

Write-Host "`n=== LEAVES: GET TYPES ===" -ForegroundColor Cyan
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/leaves/types" -Method Get -Headers $headers
    $leaveTypeId = $result[0].tipoPermisoId
    Write-Host "GET TYPES PASS - Found $($result.Count) types, first typeId: $leaveTypeId" -ForegroundColor Green
} catch {
    Write-Host "GET TYPES FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $leaveTypeId = 1
}

Write-Host "`n=== LEAVES: CREATE REQUEST ===" -ForegroundColor Cyan
$leaveBody = @{
    tipoPermisoId = $leaveTypeId
    fechaInicio = "2026-04-15"
    fechaFin = "2026-04-16"
    motivo = "Test leave request"
    diasLaborables = 2
} | ConvertTo-Json
Write-Host "Sending: $leaveBody" -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/leaves/request" -Method Post -Headers $headers -Body $leaveBody
    $leaveId = $result.solicitudId
    Write-Host "CREATE LEAVE REQUEST PASS - ID: $leaveId" -ForegroundColor Green
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    $responseStream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($responseStream)
    $responseBody = $reader.ReadToEnd()
    Write-Host "CREATE LEAVE REQUEST FAIL ($statusCode): $responseBody" -ForegroundColor Red
    $leaveId = $null
}

Write-Host "`n=== TIMESHEETS: GET PROJECTS ===" -ForegroundColor Cyan
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/projects" -Method Get -Headers $headers
    $projectId = $result[0].proyectoId
    Write-Host "GET PROJECTS PASS - Found $($result.Count) projects, first projectId: $projectId" -ForegroundColor Green
} catch {
    Write-Host "GET PROJECTS FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $projectId = 1
}

Write-Host "`n=== TIMESHEETS: CREATE ENTRY ===" -ForegroundColor Cyan
$timesheetBody = @{
    proyectoId = $projectId
    fecha = "2026-04-10"
    horas = 4
    actividad = "Test activity"
    comentarios = "Test timesheet"
} | ConvertTo-Json
Write-Host "Sending: $timesheetBody" -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/timesheets/entry" -Method Post -Headers $headers -Body $timesheetBody
    $timesheetId = $result.tiempoId
    Write-Host "CREATE TIMESHEET PASS - ID: $timesheetId" -ForegroundColor Green
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    $responseStream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($responseStream)
    $responseBody = $reader.ReadToEnd()
    Write-Host "CREATE TIMESHEET FAIL ($statusCode): $responseBody" -ForegroundColor Red
    $timesheetId = $null
}

Write-Host "`n=== USERS: CREATE ===" -ForegroundColor Cyan
$userBody = @{
    codigoEmpleado = "EMP-TEST-$(Get-Random)"
    nombres = "Test"
    apellidos = "User"
    email = "test$(Get-Random)@email.com"
    telefono = "12345678"
    fechaIngreso = "2026-01-15"
    puesto = "Developer"
    departamento = "Tecnologia"
} | ConvertTo-Json
Write-Host "Sending: $userBody" -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/users" -Method Post -Headers $headers -Body $userBody
    $newUserId = $result.empleadoId
    Write-Host "CREATE USER PASS - ID: $newUserId" -ForegroundColor Green
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    $responseStream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($responseStream)
    $responseBody = $reader.ReadToEnd()
    Write-Host "CREATE USER FAIL ($statusCode): $responseBody" -ForegroundColor Red
    $newUserId = $null
}

Write-Host "`n=== PROJECTS: CREATE ===" -ForegroundColor Cyan
$projBody = @{
    codigo = "TEST-$(Get-Random)"
    nombre = "Test Project"
    descripcion = "Test description"
    estado = "Activo"
} | ConvertTo-Json
Write-Host "Sending: $projBody" -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/projects" -Method Post -Headers $headers -Body $projBody
    $projId = $result.proyectoId
    Write-Host "CREATE PROJECT PASS - ID: $projId" -ForegroundColor Green
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    $responseStream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($responseStream)
    $responseBody = $reader.ReadToEnd()
    Write-Host "CREATE PROJECT FAIL ($statusCode): $responseBody" -ForegroundColor Red
    $projId = $null
}

Write-Host "`n=== ADMIN: SHIFTS CREATE ===" -ForegroundColor Cyan
$shiftBody = @{
    codigo = "T-TEST-$(Get-Random)"
    nombre = "Test Shift"
    horaEntrada = "09:00"
    horaSalida = "18:00"
    toleranciaMinutos = 10
    horasEsperadasDia = 8
    diasLaborales = "L-V"
    estado = "Activo"
} | ConvertTo-Json
Write-Host "Sending: $shiftBody" -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/admin/shifts" -Method Post -Headers $headers -Body $shiftBody
    Write-Host "CREATE SHIFT PASS - Result count: $($result.Count)" -ForegroundColor Green
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    $responseStream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($responseStream)
    $responseBody = $reader.ReadToEnd()
    Write-Host "CREATE SHIFT FAIL ($statusCode): $responseBody" -ForegroundColor Red
}

Write-Host "`n=== PAYROLL: PERIODS CREATE ===" -ForegroundColor Cyan
$periodBody = @{
    nombre = "2026-05 Mayo"
    fechaInicio = "2026-05-01"
    fechaFin = "2026-05-31"
    tipo = "mensual"
} | ConvertTo-Json
Write-Host "Sending: $periodBody" -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/payroll/periods" -Method Post -Headers $headers -Body $periodBody
    $periodId = $result.periodoId
    Write-Host "CREATE PERIOD PASS - ID: $periodId" -ForegroundColor Green
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    $responseStream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($responseStream)
    $responseBody = $reader.ReadToEnd()
    Write-Host "CREATE PERIOD FAIL ($statusCode): $responseBody" -ForegroundColor Red
}

Write-Host "`n=== All Tests Completed ===" -ForegroundColor Cyan
