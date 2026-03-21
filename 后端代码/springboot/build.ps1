$env:JAVA_HOME = "C:\Users\HUANXI\Desktop\dachuang\env\jdk-17.0.10+7"
$env:M2_HOME = "C:\Users\HUANXI\Desktop\dachuang\env\apache-maven-3.9.6"
$env:PATH = "$env:JAVA_HOME\bin;$env:M2_HOME\bin;$env:PATH"
Set-Location "c:\Users\HUANXI\Desktop\dachuang\后端代码\springboot"
mvn clean package -DskipTests
