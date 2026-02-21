#!/bin/bash
set -e

# ============================================================
# AU CV Matching - Server Deployment Script
# Run this on your Ubuntu server:
#   sudo bash deploy.sh
# ============================================================

echo "=== AU CV Matching Deployment ==="
echo ""

# Prompt for secrets
read -p "Enter your Anthropic API Key: " ANTHROPIC_KEY
read -p "Enter your Database URL: " DATABASE_URL_VAL
read -p "Enter your server IP or domain: " SERVER_HOST

echo ""

# 1. Install system dependencies
echo "[1/7] Installing system packages..."
apt-get update -qq
apt-get install -y -qq python3 python3-pip python3-venv nginx git curl

# 2. Install Node.js (for building frontend)
if ! command -v node &> /dev/null; then
    echo "[2/7] Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y -qq nodejs
else
    echo "[2/7] Node.js already installed"
fi

# 3. Clone or update the repo
APP_DIR="/opt/au-cv-matching"
if [ -d "$APP_DIR" ]; then
    echo "[3/7] Updating existing repo..."
    cd "$APP_DIR"
    git pull origin main
else
    echo "[3/7] Cloning repo..."
    git clone https://github.com/eyotomtomm/AU-CV-Matching.git "$APP_DIR"
    cd "$APP_DIR"
fi

# 4. Backend setup
echo "[4/7] Setting up backend..."
cd "$APP_DIR/backend"

python3 -m venv venv
source venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Create .env file with provided secrets
cat > .env << ENVEOF
ANTHROPIC_API_KEY=${ANTHROPIC_KEY}
DATABASE_URL=${DATABASE_URL_VAL}
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
ENVEOF

deactivate

# 5. Build frontend
echo "[5/7] Building frontend..."
cd "$APP_DIR/frontend"

cat > .env << ENVEOF
VITE_API_URL=http://${SERVER_HOST}/api
ENVEOF

npm install --silent
npm run build

# 6. Configure systemd service for backend
echo "[6/7] Configuring backend service..."
cat > /etc/systemd/system/au-cv-matching.service << 'SERVICEEOF'
[Unit]
Description=AU CV Matching API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/au-cv-matching/backend
Environment=PATH=/opt/au-cv-matching/backend/venv/bin:/usr/bin
ExecStart=/opt/au-cv-matching/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICEEOF

systemctl daemon-reload
systemctl enable au-cv-matching
systemctl restart au-cv-matching

# 7. Configure nginx
echo "[7/7] Configuring nginx..."
cat > /etc/nginx/sites-available/au-cv-matching << NGINXEOF
server {
    listen 80;
    server_name ${SERVER_HOST};

    root /opt/au-cv-matching/frontend/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
        client_max_body_size 50M;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/au-cv-matching /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

echo ""
echo "=== Deployment Complete ==="
echo "Frontend: http://${SERVER_HOST}"
echo "API:      http://${SERVER_HOST}/api"
echo "API Docs: http://${SERVER_HOST}/api/docs"
echo ""
echo "Login: admin / admin123"
echo ""
echo "Useful commands:"
echo "  systemctl status au-cv-matching   # Check backend status"
echo "  journalctl -u au-cv-matching -f   # View backend logs"
echo "  systemctl restart au-cv-matching  # Restart backend"
