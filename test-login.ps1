# Test login para MAYA RCH
$baseUrl = "http://localhost:3000"

Write-Host "=== TEST LOGIN ===" -ForegroundColor Cyan

# Test 1: Login admin
$loginBody = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
    Write-Host "[OK] Login admin exitoso" -ForegroundColor Green
    Write-Host "    Token: $($response.token.Substring(0, [Math]::Min(30, $response.token.Length)))..."
    Write-Host "    Usuario ID: $($response.user.usuarioId)"
    Write-Host "    Empleado ID: $($response.user.empleadoId)"
    
    $token = $response.token
    
    # Test 2: Get current user
    Write-Host "`n=== TEST GET ME ===" -ForegroundColor Cyan
    $me = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers @{ Authorization = "Bearer $token" }
    Write-Host "[OK] Get /auth/me exitoso" -ForegroundColor Green
    Write-Host "    Username: $($me.username)"
    Write-Host "    Roles: $($me.roles -join ', ')"
    
    # Test 3: Get empleados
    Write-Host "`n=== TEST GET EMPLEADOS ===" -ForegroundColor Cyan
    $empleados = Invoke-RestMethod -Uri "$baseUrl/empleados" -Method Get -Headers @{ Authorization = "Bearer $token" }
    Write-Host "[OK] GET /empleados - Total: $($empleados.length)" -ForegroundColor Green
    $empleados | ForEach-Object { Write-Host "    - $($_.codigoEmpleado): $($_.nombres) $($_.apellidos)" }
    
    # Test 4: Get turnos
    Write-Host "`n=== TEST GET TURNOS ===" -ForegroundColor Cyan
    $turnos = Invoke-RestMethod -Uri "$baseUrl/turnos" -Method Get -Headers @{ Authorization = "Bearer $token" }
    Write-Host "[OK] GET /turnos - Total: $($turnos.length)" -ForegroundColor Green
    $turnos | ForEach-Object { Write-Host "    - $($_.nombre): $($_.horaEntrada) - $($_.horaSalida)" }
    
    # Test 5: Get tipos permiso
    Write-Host "`n=== TEST GET TIPOS PERMISO ===" -ForegroundColor Cyan
    $tipos = Invoke-RestMethod -Uri "$baseUrl/tipos-permiso" -Method Get -Headers @{ Authorization = "Bearer $token" }
    Write-Host "[OK] GET /tipos-permiso - Total: $($tipos.length)" -ForegroundColor Green
    $tipos | ForEach-Object { Write-Host "    - $($_.nombre) (doc: $($_.requiereDocumento), vac: $($_.descuentaVacaciones))" }
    
    # Test 6: Get proyectos
    Write-Host "`n=== TEST GET PROYECTOS ===" -ForegroundColor Cyan
    $proyectos = Invoke-RestMethod -Uri "$baseUrl/proyectos" -Method Get -Headers @{ Authorization = "Bearer $token" }
    Write-Host "[OK] GET /proyectos - Total: $($proyectos.length)" -ForegroundColor Green
    $proyectos | ForEach-Object { Write-Host "    - $($_.codigo): $($_.nombre)" }
    
    # Test 7: Get users
    Write-Host "`n=== TEST GET USERS ===" -ForegroundColor Cyan
    $users = Invoke-RestMethod -Uri "$baseUrl/users" -Method Get -Headers @{ Authorization = "Bearer $token" }
    Write-Host "[OK] GET /users - Total: $($users.length)" -ForegroundColor Green
    $users | ForEach-Object { Write-Host "    - $($_.username) (emp: $($_.empleadoId), estado: $($_.estado))" }
    
    Write-Host "`n=== TODOS LOS TESTS PASARON ===" -ForegroundColor Green
    
} catch {
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "    Status: $statusCode" -ForegroundColor Red
    }
}
