#!/bin/bash

# SSL Certificate Setup Script for vk.retry.sk
# Run on server as root: sudo bash ssl-setup.sh
# Requires: certbot, nginx

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "========================================="
echo "  SSL Certificate Setup - vk.retry.sk"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root (sudo)"
    exit 1
fi

# Check if domain resolves
log_info "Checking DNS resolution for vk.retry.sk..."
if host vk.retry.sk | grep -q "has address"; then
    IP=$(host vk.retry.sk | grep "has address" | head -1 | awk '{print $4}')
    log_success "vk.retry.sk resolves to $IP"
else
    log_warning "vk.retry.sk does not resolve!"
    echo "Please ensure DNS is configured before running this script."
    exit 1
fi

# Check if Nginx is running
log_info "Checking Nginx status..."
if systemctl is-active --quiet nginx; then
    log_success "Nginx is running"
else
    echo "❌ Nginx is not running. Start it first:"
    echo "   sudo systemctl start nginx"
    exit 1
fi

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "❌ certbot is not installed. Install it first:"
    echo "   sudo apt install certbot python3-certbot-nginx"
    exit 1
fi

# Run certbot
log_info "Running certbot to obtain SSL certificate..."
echo ""
log_warning "You will be prompted to enter an email address"
log_warning "Accept Terms of Service when prompted"
echo ""

certbot --nginx -d vk.retry.sk

# Test auto-renewal
log_info "Testing certificate auto-renewal..."
certbot renew --dry-run

log_success "SSL certificate installed and auto-renewal configured!"
echo ""
echo "Your site is now available at: https://vk.retry.sk"
echo ""
echo "Certificate will auto-renew via systemd timer:"
echo "  systemctl list-timers | grep certbot"
echo ""
