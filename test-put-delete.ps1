$baseUrl = "http://localhost:3000/api"

$body = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

Write-Host "=== LOGIN ===" -ForegroundColor Cyan
$login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $body
$token = $login.token
$usuarioId = $login.user.usuarioId
$empleadoId = $login.user.empleadoId
Write-Host "UsuarioId: $usuarioId, EmpleadoId: $empleadoId" -ForegroundColor Yellow

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

Write-Host "`n=== Testing PUT/DELETE/PATCH Endpoints ===" -ForegroundColor Cyan

# Create a leave request first
Write-Host "`n--- Creating test data ---" -ForegroundColor Gray
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

# Create a timesheet entry
$timesheetBody = @{
    proyectoId = 1
    fecha = "2026-04-10"
    horas = 4
    actividad = "Test activity for approval"
} | ConvertTo-Json
$timesheetResult = Invoke-RestMethod -Uri "$baseUrl/timesheets/entry" -Method Post -Headers $headers -Body $timesheetBody
$timesheetId = $timesheetResult.tiempoId
Write-Host "Created timesheet ID: $timesheetId" -ForegroundColor Yellow

# Create a project
$projectBody = @{
    codigo = "TEST-PUT-$(Get-Random)"
    nombre = "Test Project PUT"
    descripcion = "Test for PUT"
    estado = "Activo"
} | ConvertTo-Json
$projectResult = Invoke-RestMethod -Uri "$baseUrl/projects" -Method Post -Headers $headers -Body $projectBody
$projectId = $projectResult.proyectoId
Write-Host "Created project ID: $projectId" -ForegroundColor Yellow

# Create a shift
$shiftBody = @{
    codigo = "T-PUT-$(Get-Random)"
    nombre = "Test Shift PUT"
    horaEntrada = "09:00"
    horaSalida = "18:00"
    toleranciaMinutos = 10
    horasEsperadasDia = 8
    diasLaborables = "L-V"
    estado = "Activo"
} | ConvertTo-Json
$shiftResult = Invoke-RestMethod -Uri "$baseUrl/admin/shifts" -Method Post -Headers $headers -Body $shiftBody
$shifts = $shiftResult
$shiftId = ($shifts | Where-Object { $_.codigo -like "T-PUT-*" })[0].turnoId
Write-Host "Created shift ID: $shiftId" -ForegroundColor Yellow

# Create a user
$userBody = @{
    codigoEmpleado = "EMP-PUT-$(Get-Random)"
    nombres = "PutTest"
    apellidos = "User"
    email = "puttest$(Get-Random)@email.com"
    telefono = "99999999"
    fechaIngreso = "2026-01-15"
    puesto = "Tester"
    departamento = "QA"
} | ConvertTo-Json
$userResult = Invoke-RestMethod -Uri "$baseUrl/users" -Method Post -Headers $headers -Body $userBody
$userId = $userResult.empleadoId
Write-Host "Created user ID: $userId" -ForegroundColor Yellow

# Create a period
$periodBody = @{
    nombre = "2026-06 Junio"
    fechaInicio = "2026-06-01"
    fechaFin = "2026-06-30"
    tipo = "mensual"
} | ConvertTo-Json
$periodResult = Invoke-RestMethod -Uri "$baseUrl/payroll/periods" -Method Post -Headers $headers -Body $periodBody
$periodId = $periodResult.periodoId
Write-Host "Created period ID: $periodId" -ForegroundColor Yellow

Write-Host "`n--- Testing PUT endpoints ---" -ForegroundColor Gray

# UPDATE user
Write-Host "`n[PUT] /users/$userId" -ForegroundColor Cyan
$updateUserBody = @{ telefono = "88888888"; puesto = "Senior Tester" } | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/users/$userId" -Method Put -Headers $headers -Body $updateUserBody
    Write-Host "UPDATE USER PASS" -ForegroundColor Green
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    Write-Host "UPDATE USER FAIL ($statusCode)" -ForegroundColor Red
}

# UPDATE project
Write-Host "`n[PUT] /projects/$projectId" -ForegroundColor Cyan
$updateProjBody = @{ nombre = "Updated Project Name"; descripcion = "Updated description" } | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId" -Method Put -Headers $headers -Body $updateProjBody
    Write-Host "UPDATE PROJECT PASS" -ForegroundColor Green
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    Write-Host "UPDATE PROJECT FAIL ($statusCode)" -ForegroundColor Red
}

# UPDATE shift
Write-Host "`n[PUT] /admin/shifts/$shiftId" -ForegroundColor Cyan
$updateShiftBody = @{ nombre = "Updated Shift Name"; toleranciaMinutos = 15 } | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/admin/shifts/$shiftId" -Method Put -Headers $headers -Body $updateShiftBody
    Write-Host "UPDATE SHIFT PASS" -ForegroundColor Green
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    Write-Host "UPDATE SHIFT FAIL ($statusCode)" -ForegroundColor Red
}

# UPDATE my profile
Write-Host "`n[PUT] /users/me" -ForegroundColor Cyan
$updateProfileBody = @{ telefono = "77777777" } | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/users/me" -Method Put -Headers $headers -Body $updateProfileBody
    Write-Host "UPDATE MY PROFILE PASS" -ForegroundColor Green
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    Write-Host "UPDATE MY PROFILE FAIL ($statusCode)" -ForegroundColor Red
}

# APPROVE leave
Write-Host "`n[PUT] /leaves/$leaveId/approve" -ForegroundColor Cyan
$approveBody = @{ comentarios = "Approved by supervisor" } | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/leaves/$leaveId/approve" -Method Put -Headers $headers -Body $approveBody
    Write-Host "APPROVE LEAVE PASS" -ForegroundColor Green
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    Write-Host "APPROVE LEAVE FAIL ($statusCode)" -ForegroundColor Red
}

# APPROVE timesheet
Write-Host "`n[PUT] /timesheets/$timesheetId/approve" -ForegroundColor Cyan
$approveTsBody = @{ comentarios = "Approved by manager" } | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/timesheets/$timesheetId/approve" -Method Put -Headers $headers -Body $approveTsBody
    Write-Host "APPROVE TIMESHEET PASS" -ForegroundColor Green
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    Write-Host "APPROVE TIMESHEET FAIL ($statusCode)" -ForegroundColor Red
}

# Test REJECT - create another leave to reject
Write-Host "`n--- Testing REJECT ---" -ForegroundColor Gray
$leaveBody2 = @{
    tipoPermisoId = 1
    fechaInicio = "2026-04-25"
    fechaFin = "2026-04-26"
    motivo = "Test rejection"
    diasLaborables = 2
} | ConvertTo-Json
$leaveResult2 = Invoke-RestMethod -Uri "$baseUrl/leaves/request" -Method Post -Headers $headers -Body $leaveBody2
$leaveId2 = $leaveResult2.solicitudId
Write-Host "Created leave request ID for rejection: $leaveId2" -ForegroundColor Yellow

Write-Host "`n[PUT] /leaves/$leaveId2/reject" -ForegroundColor Cyan
$rejectBody = @{ comentarios = "Rejected - insufficient vacation balance" } | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/leaves/$leaveId2/reject" -Method Put -Headers $headers -Body $rejectBody
    Write-Host "REJECT LEAVE PASS" -ForegroundColor Green
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    Write-Host "REJECT LEAVE FAIL ($statusCode)" -ForegroundColor Red
}

# Test REJECT timesheet - create another to reject
$timesheetBody2 = @{
    proyectoId = 1
    fecha = "2026-04-11"
    horas = 8
    actividad = "Test rejection"
} | ConvertTo-Json
$timesheetResult2 = Invoke-RestMethod -Uri "$baseUrl/timesheets/entry" -Method Post -Headers $headers -Body $timesheetBody2
$timesheetId2 = $timesheetResult2.tiempoId

Write-Host "`n[PUT] /timesheets/$timesheetId2/reject" -ForegroundColor Cyan
$rejectTsBody = @{ comentarios = "Rejected - wrong project" } | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/timesheets/$timesheetId2/reject" -Method Put -Headers $headers -Body $rejectTsBody
    Write-Host "REJECT TIMESHEET PASS" -ForegroundColor Green
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    Write-Host "REJECT TIMESHEET FAIL ($statusCode)" -ForegroundColor Red
}

# Test DELETE shift
Write-Host "`n--- Testing DELETE ---" -ForegroundColor Gray
# Create a shift to delete
$shiftDelBody = @{
    codigo = "T-DEL-$(Get-Random)"
    nombre = "Test Shift DELETE"
    horaEntrada = "10:00"
    horaSalida = "19:00"
    toleranciaMinutos = 5
    horasEsperadasDia = 8
    diasLaborables = "L-V"
    estado = "Activo"
} | ConvertTo-Json
$shiftDelResult = Invoke-RestMethod -Uri "$baseUrl/admin/shifts" -Method Post -Headers $headers -Body $shiftDelBody
$shiftsDel = $shiftDelResult
$shiftDelId = ($shiftsDel | Where-Object { $_.codigo -like "T-DEL-*" })[0].turnoId
Write-Host "Created shift to delete ID: $shiftDelId" -ForegroundColor Yellow

Write-Host "`n[DELETE] /admin/shifts/$shiftDelId" -ForegroundColor Cyan
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/admin/shifts/$shiftDelId" -Method Delete -Headers $headers
    Write-Host "DELETE SHIFT PASS" -ForegroundColor Green
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    Write-Host "DELETE SHIFT FAIL ($statusCode)" -ForegroundColor Red
}

# Test DELETE project
Write-Host "`n[DELETE] /projects/$projectId" -ForegroundColor Cyan
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId" -Method Delete -Headers $headers
    Write-Host "DELETE PROJECT PASS" -ForegroundColor Green
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    Write-Host "DELETE PROJECT FAIL ($statusCode)" -ForegroundColor Red
}

# Test DELETE user (deactivate)
Write-Host "`n[DELETE] /users/$userId" -ForegroundColor Cyan
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/users/$userId" -Method Delete -Headers $headers
    Write-Host "DELETE (DEACTIVATE) USER PASS" -ForegroundColor Green
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    Write-Host "DELETE (DEACTIVATE) USER FAIL ($statusCode)" -ForegroundColor Red
}

Write-Host "`n=== All PUT/DELETE Tests Completed ===" -ForegroundColor Cyan
