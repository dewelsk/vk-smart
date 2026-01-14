# Technická architektúra - Systém digitalizácie výberových konaní

## Prehľad architektúry

### Lokálny development
- **5600**: Next.js aplikácia (frontend + backend API)
- **5601**: SSH tunnel na produkčnú PostgreSQL databázu (remote server port 5433)

### Production server (vk.retry.sk)
- **Server:** DigitalOcean 165.22.95.150
- **Webserver:** Nginx (HTTPS reverse proxy)
- **Backend:** Next.js (port 3000, managed by PM2)
- **Databáza:** PostgreSQL (Docker container, port 5433)
- **Process Manager:** PM2

## Produkčná architektúra

```
┌─────────────────────────────────────────────────────────┐
│           DigitalOcean Server (165.22.95.150)           │
│                                                         │
│  ┌─────────────┐       ┌──────────────────┐             │
│  │   Nginx     │       │   PM2 Process    │             │
│  │   (HTTPS)   │──────►│   Next.js App    │             │
│  │   Port 443  │       │   Port 3000      │             │
│  └─────────────┘       └─────────┬────────┘             │
│                                  │                      │
│                                  ▼                      │
│                        ┌──────────────────┐             │
│                        │  PostgreSQL      │             │
│                        │  (Docker)        │             │
│                        │  Port 5433       │             │
│                        └──────────────────┘             │
└─────────────────────────────────────────────────────────┘
         ▲
         │ SSH Tunnel (local dev)
         │
┌────────┴───────────────────────┐
│   Local Development            │
│   localhost:5601 → :5433       │
│   Next.js dev server :5600     │
└────────────────────────────────┘
```

## Deployment

### Development workflow
```bash
# Start local dev server
npm run dev

# Run tests
npm run test:backend
npm run test:e2e

# Database migrations
npx prisma migrate dev
npx prisma generate
```

### Production deployment
```bash
# Deploy to production (vk.retry.sk)
./scripts/deploy.sh

# Deploy with auto-confirm
./scripts/deploy.sh --yes
```

**Deployment script (`scripts/deploy.sh`) kroky:**
1. Kontrola git statusu
2. Lokálny production build (`npm run build`)
3. Vytvorenie zálohy na serveri
4. Rsync kódu na server (vrátane `.next/`)
5. Inštalácia dependencies (`npm ci --production`)
6. Spustenie migrations (`npx prisma migrate deploy`)
7. Reštart PM2 (`pm2 reload vk-retry`)
8. Health check
9. Smoke tests

## Environment Variables

### Development (.env.local):
```env
# Database (SSH tunnel to production)
DATABASE_URL="postgresql://vkretry:vkretry123@localhost:5601/vk_retry"

# Auth.js
AUTH_SECRET="your-secret-key-min-32-chars-long"
NEXTAUTH_URL="http://localhost:5600"

# Application
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:5600"
```

### Production (.env.production - server):
```env
# Database (local Docker container)
DATABASE_URL="postgresql://vkretry:vkretry123@localhost:5433/vk_retry"

# Auth.js
AUTH_SECRET="production-secret-generated-with-openssl"
NEXTAUTH_URL="https://vk.retry.sk"

# Application
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://vk.retry.sk"
```

## Sieťová architektúra

### Lokálny vývoj:
```
http://localhost:5600           → Next.js Dev Server
    ↓
localhost:5601                  → SSH Tunnel → server:5433 (PostgreSQL)
```

### Produkcia (vk.retry.sk):
```
https://vk.retry.sk             → Nginx (HTTPS, port 443)
    ↓
http://localhost:3000           → Next.js App (PM2)
    ↓
localhost:5433                  → PostgreSQL (Docker)
```

### SSH Tunnel setup (local → production DB):
```bash
# Script: scripts/db-tunnel.sh
ssh -i ~/.ssh/monitra_do -L 5601:localhost:5433 -N root@165.22.95.150
```

## Bezpečnostné vrstvy

### Development:
- HTTP (localhost)
- Auth.js session management
- Session cookies (httpOnly, secure)
- CORS: localhost only
- SSH tunnel pre DB prístup

### Production (vk.retry.sk):
- HTTPS (Let's Encrypt SSL)
- Nginx reverse proxy
- PM2 process management
- SSH key authentication (deploy user)
- Database isolated v Docker kontajneri
- Auth.js with production secrets

## Scaling stratégia (budúcnosť)

Pre prípad potreby škálovania:
```
Load Balancer
    ↓
┌───────────────────────────────┐
│  Next.js App 1  │  App 2  │...│
└───────────────────────────────┘
            ↓
    PostgreSQL Primary
            ↓
    PostgreSQL Replica(s)
```

## Backup stratégia

### PM2 zálohy pred deploymentom:
```bash
# Automaticky v deployment scripte
BACKUP_NAME="/var/www/vk-retry-backup-$(date +%Y%m%d-%H%M%S)"
cp -r /var/www/vk-retry "$BACKUP_NAME"

# Keep only last 5 backups
ls -dt vk-retry-backup-* | tail -n +6 | xargs -r rm -rf
```

### Database zálohy:
```bash
# Manual backup
docker exec vk-postgres pg_dump -U vkretry vk_retry > backup.sql

# TODO: Automatické cronjob zálohy
```

## Monitoring

### Production:
- **PM2 monitoring**: `pm2 status`, `pm2 logs vk-retry`
- **Process restart**: PM2 automatic restart on crash
- **Logs**: `/home/deploy/.pm2/logs/`
- **Health check**: Deployment script curl test

### Užitočné príkazy:
```bash
# SSH do servera
ssh -i ~/.ssh/monitra_do deploy@165.22.95.150

# PM2 status
pm2 status
pm2 logs vk-retry
pm2 restart vk-retry

# Nginx
sudo systemctl status nginx
sudo nginx -t
sudo systemctl reload nginx
```

## CI/CD

**Aktuálne:** Manuálny deployment cez `./scripts/deploy.sh`

**Budúcnosť:** GitHub Actions automation
