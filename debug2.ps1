$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c3VhcmlvSWQiOjMsImVtcGxlYWRvSWQiOjMsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlcyI6WyJBZG1pbmlzdHJhZG9yIl0sImlhdCI6MTc3NTgwNDU0MSwiZXhwIjoxNzc1ODkwOTQxfQ.hWygkZrZIeXW4uGClFxZICE6lFVHrWvWIbI9Rq7bhGw"
$headers = @{ "Authorization" = "Bearer $token" }

$endpoints = @(
    "http://localhost:3000/api/attendance/team",
    "http://localhost:3000/api/leaves/pending",
    "http://localhost:3000/api/leaves/vacation-balance",
    "http://localhost:3000/api/kpi/dashboard/supervisor",
    "http://localhost:3000/api/reports/monthly-attendance?mes=4&anio=2026",
    "http://localhost:3000/api/reports/bonus-eligibility?mes=4&anio=2026",
    "http://localhost:3000/api/reports/project-hours?fechaInicio=2026-01-01&fechaFin=2026-12-31"
)

foreach ($url in $endpoints) {
    Write-Host "`n=== $($url.Split('/')[3]) ===" -ForegroundColor Cyan
    try {
        $response = Invoke-RestMethod -Uri $url -Headers $headers -Method GET -ErrorAction Stop
        Write-Host "OK: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Green
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = [System.IO.StreamReader]::new($stream)
        $body = $reader.ReadToEnd()
        Write-Host "ERROR $statusCode : $body" -ForegroundColor Red
    }
}
