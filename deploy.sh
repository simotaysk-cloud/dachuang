#!/bin/bash
set -e

echo "[1/5] Killing old Java processes..."
pkill -9 java 2>/dev/null || true
sleep 2

echo "[2/5] Verifying JAR..."
ls -lh /root/app.jar

echo "[3/5] Fixing Nginx (removing port 8091 from public URL, adding upload size limit fix)..."
rm -f /etc/nginx/sites-enabled/*
rm -f /etc/nginx/conf.d/*
# Remove duplicate client_max_body_size from main config to prevent emerge errors
sed -i '/client_max_body_size/d' /etc/nginx/nginx.conf
cat > /etc/nginx/sites-enabled/default <<'NGINX'
server {
    listen 80 default_server;
    server_name _;
    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:8091;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Port 80;
        proxy_read_timeout 120s;
        proxy_connect_timeout 30s;
    }
}

server {
    listen 443 ssl default_server;
    server_name _;
    client_max_body_size 100M;

    ssl_certificate /etc/nginx/ssl/server.crt;
    ssl_certificate_key /etc/nginx/ssl/server.key;

    location / {
        proxy_pass http://127.0.0.1:8091;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Port 443;
        proxy_read_timeout 120s;
        proxy_connect_timeout 30s;
    }
}
NGINX

echo "[3b/5] Creating self-signed SSL cert if not exists..."
mkdir -p /etc/nginx/ssl
if [ ! -f /etc/nginx/ssl/server.crt ]; then
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/server.key \
        -out /etc/nginx/ssl/server.crt \
        -subj "/CN=146.56.231.239"
fi

echo "[4/5] Testing and restarting Nginx..."
nginx -t && systemctl restart nginx

echo "[5/5] Starting backend with corrected public URL (no port)..."
nohup java -jar /root/app.jar \
    --app.public-base-url=http://146.56.231.239 \
    > /root/backend.log 2>&1 &

echo "Waiting 8 seconds for Spring Boot to start..."
sleep 8

echo "=== Startup log ==="  
grep -E 'Started|ERROR|WARN.*port' /root/backend.log | head -10

echo "=== QR URL config check ==="
grep -i 'public-base' /root/backend.log | head -5

echo "[DONE] Backend deployed!"
