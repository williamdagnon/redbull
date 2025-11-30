Param(
  [string] $Token = $null,
  [int] $Amount = 3000,
  [string] $PayWayId = $null,
  [string] $Url = "http://localhost:3001/recharge"
)

$body = @{ amount = $Amount; pay_way_id = $PayWayId } | ConvertTo-Json -Compress

$headers = @{ 'Content-Type' = 'application/json' }
if ($Token) { $headers['Authorization'] = "Bearer $Token" }

Write-Host "POST $Url`nPayload: $body"
try {
  $resp = Invoke-RestMethod -Uri $Url -Method Post -Body $body -ContentType 'application/json' -Headers $headers -ErrorAction Stop
  Write-Host "Response:`n" ($resp | ConvertTo-Json -Depth 5)
} catch {
  Write-Error "Request failed: $_"
}
