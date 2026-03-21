@echo off
set "JAVA_HOME=C:\Users\HUANXI\Desktop\dachuang\env\jdk-17.0.10+7"
set "M2_HOME=C:\Users\HUANXI\Desktop\dachuang\env\apache-maven-3.9.6"
set "PATH=%JAVA_HOME%\bin;%M2_HOME%\bin;%PATH%"
cd /d "c:\Users\HUANXI\Desktop\dachuang\后端代码\springboot"
call mvn clean package -DskipTests
