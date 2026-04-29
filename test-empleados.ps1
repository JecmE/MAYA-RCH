$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c3VhcmlvSWQiOjEwLCJlbXBsZWFkb0lkIjo0LCJ1c2VybmFtZSI6Im1hcmlhZ2FyY2lhIiwicm9sZXMiOlsiRW1wbGVhZG8iXSwiaWF0IjoxNzc2OTYxNjg2LCJleHAiOjE3NzcwNDgwODZ9.1rTpb-YM7c84xOlbelu8f3V9_t_ghgxhZzqQIlAnznE"

try {
    $result = Invoke-RestMethod -Uri "http://localhost:3000/api/users/empleados" -Method GET -Headers @{Authorization="Bearer $token"}
    Write-Host "=== EMPLEADOS ===" 
    $result | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Error:" $_.Exception.Message
    $_.Exception.Response | Get-Member
}