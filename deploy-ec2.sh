#!/bin/bash
# ============================================================
#  AWS EC2 Deploy Script — Efficient Procurement System
#  Run this on a fresh Ubuntu 22.04 EC2 instance
# ============================================================
set -e

APP_DIR="/opt/procurement"
REPO_URL="https://github.com/adishaerangikokilasanjeewani-lgtm/Ai-Efficieant-Procument-System.git"

echo "===================================================="
echo " Efficient Procurement System — EC2 Setup"
echo "===================================================="

# 1. Update system
echo ">>> [1/7] Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# 2. Install Docker
echo ">>> [2/7] Installing Docker..."
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io
sudo usermod -aG docker $USER
sudo systemctl enable docker
sudo systemctl start docker

# 3. Clone repository
echo ">>> [3/7] Cloning repository..."
sudo rm -rf $APP_DIR
sudo git clone $REPO_URL $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# 4. Create production .env for backend
echo ">>> [4/7] Creating backend .env..."
cat > $APP_DIR/backend/.env << 'EOF'
USE_SQLITE=true
SECRET_KEY=CHANGE_THIS_TO_A_STRONG_SECRET_KEY_IN_PRODUCTION
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
EOF

echo ""
echo "  ⚠️  IMPORTANT: Edit the SECRET_KEY in $APP_DIR/backend/.env!"
echo "  Run: nano $APP_DIR/backend/.env"
echo ""

# 5. Create persistent data volume directory
echo ">>> [5/7] Creating data directory..."
sudo mkdir -p /opt/procurement-data
sudo chown -R $USER:$USER /opt/procurement-data

# 6. Build Docker image
echo ">>> [6/7] Building Docker image (this takes 5-10 minutes)..."
cd $APP_DIR
sudo docker build -t procurement-app .

# 7. Run container
echo ">>> [7/7] Starting application..."
sudo docker stop procurement 2>/dev/null || true
sudo docker rm procurement 2>/dev/null || true

sudo docker run -d \
  --name procurement \
  --restart unless-stopped \
  -p 80:80 \
  -v /opt/procurement-data:/app/data \
  --env-file $APP_DIR/backend/.env \
  procurement-app

echo ""
echo "===================================================="
echo " ✅ Deployment complete!"
echo "===================================================="
echo ""
echo " 🌐 App URL: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo " 📋 Logs:    sudo docker logs -f procurement"
echo " 🔄 Restart: sudo docker restart procurement"
echo ""
echo " ⚠️  Make sure EC2 Security Group allows port 80 (HTTP)!"
echo ""
