$dir = 'C:\Users\UDITH\Documents\GitHub\TEAM-QWERTY\BACKEND\core_api_service\local_data'
$fi = Get-ChildItem -Path $dir -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($fi) {
    Write-Host "Showing file: $($fi.FullName)"
    Get-Content $fi.FullName -Raw
} else {
    Write-Host "No files found in $dir"
}
