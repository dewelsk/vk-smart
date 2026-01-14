# BUGFIX: Produkcia redirectuje na localhost:5600

## Problém

Pri prístupe na produkčnú URL `https://vk.retry.sk` dochádza k redirectu na `http://localhost:5600/applicant/dashboard`.

## Root Cause

**Skutočná príčina:** Na produkčnom serveri existoval `.env.local` súbor s development konfiguráciou obsahujúcou `NEXTAUTH_URL="http://localhost:5600"`.

Next.js load order pre environment variables je:
1. `.env.local` (má najvyššiu prioritu, prepíše všetky ostatné)
2. `.env.production` (ak NODE_ENV=production)
3. `.env`

Aj keď `.env` mal správnu produkčnú konfiguráciu, `.env.local` ju prepísal development hodnotami.

**Sekundárny problém:** Auth.js v production mode vyžaduje explicitne nastavené `AUTH_TRUST_HOST=true`.

## Riešenie

### 1. SSH na produkčný server

```bash
ssh -i ~/.ssh/monitra_do root@165.22.95.150
cd /var/www/vk-retry
```

### 2. Odstránenie .env.local

`.env.local` by nemal existovať na production serveri. Presuň ho do zálohy:

```bash
mv .env.local .env.local.backup
```

### 3. Overenie .env konfigurácie

Uisti sa že `/var/www/vk-retry/.env` obsahuje:

```env
NEXT_PUBLIC_APP_URL="https://vk.retry.sk"
NEXTAUTH_URL="https://vk.retry.sk"
AUTH_SECRET="production-secret"
AUTH_TRUST_HOST=true  # DÔLEŽITÉ pre production!
NODE_ENV="production"
```

### 4. Clean rebuild aplikácie

```bash
rm -rf .next
npm run build
```

### 5. Reštart PM2 (pod deploy userom!)

**Dôležité:** PM2 proces beží pod userom `deploy`, nie `root`!

```bash
su - deploy -c "pm2 restart vk-retry --update-env"
```

### 6. Overenie

```bash
curl -I -L https://vk.retry.sk
# Mal by byť redirect na https://vk.retry.sk/admin/login (NIE localhost!)
```

## Prevencia

- ✅ **NIKDY** nedávať `.env.local` na production server (je to development súbor!)
- ✅ Deployment script by mal kontrolovať či `.env.local` neexistuje na serveri
- ✅ Pridať `AUTH_TRUST_HOST=true` do production `.env`
- ✅ Používať správneho usera pre PM2 (`deploy`, nie `root`)

## Dôležité poznámky

### Next.js Environment Variables Load Order

Next.js číta environment variables v tomto poradí (nižšie má vyššiu prioritu):
1. `.env` - základná konfigurácia
2. `.env.production` - production specific (ak NODE_ENV=production)
3. `.env.local` - **lokálne overrides, má najvyššiu prioritu!**

**Preto `.env.local` NIKDY nesmie byť na production serveri!**

### PM2 User

Production PM2 proces beží pod userom `deploy`, nie `root`. Vždy používaj:

```bash
su - deploy -c "pm2 <command>"
```

### NEXT_PUBLIC_* Variables

`NEXT_PUBLIC_*` premenné sú embedované do build outputu počas `npm run build`.
Po zmene týchto premenných MUSÍŠ:
1. Vymazať `.next` folder
2. Spustiť `npm run build`
3. Reštartovať PM2 s `--update-env`

## Vyriešené

✅ **2026-01-12 23:10 UTC** - Problém úspešne vyriešený
- Odstránený `.env.local` z production servera
- Pridaný `AUTH_TRUST_HOST=true`
- Clean rebuild aplikácie
- PM2 reštart pod deploy userom
- Produkcia funguje správne: https://vk.retry.sk
