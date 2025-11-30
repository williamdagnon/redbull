Param(
  [Parameter(Mandatory=$true)] [string] $OrderId,
  [string] $Status = "payin_success",
  [int] $Amount = 3000,
  [string] $Url = "http://localhost:3001/inpay/callback"
)

# Build JSON body
$body = @{ orderid = $OrderId; status = $Status; amount = $Amount } | ConvertTo-Json -Compress

# Compute HMAC-SHA256 signature if INPAY_SECRET is set
$secret = $env:INPAY_SECRET
$headers = @{}
if ($secret) {
  $hmac = New-Object System.Security.Cryptography.HMACSHA256 ([System.Text.Encoding]::UTF8.GetBytes($secret))
  $sigBytes = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($body))
  $sig = -join ($sigBytes | ForEach-Object { $_.ToString('x2') })
  $headers['x-inpay-signature'] = $sig
  Write-Host "Using INPAY_SECRET for signature (header x-inpay-signature)"
} else {
  Write-Host "INPAY_SECRET not set - sending without signature header"
}

Write-Host "Sending callback to $Url with orderid=$OrderId status=$Status amount=$Amount"
try {
  $resp = Invoke-RestMethod -Uri $Url -Method Post -Body $body -ContentType 'application/json' -Headers $headers -ErrorAction Stop
  Write-Host "Response:`n" ($resp | ConvertTo-Json -Depth 5)
} catch {
  Write-Error "Request failed: $_"
}
