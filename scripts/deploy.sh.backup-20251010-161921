#!/bin/bash

# Production Deployment Script for vk.retry.sk
# Usage: ./scripts/deploy.sh

set -e  # Exit on error

# Configuration
SERVER="deploy@165.22.95.150"
APP_DIR="/var/www/vk-retry"
BACKUP_DIR="/var/www/vk-retry-backup"
SSH_KEY="~/.ssh/monitra_do"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Confirmation prompt
echo ""
echo "========================================="
echo "  Production Deployment - vk.retry.sk"
echo "========================================="
echo ""
echo "Server: $SERVER"
echo "Target: $APP_DIR"
echo ""
read -p "Deploy to PRODUCTION? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    log_error "Deployment cancelled"
    exit 1
fi

echo ""
log_info "Starting deployment..."
echo ""

# Step 1: Check git status
log_info "Checking git status..."
if [[ -n $(git status -s) ]]; then
    log_warning "You have uncommitted changes!"
    git status -s
    echo ""
    read -p "Continue anyway? (yes/no): " continue_dirty
    if [ "$continue_dirty" != "yes" ]; then
        log_error "Deployment cancelled"
        exit 1
    fi
fi

CURRENT_BRANCH=$(git branch --show-current)
CURRENT_COMMIT=$(git rev-parse --short HEAD)
log_success "Git: $CURRENT_BRANCH @ $CURRENT_COMMIT"

# Step 2: Create backup on server
log_info "Creating backup on server..."
ssh -i "$SSH_KEY" "$SERVER" << 'ENDSSH'
if [ -d "/var/www/vk-retry" ]; then
    BACKUP_NAME="/var/www/vk-retry-backup-$(date +%Y%m%d-%H%M%S)"
    cp -r /var/www/vk-retry "$BACKUP_NAME"
    echo "Backup created: $BACKUP_NAME"

    # Keep only last 5 backups
    cd /var/www
    ls -dt vk-retry-backup-* | tail -n +6 | xargs -r rm -rf
else
    echo "No existing deployment to backup"
fi
ENDSSH
log_success "Backup created"

# Step 3: Rsync code to server
log_info "Syncing code to server..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.git' \
    --exclude 'test-results' \
    --exclude 'playwright-report' \
    --exclude '.env*' \
    --exclude 'docs/daily' \
    --exclude '*.log' \
    -e "ssh -i $SSH_KEY" \
    ./ "$SERVER:$APP_DIR/"

log_success "Code synced"

# Step 4: Build and restart on server
log_info "Building application on server..."
ssh -i "$SSH_KEY" "$SERVER" << 'ENDSSH'
set -e

cd /var/www/vk-retry

# Load environment variables from .env.production
set -a
source .env.production
set +a

echo "📦 Installing dependencies..."
npm ci --production=false

echo "🔨 Generating Prisma client..."
npx prisma generate

echo "🗃️  Running database migrations..."
npx prisma migrate deploy

echo "🏗️  Building Next.js application..."
npm run build

echo "🔄 Reloading PM2 (graceful restart)..."
pm2 reload ecosystem.config.js --update-env

echo "💾 Saving PM2 configuration..."
pm2 save

echo ""
echo "✅ Build complete!"
ENDSSH

log_success "Application built and restarted"

# Step 5: Health check
log_info "Waiting 5 seconds for application to start..."
sleep 5

log_info "Running health check..."
if curl -f -s -o /dev/null -w "%{http_code}" https://vk.retry.sk | grep -q "200\|302"; then
    log_success "Health check passed! ✨"
else
    log_error "Health check FAILED!"
    log_warning "Check logs: ssh -i $SSH_KEY $SERVER 'pm2 logs vk-retry'"
    exit 1
fi

# Step 6: Summary
echo ""
echo "========================================="
echo "  Deployment Summary"
echo "========================================="
echo "Branch:  $CURRENT_BRANCH"
echo "Commit:  $CURRENT_COMMIT"
echo "Server:  $SERVER"
echo "URL:     https://vk.retry.sk"
echo ""
log_success "Deployment completed successfully! 🚀"
echo ""
echo "Useful commands:"
echo "  - View logs:    ssh -i $SSH_KEY $SERVER 'pm2 logs vk-retry'"
echo "  - View status:  ssh -i $SSH_KEY $SERVER 'pm2 status'"
echo "  - Restart:      ssh -i $SSH_KEY $SERVER 'pm2 restart vk-retry'"
echo ""
