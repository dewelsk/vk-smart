#!/bin/bash

# Health Check Script for vk.retry.sk
# Verifies that the application is running correctly
# Usage: ./healthcheck.sh [--url URL] [--local]
# Exit codes: 0 = healthy, 1 = unhealthy

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default configuration
URL="https://vk.retry.sk"
CHECK_LOCAL=false
TIMEOUT=10

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --url)
      URL="$2"
      shift 2
      ;;
    --local)
      CHECK_LOCAL=true
      URL="http://localhost:3000"
      shift
      ;;
    --timeout)
      TIMEOUT="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "========================================="
echo "  Health Check - vk.retry.sk"
echo "========================================="
echo ""
echo "Target: $URL"
echo "Timeout: ${TIMEOUT}s"
echo ""

FAILED=0

# Check 1: HTTP/HTTPS Response
log_info "Checking HTTP response..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$URL" || echo "000")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    log_success "HTTP response: $HTTP_CODE"
else
    log_error "HTTP response: $HTTP_CODE (expected 200/301/302)"
    FAILED=1
fi

# Check 2: Response time
log_info "Checking response time..."
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time "$TIMEOUT" "$URL" || echo "999")

if (( $(echo "$RESPONSE_TIME < 5.0" | bc -l) )); then
    log_success "Response time: ${RESPONSE_TIME}s"
else
    log_warning "Response time: ${RESPONSE_TIME}s (slower than expected)"
fi

# Check 3: PM2 process status (only if checking locally)
if [ "$CHECK_LOCAL" = true ] || [ -f "/var/www/vk-retry/ecosystem.config.js" ]; then
    log_info "Checking PM2 process status..."

    if command -v pm2 &> /dev/null; then
        PM2_STATUS=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="vk-retry") | .pm2_env.status' || echo "not_found")

        if [ "$PM2_STATUS" = "online" ]; then
            log_success "PM2 status: online"

            # Get instance count
            INSTANCE_COUNT=$(pm2 jlist 2>/dev/null | jq '[.[] | select(.name=="vk-retry")] | length' || echo "0")
            log_info "Running instances: $INSTANCE_COUNT"

            # Get memory usage
            MEMORY=$(pm2 jlist 2>/dev/null | jq -r '[.[] | select(.name=="vk-retry")] | map(.monit.memory) | add' || echo "0")
            MEMORY_MB=$((MEMORY / 1024 / 1024))
            log_info "Total memory usage: ${MEMORY_MB}MB"

            # Check if memory is too high
            if [ "$MEMORY_MB" -gt 2048 ]; then
                log_warning "High memory usage: ${MEMORY_MB}MB (threshold: 2048MB)"
            fi
        else
            log_error "PM2 status: $PM2_STATUS (expected: online)"
            FAILED=1
        fi
    else
        log_warning "PM2 not found, skipping process check"
    fi
fi

# Check 4: Database connectivity (if on server)
if [ "$CHECK_LOCAL" = true ] || [ -f "/var/www/vk-retry/.env.production" ]; then
    log_info "Checking database connectivity..."

    # Try to connect to PostgreSQL
    if command -v psql &> /dev/null; then
        # Extract DATABASE_URL from .env.production if it exists
        if [ -f "/var/www/vk-retry/.env.production" ]; then
            DB_URL=$(grep "^DATABASE_URL=" /var/www/vk-retry/.env.production | cut -d'=' -f2- | tr -d '"')

            if [ -n "$DB_URL" ]; then
                # Test connection with a simple query
                if psql "$DB_URL" -c "SELECT 1" &> /dev/null; then
                    log_success "Database connection: OK"
                else
                    log_error "Database connection: FAILED"
                    FAILED=1
                fi
            else
                log_warning "DATABASE_URL not found in .env.production"
            fi
        else
            log_warning ".env.production not found, skipping database check"
        fi
    else
        log_warning "psql not found, skipping database check"
    fi
fi

# Check 5: Disk space (if on server)
if [ "$CHECK_LOCAL" = true ] || [ -d "/var/www/vk-retry" ]; then
    log_info "Checking disk space..."

    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')

    if [ "$DISK_USAGE" -lt 80 ]; then
        log_success "Disk usage: ${DISK_USAGE}%"
    elif [ "$DISK_USAGE" -lt 90 ]; then
        log_warning "Disk usage: ${DISK_USAGE}% (getting high)"
    else
        log_error "Disk usage: ${DISK_USAGE}% (critical)"
        FAILED=1
    fi
fi

# Check 6: SSL Certificate (if checking HTTPS)
if [[ "$URL" == https://* ]]; then
    log_info "Checking SSL certificate..."

    CERT_EXPIRY=$(echo | openssl s_client -servername vk.retry.sk -connect vk.retry.sk:443 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)

    if [ -n "$CERT_EXPIRY" ]; then
        EXPIRY_EPOCH=$(date -d "$CERT_EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$CERT_EXPIRY" +%s 2>/dev/null)
        NOW_EPOCH=$(date +%s)
        DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))

        if [ "$DAYS_LEFT" -gt 30 ]; then
            log_success "SSL certificate: Valid for ${DAYS_LEFT} days"
        elif [ "$DAYS_LEFT" -gt 7 ]; then
            log_warning "SSL certificate: Expires in ${DAYS_LEFT} days (renew soon)"
        else
            log_error "SSL certificate: Expires in ${DAYS_LEFT} days (critical)"
            FAILED=1
        fi
    else
        log_warning "Could not verify SSL certificate expiry"
    fi
fi

# Check 7: Nginx status (if on server)
if [ "$CHECK_LOCAL" = true ] || systemctl list-units --type=service | grep -q nginx; then
    log_info "Checking Nginx status..."

    if systemctl is-active --quiet nginx 2>/dev/null; then
        log_success "Nginx: running"
    else
        log_error "Nginx: not running"
        FAILED=1
    fi
fi

# Summary
echo ""
echo "========================================="
if [ $FAILED -eq 0 ]; then
    log_success "All health checks passed!"
    echo "========================================="
    exit 0
else
    log_error "Some health checks failed!"
    echo "========================================="
    exit 1
fi
