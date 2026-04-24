$baseUrl = "http://localhost:3000/api"

$body = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

Write-Host "=== LOGIN ===" -ForegroundColor Cyan
try {
    $login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $body
    $token = $login.token
    $usuarioId = $login.usuarioId
    $empleadoId = $login.empleadoId
    Write-Host "LOGIN PASS - Token received" -ForegroundColor Green
    Write-Host "UsuarioId: $usuarioId, EmpleadoId: $empleadoId"
} catch {
    Write-Host "LOGIN FAIL: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

Write-Host "`n=== ATTENDANCE: CHECK-IN ===" -ForegroundColor Cyan
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/attendance/check-in" -Method Post -Headers $headers -Body "{}"
    Write-Host "CHECK-IN PASS" -ForegroundColor Green
} catch {
    Write-Host "CHECK-IN FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== ATTENDANCE: CHECK-OUT ===" -ForegroundColor Cyan
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/attendance/check-out" -Method Post -Headers $headers -Body "{}"
    Write-Host "CHECK-OUT PASS" -ForegroundColor Green
} catch {
    Write-Host "CHECK-OUT FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== LEAVES: GET TYPES ===" -ForegroundColor Cyan
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/leaves/types" -Method Get -Headers $headers
    $leaveTypeId = $result[0].id
    Write-Host "GET TYPES PASS - Found $($result.Count) types" -ForegroundColor Green
} catch {
    Write-Host "GET TYPES FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $leaveTypeId = 1
}

Write-Host "`n=== LEAVES: CREATE REQUEST ===" -ForegroundColor Cyan
$leaveBody = @{
    tipoPermisoId = $leaveTypeId
    fecha_inicio = "2026-04-15"
    fecha_fin = "2026-04-16"
    observaciones = "Test leave request"
    diasLaborables = 2
} | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/leaves/request" -Method Post -Headers $headers -Body $leaveBody
    $leaveId = $result.id
    Write-Host "CREATE LEAVE REQUEST PASS - ID: $leaveId" -ForegroundColor Green
} catch {
    Write-Host "CREATE LEAVE REQUEST FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $leaveId = 1
}

Write-Host "`n=== LEAVES: MY REQUESTS ===" -ForegroundColor Cyan
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/leaves/my-requests" -Method Get -Headers $headers
    Write-Host "MY REQUESTS PASS - Found $($result.Count) requests" -ForegroundColor Green
} catch {
    Write-Host "MY REQUESTS FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== LEAVES: APPROVE ===" -ForegroundColor Cyan
$approveBody = @{ comentarios = "Approved" } | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/leaves/$leaveId/approve" -Method Put -Headers $headers -Body $approveBody
    Write-Host "APPROVE LEAVE PASS" -ForegroundColor Green
} catch {
    Write-Host "APPROVE LEAVE FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== TIMESHEETS: GET PROJECTS ===" -ForegroundColor Cyan
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/projects" -Method Get -Headers $headers
    $projectId = $result[0].id
    Write-Host "GET PROJECTS PASS - Found $($result.Count) projects" -ForegroundColor Green
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
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/timesheets/entry" -Method Post -Headers $headers -Body $timesheetBody
    $timesheetId = $result.id
    Write-Host "CREATE TIMESHEET PASS - ID: $timesheetId" -ForegroundColor Green
} catch {
    Write-Host "CREATE TIMESHEET FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $timesheetId = 1
}

Write-Host "`n=== TIMESHEETS: GET ===" -ForegroundColor Cyan
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/timesheets" -Method Get -Headers $headers
    Write-Host "GET TIMESHEETS PASS - Found $($result.Count) entries" -ForegroundColor Green
} catch {
    Write-Host "GET TIMESHEETS FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== TIMESHEETS: APPROVE ===" -ForegroundColor Cyan
$tsApproveBody = @{ comentarios = "Approved" } | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/timesheets/$timesheetId/approve" -Method Put -Headers $headers -Body $tsApproveBody
    Write-Host "APPROVE TIMESHEET PASS" -ForegroundColor Green
} catch {
    Write-Host "APPROVE TIMESHEET FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== USERS: GET ALL ===" -ForegroundColor Cyan
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/users" -Method Get -Headers $headers
    Write-Host "GET USERS PASS - Found $($result.Count) users" -ForegroundColor Green
} catch {
    Write-Host "GET USERS FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== USERS: CREATE ===" -ForegroundColor Cyan
$userBody = @{
    primerNombre = "Test"
    segundoNombre = "User"
    primerApellido = "Test"
    segundoApellido = "Apellido"
    telefono = "12345678"
    correo = "testuser@email.com"
    puesto = "Developer"
    departamento = "Tecnologia"
    codigo = "EMP-TEST"
} | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/users" -Method Post -Headers $headers -Body $userBody
    $newUserId = $result.id
    Write-Host "CREATE USER PASS - ID: $newUserId" -ForegroundColor Green
} catch {
    Write-Host "CREATE USER FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $newUserId = $empleadoId
}

Write-Host "`n=== USERS: UPDATE ===" -ForegroundColor Cyan
$updateBody = @{ telefono = "87654321" } | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/users/$newUserId" -Method Put -Headers $headers -Body $updateBody
    Write-Host "UPDATE USER PASS" -ForegroundColor Green
} catch {
    Write-Host "UPDATE USER FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== PROJECTS: CREATE ===" -ForegroundColor Cyan
$projBody = @{
    codigo = "TEST-001"
    nombre = "Test Project"
    descripcion = "Test description"
    estado = "Activo"
} | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/projects" -Method Post -Headers $headers -Body $projBody
    $projId = $result.id
    Write-Host "CREATE PROJECT PASS - ID: $projId" -ForegroundColor Green
} catch {
    Write-Host "CREATE PROJECT FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $projId = 1
}

Write-Host "`n=== PROJECTS: UPDATE ===" -ForegroundColor Cyan
$projUpdateBody = @{ nombre = "Test Project Updated" } | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/projects/$projId" -Method Put -Headers $headers -Body $projUpdateBody
    Write-Host "UPDATE PROJECT PASS" -ForegroundColor Green
} catch {
    Write-Host "UPDATE PROJECT FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== ADMIN: SHIFTS GET ===" -ForegroundColor Cyan
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/admin/shifts" -Method Get -Headers $headers
    Write-Host "GET SHIFTS PASS - Found $($result.Count) shifts" -ForegroundColor Green
} catch {
    Write-Host "GET SHIFTS FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== ADMIN: SHIFTS CREATE ===" -ForegroundColor Cyan
$shiftBody = @{
    codigo = "T-TEST"
    nombre = "Test Shift"
    horaEntrada = "09:00"
    horaSalida = "18:00"
    toleranciaMinutos = 10
    horasLaborales = 8
    diasLaborales = "L-V"
    estado = "Activo"
} | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/admin/shifts" -Method Post -Headers $headers -Body $shiftBody
    $shiftId = $result.id
    Write-Host "CREATE SHIFT PASS - ID: $shiftId" -ForegroundColor Green
} catch {
    Write-Host "CREATE SHIFT FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $shiftId = 1
}

Write-Host "`n=== ADMIN: SHIFTS UPDATE ===" -ForegroundColor Cyan
$shiftUpdateBody = @{ nombre = "Test Shift Updated" } | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/admin/shifts/$shiftId" -Method Put -Headers $headers -Body $shiftUpdateBody
    Write-Host "UPDATE SHIFT PASS" -ForegroundColor Green
} catch {
    Write-Host "UPDATE SHIFT FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== ADMIN: SHIFTS DELETE ===" -ForegroundColor Cyan
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/admin/shifts/$shiftId" -Method Delete -Headers $headers
    Write-Host "DELETE SHIFT PASS" -ForegroundColor Green
} catch {
    Write-Host "DELETE SHIFT FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== PAYROLL: PERIODS GET ===" -ForegroundColor Cyan
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/payroll/periods" -Method Get -Headers $headers
    Write-Host "GET PERIODS PASS - Found $($result.Count) periods" -ForegroundColor Green
} catch {
    Write-Host "GET PERIODS FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== PAYROLL: PERIODS CREATE ===" -ForegroundColor Cyan
$periodBody = @{
    codigo = "2026-05"
    mes = 5
    anio = 2026
    fecha_inicio = "2026-05-01"
    fecha_fin = "2026-05-31"
    estado = "Abierto"
} | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/payroll/periods" -Method Post -Headers $headers -Body $periodBody
    $periodId = $result.id
    Write-Host "CREATE PERIOD PASS - ID: $periodId" -ForegroundColor Green
} catch {
    Write-Host "CREATE PERIOD FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== PAYROLL: CONCEPTS GET ===" -ForegroundColor Cyan
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/payroll/concepts" -Method Get -Headers $headers
    Write-Host "GET CONCEPTS PASS - Found $($result.Count) concepts" -ForegroundColor Green
} catch {
    Write-Host "GET CONCEPTS FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== ALL Tests Completed ===" -ForegroundColor Cyan
