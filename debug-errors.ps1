$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c3VhcmlvSWQiOjMsImVtcGxlYWRvSWQiOjMsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlcyI6WyJBZG1pbmlzdHJhZG9yIl0sImlhdCI6MTc3NTgwNDU0MSwiZXhwIjoxNzc1ODkwOTQxfQ.hWygkZrZIeXW4uGClFxZICE6lFVHrWvWIbI9Rq7bhGw"
$headers = @{ "Authorization" = "Bearer $token" }

Write-Host "=== attendance/team ===" -ForegroundColor Cyan
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:3000/api/attendance/team' -Headers $headers -Method GET
    $r.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
} catch { $_.Exception.Response.Headers | Out-Host; $r = $_.Exception.Response.GetResponseStream(); $reader = [System.IO.StreamReader]::new($r); $reader.ReadToEnd() }

Write-Host "`n=== leaves/pending ===" -ForegroundColor Cyan
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:3000/api/leaves/pending' -Headers $headers -Method GET
    $r.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
} catch { $_.Exception.Response.Headers | Out-Host; $r = $_.Exception.Response.GetResponseStream(); $reader = [System.IO.StreamReader]::new($r); $reader.ReadToEnd() }

Write-Host "`n=== leaves/vacation-balance ===" -ForegroundColor Cyan
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:3000/api/leaves/vacation-balance' -Headers $headers -Method GET
    $r.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
} catch { $_.Exception.Response.Headers | Out-Host; $r = $_.Exception.Response.GetResponseStream(); $reader = [System.IO.StreamReader]::new($r); $reader.ReadToEnd() }

Write-Host "`n=== kpi/dashboard/supervisor ===" -ForegroundColor Cyan
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:3000/api/kpi/dashboard/supervisor' -Headers $headers -Method GET
    $r.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
} catch { $_.Exception.Response.Headers | Out-Host; $r = $_.Exception.Response.GetResponseStream(); $reader = [System.IO.StreamReader]::new($r); $reader.ReadToEnd() }

Write-Host "`n=== reports/monthly-attendance ===" -ForegroundColor Cyan
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:3000/api/reports/monthly-attendance?mes=4&anio=2026' -Headers $headers -Method GET
    $r.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
} catch { $_.Exception.Response.Headers | Out-Host; $r = $_.Exception.Response.GetResponseStream(); $reader = [System.IO.StreamReader]::new($r); $reader.ReadToEnd() }

Write-Host "`n=== reports/bonus-eligibility ===" -ForegroundColor Cyan
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:3000/api/reports/bonus-eligibility?mes=4&anio=2026' -Headers $headers -Method GET
    $r.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
} catch { $_.Exception.Response.Headers | Out-Host; $r = $_.Exception.Response.GetResponseStream(); $reader = [System.IO.StreamReader]::new($r); $reader.ReadToEnd() }

Write-Host "`n=== reports/project-hours ===" -ForegroundColor Cyan
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:3000/api/reports/project-hours?fechaInicio=2026-01-01&fechaFin=2026-12-31' -Headers $headers -Method GET
    $r.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
} catch { $_.Exception.Response.Headers | Out-Host; $r = $_.Exception.Response.GetResponseStream(); $reader = [System.IO.StreamReader]::new($r); $reader.ReadToEnd() }
