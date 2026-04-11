$body = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -ContentType "application/json" -Body $body
Write-Host "Token: $($response.token)"
Write-Host "UserId: $($response.usuarioId)"
Write-Host "EmpleadoId: $($response.empleadoId)"
Write-Host "Role: $($response.rol)"

# Save token to file for later use
$response | ConvertTo-Json | Out-File -FilePath "token.json" -Encoding UTF8
