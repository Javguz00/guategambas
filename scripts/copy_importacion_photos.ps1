param(
    [string]$source = "C:\Users\javgu\Downloads\importacion\plantas",
    [string]$dest = "public/photos/importacion-plantas"
)

if (-not (Test-Path $source)) {
    Write-Host "Source folder not found: $source"
    exit 1
}

if (-not (Test-Path $dest)) {
    New-Item -ItemType Directory -Path $dest | Out-Null
}

Get-ChildItem -Path $source -File -Include *.jpg,*.jpeg,*.png,*.webp | ForEach-Object -Begin { $i = 1 } -Process {
    $targetName = $_.Name
    Copy-Item -Path $_.FullName -Destination (Join-Path $dest $targetName) -Force
    Write-Host "Copied " $_.Name " -> $dest"
}

Write-Host "Done. Imported photos to $dest"
