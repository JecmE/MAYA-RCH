$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c3VhcmlvSWQiOjMsImVtcGxlYWRvSWQiOjMsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlcyI6WyJBZG1pbmlzdHJhZG9yIl0sImlhdCI6MTc3NTg1MTIxMSwiZXhwIjoxNzc1OTM3NjExfQ.SqTstOs2PUugroh_0xUCY-1N_Jy5XZ4KGWYxFg5Gp3w"
$base = "http://localhost:3000/api"

Write-Host "=== EMPLEADOS (users) ===" -ForegroundColor Cyan
try {
    $emps = Invoke-RestMethod -Uri "$base/users" -Method Get -Headers @{ Authorization = "Bearer $token" }
    Write-Host "[OK] GET /users - Total: $($emps.length)" -ForegroundColor Green
    $emps | ForEach-Object { Write-Host "   $($_.codigoEmpleado): $($_.nombres) $($_.apellidos)" }
} catch { Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red }

Write-Host "`n=== TURNOS (admin/shifts) ===" -ForegroundColor Cyan
try {
    $turnos = Invoke-RestMethod -Uri "$base/admin/shifts" -Method Get -Headers @{ Authorization = "Bearer $token" }
    Write-Host "[OK] GET /admin/shifts - Total: $($turnos.length)" -ForegroundColor Green
    $turnos | ForEach-Object { Write-Host "   $($_.nombre): $($_.horaEntrada) - $($_.horaSalida)" }
} catch { Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red }

Write-Host "`n=== TIPOS PERMISO (leaves/types) ===" -ForegroundColor Cyan
try {
    $tipos = Invoke-RestMethod -Uri "$base/leaves/types" -Method Get -Headers @{ Authorization = "Bearer $token" }
    Write-Host "[OK] GET /leaves/types - Total: $($tipos.length)" -ForegroundColor Green
    $tipos | ForEach-Object { Write-Host "   $($_.nombre) (doc:$($_.requiereDocumento) vac:$($_.descuentaVacaciones))" }
} catch { Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red }

Write-Host "`n=== PROYECTOS ===" -ForegroundColor Cyan
try {
    $proys = Invoke-RestMethod -Uri "$base/projects" -Method Get -Headers @{ Authorization = "Bearer $token" }
    Write-Host "[OK] GET /projects - Total: $($proys.length)" -ForegroundColor Green
    $proys | ForEach-Object { Write-Host "   $($_.codigo): $($_.nombre)" }
} catch { Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red }

Write-Host "`n=== USUARIOS ===" -ForegroundColor Cyan
try {
    $users = Invoke-RestMethod -Uri "$base/users" -Method Get -Headers @{ Authorization = "Bearer $token" }
    Write-Host "[OK] GET /users - Total: $($users.length)" -ForegroundColor Green
} catch { Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red }

Write-Host "`n=== SOLICITUDES PERMISO (my-requests) ===" -ForegroundColor Cyan
try {
    $sols = Invoke-RestMethod -Uri "$base/leaves/my-requests" -Method Get -Headers @{ Authorization = "Bearer $token" }
    Write-Host "[OK] GET /leaves/my-requests - Total: $($sols.length)" -ForegroundColor Green
} catch { Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red }

Write-Host "`n=== REGISTROS TIEMPO ===" -ForegroundColor Cyan
try {
    $times = Invoke-RestMethod -Uri "$base/timesheets" -Method Get -Headers @{ Authorization = "Bearer $token" }
    Write-Host "[OK] GET /timesheets - Total: $($times.length)" -ForegroundColor Green
} catch { Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red }

Write-Host "`n=== ROLES (admin/roles) ===" -ForegroundColor Cyan
try {
    $roles = Invoke-RestMethod -Uri "$base/admin/roles" -Method Get -Headers @{ Authorization = "Bearer $token" }
    Write-Host "[OK] GET /admin/roles - Total: $($roles.length)" -ForegroundColor Green
    $roles | ForEach-Object { Write-Host "   $($_.nombre)" }
} catch { Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red }

Write-Host "`n=== BONO REGLAS (admin/bonus-rules) ===" -ForegroundColor Cyan
try {
    $bonos = Invoke-RestMethod -Uri "$base/admin/bonus-rules" -Method Get -Headers @{ Authorization = "Bearer $token" }
    Write-Host "[OK] GET /admin/bonus-rules - Total: $($bonos.length)" -ForegroundColor Green
} catch { Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red }

Write-Host "`n=== TIMESTAMP (auth/me) ===" -ForegroundColor Cyan
try {
    $me = Invoke-RestMethod -Uri "$base/auth/me" -Method Get -Headers @{ Authorization = "Bearer $token" }
    Write-Host "[OK] GET /auth/me - Usuario: $($me.username), Roles: $($me.roles -join ', ')" -ForegroundColor Green
} catch { Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red }

Write-Host "`n=== TODOS LOS TESTS COMPLETADOS ===" -ForegroundColor Green
