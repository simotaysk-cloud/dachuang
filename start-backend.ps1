# Set environment variables for local tools
$env:JAVA_HOME = "C:\Users\HUANXI\Desktop\dachuang\env\jdk-17.0.10+7"
$env:M2_HOME = "C:\Users\HUANXI\Desktop\dachuang\env\apache-maven-3.9.6"
$env:PATH = "$env:JAVA_HOME\bin;$env:M2_HOME\bin;$env:PATH"

# Find the tools dynamically
$springbootDir = Get-ChildItem -Path . -Directory -Recurse | Where-Object { $_.Name -eq "springboot" } | Select-Object -First 1 -ExpandProperty FullName
$mysqlDir = "C:\Users\HUANXI\Desktop\dachuang\env\mysql-8.0.40-winx64"

# 1. Start MySQL in the background if not already running
if (!(Get-Process mysqld -ErrorAction SilentlyContinue)) {
    echo "Starting MySQL..."
    Start-Process -FilePath "$mysqlDir\bin\mysqld.exe" -ArgumentList "--defaults-file=$mysqlDir\my.ini", "--console" -WindowStyle Hidden
    Start-Sleep -Seconds 10
}

# 2. Create database if it doesn't exist
echo "Ensuring 'dachuang' database exists..."
& "$mysqlDir\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS dachuang CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 3. Start Spring Boot using the local MySQL
if ($springbootDir) {
    cd $springbootDir
    echo "Starting Spring Boot on http://127.0.0.1:8091 (Using Local MySQL)"
    $mavenArgs = @(
        "spring-boot:run",
        "-Dspring-boot.run.arguments=--server.port=8091 --spring.profiles.active=dev --app.mock-data.enabled=true --spring.datasource.url=jdbc:mysql://localhost:3306/dachuang?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true --spring.datasource.username=root --spring.datasource.password= --spring.flyway.enabled=true"
    )
    mvn $mavenArgs
}
else {
    echo "Error: Could not find 'springboot' directory."
}
