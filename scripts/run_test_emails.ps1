param(
  [string]$WebhookUrl = "https://kesar-ai-copilot.app.n8n.cloud/webhook/kesar-customer-email",
  [string]$EmailsPath = "$PSScriptRoot\..\data\test_emails.json",
  [int]$DelayMs = 2000
)

if (-not (Test-Path $EmailsPath)) {
  Write-Error "Emails file not found at $EmailsPath"
  exit 1
}

$data = Get-Content $EmailsPath -Raw -Encoding UTF8 | ConvertFrom-Json
$total = $data.emails.Count
$idx = 0
$succeeded = 0
$failed = 0

Write-Host "Sending $total emails to $WebhookUrl (delay ${DelayMs}ms)..."
foreach ($email in $data.emails) {
  $idx++
  $body = $email | ConvertTo-Json -Depth 6
  try {
    $resp = Invoke-RestMethod -Uri $WebhookUrl -Method Post -ContentType "application/json; charset=utf-8" -Body $body
    $succeeded++
    $msg = if ($resp -and $resp.message) { $resp.message } else { "OK" }
    Write-Host ("[{0:D2}/{1}] {2} ({3}) -> {4}" -f $idx, $total, $email.id, $email.from.email, $msg)
  } catch {
    $failed++
    Write-Warning ("[{0:D2}/{1}] {2} -> FAILED: {3}" -f $idx, $total, $email.id, $_.Exception.Message)
  }
  if ($idx -lt $total) {
    Start-Sleep -Milliseconds $DelayMs
  }
}

Write-Host ""
Write-Host "Summary: Succeeded = $succeeded / $total | Failed = $failed"
Write-Host "Expected in Kesar Support Google Sheet:"
Write-Host "  - Audit Log: 25 rows (E01-E25), E06 = log_only with empty ticket_id & reply_draft"
Write-Host "  - Tickets:   14 unique rows, TKT-E04 (KC-1052) merged with email_ids = 'E04, E21'"
