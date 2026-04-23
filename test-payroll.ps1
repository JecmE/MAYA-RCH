$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c3VhcmlvSWQiOjEwLCJlbXBsZWFkb0lkIjo0LCJ1c2VybmFtZSI6Im1hcmlhZ2FyY2lhIiwicm9sZXMiOlsiRW1wbGVhZG8iXSwiaWF0IjoxNzc2OTYxNjg2LCJleHAiOjE3NzcwNDgwODZ9.1rTpb-YM7c84xOlbelu8f3V9_t_ghgxhZzqQIlAnznE"

Start-Sleep -Seconds 3

# Get paycheck
$paycheck = Invoke-RestMethod -Uri "http://localhost:3000/api/payroll/my-paycheck" -Method GET -Headers @{Authorization="Bearer $token"}
Write-Host "=== PAYCHECK ==="
$paycheck | ConvertTo-Json -Depth 5