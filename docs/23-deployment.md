# Production Deployment - vk.retry.sk

Tento dokument popisuje deployment aplikácie na produkčný server.

---

## Prehľad

- **Doména:** https://vk.retry.sk
- **Server IP:** 165.22.95.150
- **Provider:** Digital Ocean (Frankfurt, fra1)
- **Specs:** 8GB RAM, 2 CPU (s-2vcpu-8gb-amd)
- **OS:** Ubuntu 22.04
- **Stack:** Next.js 14 + PostgreSQL + PM2 + Nginx

---

## Architektúra

```
Internet
   ↓
[Nginx :80/:443]  ← SSL (Let's Encrypt)
   ↓
[PM2 Cluster]
   ├─ Instance 1 :3000
   └─ Instance 2 :3001
   ↓
[PostgreSQL :5432]
```

**Výhody:**
- ✅ Zero-downtime deployment (PM2 graceful reload)
- ✅ Auto-restart pri crash
- ✅ Clustering (2 instances = lepší performance)
- ✅ SSL encryption
- ✅ Session persistence (používatelia nie sú odhlásení)

---

## Prvotný Server Setup

**Toto sa robí IBA RAZ pri prvom nasadení.**

### 1. Pripojenie na server

```bash
ssh -i ~/.ssh/monitra_do root@165.22.95.150
```

### 2. Systémové dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js, PostgreSQL, Nginx
apt install -y curl git postgresql postgresql-contrib nginx certbot python3-certbot-nginx

# Install Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify versions
node --version  # v20.x.x
npm --version   # 10.x.x
psql --version  # PostgreSQL 14+
```

### 3. Install PM2 globally

```bash
npm install -g pm2
```

### 4. Vytvorenie deploy usera (bezpečnosť)

```bash
# Vytvoriť usera pre deployment (nie root)
adduser deploy
usermod -aG sudo deploy

# Nastaviť SSH prístup pre deploy usera
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

### 5. PostgreSQL Database Setup

```bash
# Prepnúť na postgres usera
sudo -u postgres psql

# V PostgreSQL konzole
CREATE DATABASE vk_production;
CREATE USER vk_user WITH PASSWORD 'STRONG_RANDOM_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE vk_production TO vk_user;

# V PostgreSQL 15+ je potrebné grant na schema
\c vk_production
GRANT ALL ON SCHEMA public TO vk_user;

\q
```

**Connection string:**
```
postgresql://vk_user:PASSWORD@localhost:5432/vk_production
```

### 6. Vytvorenie application directory

```bash
# Prepnúť na deploy usera
su - deploy

# Vytvoriť app directory
mkdir -p /var/www/vk-retry
cd /var/www/vk-retry
```

---

## Environment Variables

Vytvoriť súbor `.env.production` na serveri:

```bash
# /var/www/vk-retry/.env.production
NODE_ENV=production

# Database
DATABASE_URL="postgresql://vk_user:PASSWORD@localhost:5432/vk_production"

# NextAuth.js
NEXTAUTH_URL="https://vk.retry.sk"
NEXTAUTH_SECRET="GENERATE_WITH_openssl_rand_base64_32"

# App Port (PM2 cluster)
PORT=3000
```

**Generovanie NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

**DÔLEŽITÉ:** Tento súbor NIE JE v git! Vytvorí sa manuálne na serveri.

---

## Nginx Konfigurácia

### Vytvorenie site config

```bash
sudo nano /etc/nginx/sites-available/vk.retry.sk
```

**Obsah:** (pozri `.deployment/nginx.conf`)

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name vk.retry.sk;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Cache bypass
        proxy_cache_bypass $http_upgrade;
    }

    # Static files (Next.js _next/)
    location /_next/static {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

### Enable site

```bash
sudo ln -s /etc/nginx/sites-available/vk.retry.sk /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## SSL Certificate (Let's Encrypt)

### Inštalácia certifikátu

```bash
sudo certbot --nginx -d vk.retry.sk
```

**Certbot automaticky:**
- Získa SSL certifikát
- Upraví Nginx config (pridá HTTPS server block)
- Nastaví HTTP → HTTPS redirect

### Auto-renewal test

```bash
sudo certbot renew --dry-run
```

Certbot automaticky obnovuje certifikáty každé 3 mesiace cez systemd timer.

---

## PM2 Setup

### Konfigurácia (ecosystem.config.js)

Pozri `.deployment/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'vk-retry',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/vk-retry',

    // Cluster mode (2 instances)
    instances: 2,
    exec_mode: 'cluster',

    // Environment
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },

    // Auto-restart
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',

    // Logs
    error_file: '/var/log/pm2/vk-retry-error.log',
    out_file: '/var/log/pm2/vk-retry-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
}
```

### Spustenie PM2

```bash
cd /var/www/vk-retry

# Spustiť aplikáciu
pm2 start ecosystem.config.js

# Uložiť PM2 config (zachová po reboot)
pm2 save

# Auto-start PM2 pri reboot
pm2 startup
# Spusti vygenerovaný command ako sudo
```

### PM2 Commands

```bash
# Status
pm2 status
pm2 list

# Logs
pm2 logs vk-retry
pm2 logs vk-retry --lines 100
pm2 logs vk-retry --err  # Len errory

# Monitoring
pm2 monit

# Restart
pm2 reload vk-retry        # Graceful reload (zero-downtime)
pm2 restart vk-retry       # Hard restart

# Stop/Delete
pm2 stop vk-retry
pm2 delete vk-retry
```

---

## Deployment Workflow

### Optimalizovaný deployment (AKTUÁLNE)

**Z lokálneho počítača:**

```bash
./scripts/deploy.sh
```

Script automaticky:
1. ✅ Check git status (musí byť clean)
2. ✅ **Build lokálne** (`npm run build`)
3. ✅ Validate build (`.next/BUILD_ID` musí existovať)
4. ✅ Create backup on server
5. ✅ **Rsync kódu NA server (VRÁTANE `.next/`)**
6. ✅ SSH na server
7. ✅ `npm ci --production` (bez dev dependencies)
8. ✅ `npx prisma generate`
9. ✅ `npx prisma migrate deploy`
10. ✅ `pm2 reload` (graceful, zero-downtime)
11. ✅ Health check
12. ✅ **Run smoke tests** (`npm run test:e2e:smoke`)

**Deployment trvá ~30-90 sekúnd.**

### Výhody nového prístupu

- ✅ **Build lokálne** - rýchlejší, konzistentný, overený
- ✅ **Sync hotového buildu** - žiadne build problémy na serveri
- ✅ **Production dependencies only** - menší footprint, rýchlejšia inštalácia
- ✅ **Smoke tests** - overenie že deployment funguje
- ✅ **Automatický backup** - posledných 5 verzií
- ⚡ **3-6x rýchlejší** deployment (vs. build na serveri)

### Čo sa NESKOPÍRUJE (rsync excludes)

- `node_modules/` (re-install na serveri)
- ~~`.next/`~~ ← **ZMENA: Teraz SA syncuje!**
- `.git/`
- `test-results/`
- `playwright-report/`
- `.env*` (env vars sú na serveri)
- `docs/daily/`
- `*.log`

---

## Database Migrations

### Production migrations workflow

**VŽDY pred deploymentom:**

```bash
# Lokálne: vytvor migráciu
npx prisma migrate dev --name add_new_feature

# Commit migration files do git
git add prisma/migrations/
git commit -m "feat: add new feature migration"
```

**Deployment script automaticky:**
```bash
npx prisma migrate deploy
```

### Rollback migrácie

**V prípade problému:**

```bash
# SSH na server
ssh -i ~/.ssh/monitra_do deploy@165.22.95.150

cd /var/www/vk-retry

# Pozrieť migration history
npx prisma migrate status

# NEVIEME ROLLBACK PRISMA MIGRATIONS AUTOMATICKY!
# Musíš manuálne:
# 1. Vytvoriť novú migráciu ktorá reveruje zmeny
# 2. Alebo restore DB backup
```

**Preto:** VŽDY testuj migrácie na staging DB pred production!

---

## Monitoring a Logs

### PM2 Logs

```bash
# Real-time logs
pm2 logs vk-retry

# Last 100 lines
pm2 logs vk-retry --lines 100

# Len errors
pm2 logs vk-retry --err

# Monitorovanie CPU/Memory
pm2 monit
```

### Nginx Logs

```bash
# Access log
sudo tail -f /var/log/nginx/access.log

# Error log
sudo tail -f /var/log/nginx/error.log

# Grep errors
sudo grep "error" /var/log/nginx/error.log
```

### Database Logs

```bash
# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

---

## Backup Stratégia

### Database Backup

**Manuálny backup:**

```bash
# Vytvoriť backup
pg_dump -U vk_user vk_production > backup-$(date +%Y%m%d-%H%M%S).sql

# Restore z backupu
psql -U vk_user vk_production < backup-20250108-120000.sql
```

**Automatický daily backup (cron):**

```bash
# Pridať do crontab deploy usera
crontab -e

# Pridať riadok:
0 2 * * * pg_dump -U vk_user vk_production > /home/deploy/backups/vk-$(date +\%Y\%m\%d).sql
```

### Application Backup

Pri deployme sa automaticky zachová predošlá verzia:

```bash
# V deploy scripte
cp -r /var/www/vk-retry /var/www/vk-retry-backup-$(date +%Y%m%d-%H%M%S)
```

---

## Rollback Procedúra

### Rollback aplikácie

**Metóda 1: Git rollback + redeploy**

```bash
# Lokálne
git revert HEAD
git push

# Spustiť deploy script
./scripts/deploy.sh
```

**Metóda 2: Restore z backupu**

```bash
# SSH na server
cd /var/www

# Zastaviť aplikáciu
pm2 stop vk-retry

# Restore z backupu
rm -rf vk-retry
mv vk-retry-backup-20250108-120000 vk-retry

# Reštartovať
pm2 restart vk-retry
```

### Rollback databázy

```bash
# Zastaviť aplikáciu
pm2 stop vk-retry

# Drop current DB
sudo -u postgres psql
DROP DATABASE vk_production;
CREATE DATABASE vk_production;
GRANT ALL PRIVILEGES ON DATABASE vk_production TO vk_user;
\q

# Restore backup
psql -U vk_user vk_production < /home/deploy/backups/vk-20250108.sql

# Reštartovať aplikáciu
pm2 restart vk-retry
```

---

## Bezpečnosť

### Firewall (ufw)

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

### Fail2ban (SSH protection)

```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Regular Updates

```bash
# Security updates (weekly)
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y

# PM2 update
pm2 update
```

---

## Troubleshooting

### Aplikácia nefunguje

```bash
# 1. Check PM2 status
pm2 status
pm2 logs vk-retry --err

# 2. Check Nginx
sudo nginx -t
sudo systemctl status nginx

# 3. Check database
psql -U vk_user -d vk_production -c "SELECT 1;"

# 4. Check environment
cat /var/www/vk-retry/.env.production
```

### 502 Bad Gateway

**Príčiny:**
- PM2 process nie je spustený → `pm2 restart vk-retry`
- Wrong PORT in Nginx config → check `/etc/nginx/sites-available/vk.retry.sk`
- Firewall blokuje port 3000 → nie je potrebné (internal)

### Database connection failed

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -U vk_user -h localhost -d vk_production

# Check DATABASE_URL v .env.production
```

### Out of memory

```bash
# Check memory
free -h
pm2 monit

# Reštartovať PM2
pm2 restart vk-retry
```

---

## Performance Optimizations

### Next.js Build Optimizations

V `next.config.js`:

```javascript
module.exports = {
  output: 'standalone',  // Menší bundle
  compress: true,        // Gzip compression
  swcMinify: true,       // Faster minification
}
```

### Nginx Caching

Už nakonfigurované v `.deployment/nginx.conf`:
- Static files: `max-age=31536000` (1 rok)
- `_next/static/`: immutable cache

### PM2 Clustering

Už nakonfigurované: `instances: 2`

---

## Maintenance Window

Pri zásadných zmenách (napr. veľké DB migrácie):

```bash
# 1. Nastaviť maintenance page v Nginx
sudo nano /etc/nginx/sites-available/vk.retry.sk
# Pridať return 503

# 2. Reload Nginx
sudo nginx -t && sudo systemctl reload nginx

# 3. Vykonať maintenance

# 4. Odstrániť maintenance mode a reload Nginx
```

---

## Kontakty a Dokumentácia

- **Server SSH:** `ssh -i ~/.ssh/monitra_do deploy@165.22.95.150`
- **PM2 Web Dashboard:** `pm2 web` (localhost:9615)
- **Certbot Docs:** https://certbot.eff.org/
- **PM2 Docs:** https://pm2.keymetrics.io/

---

## Deployment History & Improvements

### Pôvodný prístup (deprecated)

**Problémy:**
- ❌ Build na serveri zlyháva (`prerender-manifest.json` missing)
- ❌ Dlhý deployment (3-5 minút)
- ❌ `rsync --delete` vymaže `.next/` pred buildom
- ❌ Žiadne smoke testy po deploymenti
- ❌ Build errors len na production (nie lokálne)

**Čo sa robilo:**
1. Rsync kódu (bez `.next/`)
2. Build NA SERVERI (`npm run build`)
3. PM2 reload
4. Modlitba že to funguje 🙏

### Nový prístup (2025-10-10)

**Riešenie:**
- ✅ Build LOKÁLNE (overený, konzistentný)
- ✅ Sync hotového `.next/` directory
- ✅ Server len restart (nie rebuild)
- ✅ Smoke testy po deploymenti
- ✅ Automatický backup pred deploymentom

**Dokumentácia:** `docs/27-deployment-improvements.md`

---

## Changelog

| Dátum | Verzia | Zmeny |
|-------|--------|-------|
| 2025-10-10 | 2.0.0 | Deployment improvements: local build + smoke tests |
| 2025-10-08 | 1.0.0 | Initial production setup |
