param(
  [string]$WebhookUrl = "https://kesar-ai-copilot.app.n8n.cloud/webhook/kesar-customer-email",
  [string]$EmailsPath = "$PSScriptRoot\..\data\test_emails.json",
  [int]$DelayMs = 2500
)

$data = Get-Content $EmailsPath -Raw -Encoding UTF8 | ConvertFrom-Json
$targetIds = @("E04", "E06", "E21")

foreach ($id in $targetIds) {
  $email = $data.emails | Where-Object { $_.id -eq $id } | Select-Object -First 1
  if (-not $email) {
    Write-Warning "Email $id not found."
    continue
  }
  $body = $email | ConvertTo-Json -Depth 6
  try {
    $resp = Invoke-RestMethod -Uri $WebhookUrl -Method Post -ContentType "application/json; charset=utf-8" -Body $body
    Write-Host "$id -> HTTP OK ($($resp | ConvertTo-Json -Compress))"
  } catch {
    Write-Warning "$id -> FAILED: $($_.Exception.Message)"
  }
  Start-Sleep -Milliseconds $DelayMs
}

Write-Host "Verify in Google Sheets: Audit Log has E04, E06 (log_only, empty reply/ticket), E21; Tickets has TKT-E04 with email_ids = 'E04, E21'."
