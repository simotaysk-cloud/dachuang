$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
        $parts = $_ -split '=', 2
        if ($parts.Count -eq 2) {
            [System.Environment]::SetEnvironmentVariable($parts[0], $parts[1])
        }
    }
}

if (-not $env:AI_API_KEY) {
    throw "AI_API_KEY not found in .env"
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       [System] Auto Remote Deployment Wizard       " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The artifact dachuang-0.0.1-SNAPSHOT.jar will now be deployed"
Write-Host "to your Tencent Cloud Server (cpuzhbc.cn)..." -ForegroundColor Green
Write-Host ""
Write-Host ">>> IMPORTANT: Please prepare to PASTE YOUR PASSWORD." -ForegroundColor Red
Write-Host ">>> YOU WILL NEED TO PASTE IT TWICE." -ForegroundColor Red
Write-Host ">>> (Text will be hidden while pasting via Right-Click, just press Enter)" -ForegroundColor Red
Write-Host ""

try {
    Write-Host "[1/2] Uploading JAR artifact to cloud..." -ForegroundColor Magenta
    scp .\target\dachuang-0.0.1-SNAPSHOT.jar root@cpuzhbc.cn:/root/
    
    if ($LASTEXITCODE -ne 0) {
        throw "SCP upload failed. Please check the password or network."
    }

    Write-Host ""
    Write-Host "[2/2] Upload SUCCESS! Now restarting cloud services..." -ForegroundColor Magenta
    ssh root@cpuzhbc.cn "fuser -k 8091/tcp 2>/dev/null; sleep 2; nohup env AI_API_KEY='$($env:AI_API_KEY)' java -jar /root/dachuang-0.0.1-SNAPSHOT.jar --spring.profiles.active=dev --app.mock-data.enabled=true --app.mock-data.force=true > /root/backend.log 2>&1 &"
    
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "   SUCCESS! THE TRACEABILITY ENGINE IS NOW RUNNING ON CLOUD!" -ForegroundColor Yellow
    Write-Host "   You may now test the Mini-program freely." -ForegroundColor Yellow
    Write-Host "==========================================================" -ForegroundColor Cyan
} catch {
    Write-Host ""
    Write-Host "ERROR occurred: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to close this wizard..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
