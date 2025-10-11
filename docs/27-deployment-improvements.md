# Deployment Improvements - Návrh zlepšení

**Dátum:** 2025-10-10
**Status:** TODO - Implementovať neskôr

---

## Problém

Aktuálny deployment proces má tieto problémy:

1. **Build na serveri zlyháva** - Next.js production build má bug/nekompatibilitu
2. **Chýbajúci súbor** - `prerender-manifest.json` sa nevytvára
3. **Dlhé riešenie problémov** - Po každom deploymente 10-20 minút debuggovanie
4. **Rsync --delete** - Vymaže `.next/` adresár a potom build zlyháva
5. **Žiadne smoke testy** - Deployment script nespúšťa automatické testy

### Príklad chyby

```
Error: ENOENT: no such file or directory, open '/var/www/vk-retry/.next/prerender-manifest.json'
```

Aplikácia crashne pri štarte kvôli chýbajúcemu súboru.

---

## Riešenie: Lokálny build + Rsync

### Variant A: Build lokálne, sync hotový build (ODPORÚČANÉ)

**Prečo je to najlepšie:**
- ✅ Build beží lokálne (rýchlejší, overený, stabilný)
- ✅ Na server chodí hotový `.next/` adresár
- ✅ Žiadne build problémy na production
- ✅ 30-60 sekúnd celý deployment
- ✅ Konzistentné prostredie (lokálny build = production build)

**Implementácia:**

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

# Configuration
SERVER="deploy@165.22.95.150"
APP_DIR="/var/www/vk-retry"
SSH_KEY="~/.ssh/monitra_do"

echo "========================================="
echo "  Production Deployment - vk.retry.sk"
echo "========================================="
echo ""

# Step 1: Check git status
if [[ -n $(git status -s) ]]; then
    echo "⚠️  You have uncommitted changes!"
    git status -s
    exit 1
fi

CURRENT_BRANCH=$(git branch --show-current)
CURRENT_COMMIT=$(git rev-parse --short HEAD)
echo "✅ Git: $CURRENT_BRANCH @ $CURRENT_COMMIT"
echo ""

# Step 2: Build locally
echo "🔨 Building application locally..."
NODE_ENV=production npm run build

if [ ! -f ".next/BUILD_ID" ]; then
    echo "❌ Build failed - .next/BUILD_ID not found"
    exit 1
fi

echo "✅ Build successful"
echo ""

# Step 3: Create backup on server
echo "💾 Creating backup on server..."
ssh -i "$SSH_KEY" "$SERVER" << 'ENDSSH'
if [ -d "/var/www/vk-retry/.next" ]; then
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
echo "✅ Backup created"
echo ""

# Step 4: Rsync code to server (including .next/)
echo "📦 Syncing code to server..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'test-results' \
    --exclude 'playwright-report' \
    --exclude '.env*' \
    --exclude 'docs/daily' \
    --exclude '*.log' \
    -e "ssh -i $SSH_KEY" \
    ./ "$SERVER:$APP_DIR/"

echo "✅ Code synced (including .next/)"
echo ""

# Step 5: Install dependencies and restart on server
echo "📦 Installing production dependencies..."
ssh -i "$SSH_KEY" "$SERVER" << 'ENDSSH'
set -e
cd /var/www/vk-retry

# Load environment variables
set -a
source .env.production
set +a

echo "📦 Installing dependencies..."
npm ci --production

echo "🔨 Generating Prisma client..."
npx prisma generate

echo "🗃️  Running database migrations..."
npx prisma migrate deploy

echo "🔄 Reloading PM2..."
pm2 reload vk-retry --update-env

echo "💾 Saving PM2 configuration..."
pm2 save

echo ""
echo "✅ Deployment complete!"
ENDSSH

echo "✅ Application restarted"
echo ""

# Step 6: Health check
echo "⏳ Waiting 5 seconds for application to start..."
sleep 5

echo "🏥 Running health check..."
if curl -f -s -o /dev/null -w "%{http_code}" https://vk.retry.sk | grep -q "200\|302\|307"; then
    echo "✅ Health check passed! ✨"
else
    echo "❌ Health check FAILED!"
    echo "⚠️  Check logs: ssh -i $SSH_KEY $SERVER 'pm2 logs vk-retry'"
    exit 1
fi

echo ""

# Step 7: Run production smoke tests
echo "🧪 Running production smoke tests..."
npm run test:e2e:smoke

if [ $? -eq 0 ]; then
    echo "✅ All smoke tests passed!"
else
    echo "⚠️  Some smoke tests failed"
    echo "ℹ️  Check test results in test-results/"
fi

echo ""

# Step 8: Summary
echo "========================================="
echo "  Deployment Summary"
echo "========================================="
echo "Branch:  $CURRENT_BRANCH"
echo "Commit:  $CURRENT_COMMIT"
echo "Server:  $SERVER"
echo "URL:     https://vk.retry.sk"
echo ""
echo "✅ Deployment completed successfully! 🚀"
echo ""
echo "Useful commands:"
echo "  - View logs:    ssh -i $SSH_KEY $SERVER 'pm2 logs vk-retry'"
echo "  - View status:  ssh -i $SSH_KEY $SERVER 'pm2 status'"
echo "  - Restart:      ssh -i $SSH_KEY $SERVER 'pm2 restart vk-retry'"
echo ""
```

**Čo sa zmenilo:**

1. **Pridané:** Lokálny build pred rsync (`npm run build`)
2. **Pridané:** Validácia buildu (`.next/BUILD_ID` musí existovať)
3. **Odstránené:** `--exclude '.next'` z rsync - teraz syncujeme `.next/`
4. **Odstránené:** `npm run build` na serveri - len `npm ci` a `prisma`
5. **Pridané:** Smoke testy po deploymenti
6. **Zrýchlené:** Server len restart (nie rebuild)

---

## Alternatívne riešenia

### Variant B: Atomic Deployment (Najbezpečnejšie)

```bash
# Vytvor nový build directory
ssh server 'mkdir -p /var/www/vk-retry-new'

# Rsync do nového adresára
rsync code → /var/www/vk-retry-new

# Build v novom adresári
ssh server 'cd /var/www/vk-retry-new && npm ci && npm run build'

# Atómová výmena (symlink)
ssh server 'ln -sfn /var/www/vk-retry-new /var/www/vk-retry-current'

# PM2 reload
ssh server 'pm2 reload vk-retry'
```

**Výhody:**
- ✅ Zero-downtime (stará verzia beží počas buildu)
- ✅ Rollback jedným príkazom (`ln -sfn vk-retry-old vk-retry-current`)
- ✅ Build chyby neovplyvnia running app

**Nevýhody:**
- ⚠️ Zložitejšia implementácia
- ⚠️ Potrebuje viac diskového priestoru
- ⚠️ Symlink v PM2 config

---

### Variant C: Fix Current Approach (Najmenšia zmena)

Pridať do deployment scriptu fallback:

```bash
# Po build, pred PM2 reload
ssh server << 'ENDSSH'
if [ ! -f /var/www/vk-retry/.next/prerender-manifest.json ]; then
    echo "⚠️  prerender-manifest.json missing, creating empty..."
    echo '{"version":4,"routes":{},"dynamicRoutes":{},"notFoundRoutes":[],"preview":{}}' > \
        /var/www/vk-retry/.next/prerender-manifest.json
fi
ENDSSH
```

**Výhody:**
- ✅ Minimálna zmena existujúceho scriptu
- ✅ Rieši immediate problém

**Nevýhody:**
- ❌ Build na serveri stále pomalý (3-5 minút)
- ❌ Stále môžu byť iné build problémy
- ❌ Workaround, nie riešenie root cause

---

## Odporúčaný flow

```mermaid
graph LR
    A[Lokálne: git commit] --> B[Lokálne: npm run build]
    B --> C[Lokálne: ./scripts/deploy.sh]
    C --> D[Rsync code + .next/]
    D --> E[Server: npm ci --production]
    E --> F[Server: prisma generate + migrate]
    F --> G[Server: pm2 reload]
    G --> H[Health check]
    H --> I[Smoke tests]
    I --> J[✅ Done]
```

**Celkový čas:** 30-90 sekúnd (vs. aktuálne 5-10 minút)

---

## Implementačné kroky

1. [ ] Backup aktuálneho `scripts/deploy.sh`
2. [ ] Implementovať nový deployment script (Variant A)
3. [ ] Testovať na staging/test server
4. [ ] Otestovať rollback procedúru
5. [ ] Dokumentovať v `docs/23-deployment.md`
6. [ ] Updatovať smoke testy (fixnúť test IDs)

---

## Smoke Tests - Potrebné opravy

Aktuálne 2 testy zlyhávajú kvôli nesprávnym `data-testid` atribútom:

### Dashboard test

```typescript
// CHYBA: Hľadá stat-users ale v production je iný testid
await expect(page.getByTestId('stat-users')).toBeVisible()

// FIX: Skontrolovať production dashboard a použiť správne testid
// Alebo: Pridať data-testid="stat-users" do dashboard komponentu
```

### Tests list test

```typescript
// CHYBA: Hľadá tests-page ale v production chýba
await expect(page.getByTestId('tests-page')).toBeVisible()

// FIX: Pridať data-testid="tests-page" do tests/page.tsx
```

---

## Poznámky

- **Dátum zistenia problému:** 2025-10-10
- **Posledný deployment:** e539cb5 (Multi-role + Security settings)
- **Production status:** ✅ Funguje po manuálnom fixe
- **Smoke tests:** 4/6 passed (66%)

---

## Súvisiace súbory

- `scripts/deploy.sh` - Aktuálny deployment script
- `docs/23-deployment.md` - Deployment dokumentácia
- `tests/e2e/smoke/production.spec.ts` - Production smoke testy
- `.deployment/ecosystem.config.js` - PM2 config (nie na serveri!)
