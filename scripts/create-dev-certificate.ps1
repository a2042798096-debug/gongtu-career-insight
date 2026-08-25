param(
  [string]$Subject = "CN=Gongtu Development",
  [string]$OutputDirectory = (Join-Path $PSScriptRoot "..\certificates")
)

$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null

$existing = Get-ChildItem Cert:\CurrentUser\My |
  Where-Object { $_.Subject -eq $Subject -and $_.NotAfter -gt (Get-Date).AddMonths(1) } |
  Sort-Object NotAfter -Descending |
  Select-Object -First 1

if ($existing) {
  $certificate = $existing
} else {
  $certificate = New-SelfSignedCertificate `
    -Type CodeSigningCert `
    -Subject $Subject `
    -KeyAlgorithm RSA `
    -KeyLength 3072 `
    -HashAlgorithm SHA256 `
    -KeyExportPolicy Exportable `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -NotAfter (Get-Date).AddYears(3)
}

$cerPath = Join-Path $OutputDirectory "gongtu-development-code-signing.cer"
Export-Certificate -Cert $certificate -FilePath $cerPath -Force | Out-Null

Write-Output "THUMBPRINT=$($certificate.Thumbprint)"
Write-Output "CERTIFICATE=$cerPath"
