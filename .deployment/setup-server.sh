#!/bin/bash

# Initial Server Setup Script for vk.retry.sk
# Run this ONCE on new server as root user
# Usage: ssh root@165.22.95.150 'bash -s' < .deployment/setup-server.sh

set -e

echo "========================================="
echo "  vk.retry.sk - Server Setup"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root"
    exit 1
fi

# Step 1: System update
log_info "Updating system packages..."
apt update
apt upgrade -y
apt autoremove -y
log_success "System updated"

# Step 2: Install dependencies
log_info "Installing dependencies..."
apt install -y \
    curl \
    git \
    build-essential \
    postgresql \
    postgresql-contrib \
    nginx \
    certbot \
    python3-certbot-nginx \
    ufw \
    fail2ban

log_success "Dependencies installed"

# Step 3: Install Node.js 20 LTS
log_info "Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
log_success "Node.js $(node --version) installed"

# Step 4: Install PM2
log_info "Installing PM2..."
npm install -g pm2
log_success "PM2 installed"

# Step 5: Create deploy user
log_info "Creating deploy user..."
if id "deploy" &>/dev/null; then
    log_info "User 'deploy' already exists"
else
    adduser --disabled-password --gecos "" deploy
    usermod -aG sudo deploy
    log_success "User 'deploy' created"
fi

# Step 6: Setup SSH for deploy user
log_info "Setting up SSH for deploy user..."
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/ 2>/dev/null || echo "No authorized_keys to copy"
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys 2>/dev/null || true
log_success "SSH configured"

# Step 7: Setup PostgreSQL
log_info "Configuring PostgreSQL..."
sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname = 'vk_production'" | grep -q 1 || \
sudo -u postgres psql << 'EOSQL'
CREATE DATABASE vk_production;
CREATE USER vk_user WITH PASSWORD 'CHANGE_THIS_PASSWORD_IMMEDIATELY';
GRANT ALL PRIVILEGES ON DATABASE vk_production TO vk_user;
\c vk_production
GRANT ALL ON SCHEMA public TO vk_user;
EOSQL

log_success "PostgreSQL configured"
echo ""
echo "⚠️  IMPORTANT: Change PostgreSQL password!"
echo "   sudo -u postgres psql"
echo "   ALTER USER vk_user WITH PASSWORD 'new_secure_password';"
echo ""

# Step 8: Create application directory
log_info "Creating application directory..."
mkdir -p /var/www/vk-retry
chown -R deploy:deploy /var/www/vk-retry
log_success "Application directory created"

# Step 9: Create PM2 log directory
log_info "Creating PM2 log directory..."
mkdir -p /var/log/pm2
chown -R deploy:deploy /var/log/pm2
log_success "PM2 log directory created"

# Step 10: Setup firewall (UFW)
log_info "Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw --force enable
log_success "Firewall configured"

# Step 11: Setup fail2ban
log_info "Configuring fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban
log_success "fail2ban enabled"

# Step 12: Setup Nginx
log_info "Configuring Nginx..."
# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Create basic configuration
cat > /etc/nginx/sites-available/vk.retry.sk << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name vk.retry.sk;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/vk.retry.sk /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
log_success "Nginx configured"

# Summary
echo ""
echo "========================================="
echo "  Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Change PostgreSQL password:"
echo "   sudo -u postgres psql"
echo "   ALTER USER vk_user WITH PASSWORD 'new_secure_password';"
echo ""
echo "2. Switch to deploy user:"
echo "   su - deploy"
echo ""
echo "3. Create application directory:"
echo "   cd /var/www/vk-retry"
echo ""
echo "4. Copy .env.production file with correct credentials"
echo ""
echo "5. Run first deployment:"
echo "   (from local) ./scripts/deploy.sh"
echo ""
echo "6. Setup SSL certificate:"
echo "   sudo certbot --nginx -d vk.retry.sk"
echo ""
log_success "Server is ready for deployment!"
