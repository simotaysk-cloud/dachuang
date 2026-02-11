@echo off
setlocal

cd /d "%~dp0"
set "JAVA_HOME=%~dp0\jdk-17.0.9+8"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo ========================================================
echo Detecting Local IP and Updating Frontend Config...

rem Change code page to UTF-8 for Chinese path support
chcp 65001

powershell -Command "$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike '*Loopback*' -and $_.InterfaceAlias -notlike '*vEthernet*' -and $_.IPAddress -match '^192\.' } | Select-Object -First 1).IPAddress; if (!$ip) { $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike '*Loopback*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1).IPAddress }; if ($ip) { Write-Host \"Found IP: $ip\"; $targetPath = Resolve-Path '..\..\前端代码\miniprogram-5\utils\config.js'; Write-Host \"Updating config at: $targetPath\"; $content = \"const config = {`r`n    apiBaseUrl: 'http://$($ip):8091',`r`n    debug: true`r`n}`r`n`r`nmodule.exports = config\"; Set-Content -Path $targetPath -Value $content -Encoding UTF8; Write-Host 'Frontend config updated successfully.'; } else { Write-Warning 'Could not detect LAN IP. Please check config.js manually.'; }"

echo ========================================================

echo Starting Backend with Portable JDK and Maven...
echo Mock Data Enabled (Data Persisted)...
.\apache-maven-3.9.6\bin\mvn -DskipTests spring-boot:run "-Dspring-boot.run.arguments=--spring.datasource.username=root --spring.datasource.password= --app.mock-data.enabled=true --app.mock-data.force=false"

endlocal
