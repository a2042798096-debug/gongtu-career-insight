param(
  [string]$ReleaseDirectory = (Join-Path $PSScriptRoot "..\release"),
  [string]$CertificateSubject = "CN=Gongtu Development"
)

$ErrorActionPreference = "Stop"

$certificate = Get-ChildItem Cert:\CurrentUser\My |
  Where-Object { $_.Subject -eq $CertificateSubject -and $_.NotAfter -gt (Get-Date) } |
  Sort-Object NotAfter -Descending |
  Select-Object -First 1

if (-not $certificate) {
  throw "No valid code-signing certificate found for $CertificateSubject. Run scripts/create-dev-certificate.ps1 first."
}

$targets = Get-ChildItem -LiteralPath $ReleaseDirectory -Filter "*.exe" -File
if (-not $targets) {
  throw "No executable files found in $ReleaseDirectory."
}

$signedFiles = @()
foreach ($target in $targets) {
  $result = Set-AuthenticodeSignature `
    -FilePath $target.FullName `
    -Certificate $certificate `
    -HashAlgorithm SHA256

  if ($result.SignerCertificate -and $result.SignerCertificate.Thumbprint -eq $certificate.Thumbprint) {
    $trust = if ($result.Status -eq "Valid") { "trusted" } else { "self-signed / untrusted chain" }
    Write-Output "$($target.Name): signed ($trust) [$($certificate.Thumbprint)]"
    $signedFiles += [PSCustomObject]@{
      Name = $target.Name
      State = if ($result.Status -eq "Valid") { "Valid" } else { "Present; self-signed trust chain is not trusted by Windows" }
    }
  } else {
    throw "Signing failed for $($target.Name): $($result.StatusMessage)"
  }
}

$hashLines = $targets |
  Sort-Object Name |
  ForEach-Object {
    $hash = Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256
    "$($hash.Hash)  $($_.Name)"
  }
Set-Content -LiteralPath (Join-Path $ReleaseDirectory "SHA256SUMS.txt") -Value $hashLines -Encoding utf8

$signatureLines = @(
  "Gongtu Career Insight - Windows x64",
  "Build and signing date: $((Get-Date).ToString('yyyy-MM-dd HH:mm:ss zzz'))",
  "",
  "Authenticode signer",
  "  Subject: $($certificate.Subject)",
  "  Thumbprint: $($certificate.Thumbprint)",
  "  Hash algorithm: SHA-256",
  "  Certificate expiry: $($certificate.NotAfter.ToString('yyyy-MM-dd HH:mm:ss'))",
  "  Certificate type: Self-signed development code-signing certificate",
  "",
  "Signed files"
)
$signatureLines += $signedFiles | ForEach-Object { "  $($_.Name) | signature: $($_.State)" }
$signatureLines += @(
  "",
  "Verification note",
  "  Each listed executable contains an Authenticode signature for the signer above.",
  "  Windows reports the trust chain as untrusted unless the included public certificate",
  "  is explicitly trusted by an administrator, because it is not issued by a commercial CA.",
  "",
  "Public certificate",
  "  ..\certificates\gongtu-development-code-signing.cer",
  "",
  "SHA-256 checksums are stored in SHA256SUMS.txt."
)
Set-Content -LiteralPath (Join-Path $ReleaseDirectory "SIGNATURE-REPORT.txt") -Value $signatureLines -Encoding utf8

Write-Output "Updated SHA256SUMS.txt and SIGNATURE-REPORT.txt."
