#!/bin/bash
set -e

# ============================================================
# AU CV Matching - User-level Deployment (no root needed)
# Run: bash deploy.sh
# ============================================================

echo "=== AU CV Matching Deployment ==="
echo ""

read -p "Enter your Anthropic API Key: " ANTHROPIC_KEY
read -p "Enter your Database URL: " DATABASE_URL_VAL
read -p "Enter your server IP or domain: " SERVER_HOST

echo ""

APP_DIR="$HOME/au-cv-matching"

# 1. Clone or update repo
if [ -d "$APP_DIR" ]; then
    echo "[1/4] Updating existing repo..."
    cd "$APP_DIR"
    git pull origin main
else
    echo "[1/4] Cloning repo..."
    git clone https://github.com/eyotomtomm/AU-CV-Matching.git "$APP_DIR"
    cd "$APP_DIR"
fi

# 2. Backend setup
echo "[2/4] Setting up backend..."
cd "$APP_DIR/backend"

python3 -m venv venv
source venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt

cat > .env << ENVEOF
ANTHROPIC_API_KEY=${ANTHROPIC_KEY}
DATABASE_URL=${DATABASE_URL_VAL}
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
ENVEOF

deactivate

# 3. Build frontend
echo "[3/4] Building frontend..."
cd "$APP_DIR/frontend"

cat > .env << ENVEOF
VITE_API_URL=http://${SERVER_HOST}:8000/api
ENVEOF

npm install --silent
npm run build

# 4. Install serve for frontend
echo "[4/4] Installing frontend server..."
npm install -g serve 2>/dev/null || npm install serve

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Now start the app with these 2 commands (in separate terminals or use &):"
echo ""
echo "--- Start backend ---"
echo "cd $APP_DIR/backend && source venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000"
echo ""
echo "--- Start frontend ---"
echo "cd $APP_DIR/frontend && npx serve dist -l 3000"
echo ""
echo "Then open: http://${SERVER_HOST}:3000"
echo "API at:    http://${SERVER_HOST}:8000/api"
echo "Login:     admin / admin123"
echo ""
echo "--- Or start BOTH in background (recommended) ---"
echo "bash $APP_DIR/start.sh"

# Create a start script
cat > "$APP_DIR/start.sh" << STARTEOF
#!/bin/bash
cd $APP_DIR/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=\$!
echo "Backend started (PID: \$BACKEND_PID)"

cd $APP_DIR/frontend
npx serve dist -l 3000 &
FRONTEND_PID=\$!
echo "Frontend started (PID: \$FRONTEND_PID)"

echo ""
echo "App running at: http://${SERVER_HOST}:3000"
echo "API running at: http://${SERVER_HOST}:8000/api"
echo "Login: admin / admin123"
echo ""
echo "To stop: kill \$BACKEND_PID \$FRONTEND_PID"
wait
STARTEOF

chmod +x "$APP_DIR/start.sh"
