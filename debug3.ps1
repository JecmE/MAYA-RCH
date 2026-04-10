$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c3VhcmlvSWQiOjMsImVtcGxlYWRvSWQiOjMsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlcyI6WyJBZG1pbmlzdHJhZG9yIl0sImlhdCI6MTc3NTgwNDU0MSwiZXhwIjoxNzc1ODkwOTQxfQ.hWygkZrZIeXW4uGClFxZICE6lFVHrWvWIbI9Rq7bhGw"
$headers = @{ "Authorization" = "Bearer $token" }

$url = "http://localhost:3000/api/attendance/team"
try {
    $response = Invoke-WebRequest -Uri $url -Headers $headers -Method GET
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Content: $($response.Content)"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Status: $statusCode"
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = [System.IO.StreamReader]::new($stream)
    $reader.BaseStream.Position = 0
    $body = $reader.ReadToEnd()
    Write-Host "Body: $body"
}
