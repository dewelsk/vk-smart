# Technická architektúra - Systém digitalizácie výberových konaní

## Prehľad architektúry

Systém beží v Docker kontajneroch s port mappingom v rozsahu 56xx:
- **5600**: Next.js aplikácia (frontend + backend API)
- **5601**: PostgreSQL databáza
- **5602**: Adminer (DB admin rozhranie)

## Docker Compose štruktúra

```
┌─────────────────────────────────────────────┐
│         Docker Network: vk-network          │
│                                             │
│  ┌──────────────┐  ┌──────────────┐         │
│  │  Next.js App │  │  PostgreSQL  │         │
│  │   (Port:     │◄─┤   (Port:     │         │
│  │    5600)     │  │    5601)     │         │
│  └──────┬───────┘  └──────────────┘         │
│         │                                   │
│         │          ┌──────────────┐         │
│         └─────────►│   Adminer    │         │
│                    │   (Port:     │         │
│                    │    5602)     │         │
│                    └──────────────┘         │
│                                             │
└─────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
   Host: localhost:5600  Host: localhost:5602
```

## Volume mapping

### Aplikačné volumes:
- `./src:/app/src` - Hot reload pre vývoj
- `./public/uploads:/app/public/uploads` - Lokálne úložisko súborov
- `postgres_data:/var/lib/postgresql/data` - Perzistentné DB dáta

### Štruktúra úložiska súborov:
```
public/uploads/
├── cv/
│   ├── vk-2025-1234/
│   │   ├── candidate-001/
│   │   │   ├── cv.pdf
│   │   │   ├── motivacny-list.pdf
│   │   │   └── certifikaty/
│   │   └── candidate-002/
├── tests/
│   └── vk-2025-1234/
│       ├── candidate-001-test-results.json
│       └── candidate-002-test-results.json
└── generated-docs/
    └── vk-2025-1234/
        ├── sumarny-hodnotiaci-harok-001.pdf
        ├── zaverecne-hodnotenie.pdf
        └── zapisnica.pdf
```

## Environment Variables

### Development (.env.local):
```env
# Database
DATABASE_URL="postgresql://vkadmin:vkpass123@localhost:5601/vk_system"

# NextAuth
NEXTAUTH_URL="http://localhost:5600"
NEXTAUTH_SECRET="your-secret-key-min-32-chars-long-12345"

# Application
NODE_ENV="development"
UPLOAD_DIR="/app/public/uploads"
MAX_FILE_SIZE=10485760  # 10MB

# Email (simulované v dev)
EMAIL_FROM="vk-system@mirri.gov.sk"
EMAIL_SIMULATE=true

# OTP (simulované v dev)
OTP_SIMULATE=true
OTP_EXPIRY_MINUTES=5
```

### Production (.env.production):
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://vk.mirri.gov.sk"
NEXTAUTH_SECRET="strong-production-secret"
NODE_ENV="production"
EMAIL_SIMULATE=false
OTP_SIMULATE=false
# ... ďalšie produkčné nastavenia
```

## Sieťová architektúra

### Lokálny vývoj:
```
http://localhost:5600           → Next.js App
http://localhost:5601           → PostgreSQL (TCP)
http://localhost:5602           → Adminer Web UI
```

### Produkcia (neskôr):
```
https://vk.mirri.gov.sk         → Nginx Reverse Proxy
    ↓
http://app:3000                 → Next.js App (internal)
    ↓
postgresql://db:5432            → PostgreSQL (internal)
```

## Bezpečnostné vrstvy

### Development:
- HTTP (localhost)
- Základná autentifikácia
- Session cookies (httpOnly)
- CORS: localhost only

### Production:
- HTTPS (Let's Encrypt SSL)
- Nginx reverse proxy
- Rate limiting
- Firewall rules
- CORS: production domain only
- Security headers (Helmet.js)

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

### Automatické zálohy DB:
```bash
# Denne o 02:00
0 2 * * * docker exec vk-postgres pg_dump -U vkadmin vk_system > /backups/vk_$(date +\%Y\%m\%d).sql
```

### Záloha súborov:
```bash
# Denne o 03:00
0 3 * * * tar -czf /backups/uploads_$(date +\%Y\%m\%d).tar.gz /app/public/uploads
```

## Monitoring (produkcia)

- **Health checks**: `/api/health` endpoint
- **Logs**: Docker logs + winston logger
- **Metrics**: Next.js built-in analytics
- **Uptime monitoring**: External service (napr. UptimeRobot)

## CI/CD Pipeline (neskôr)

```
Git Push → GitHub Actions
    ↓
  Build Docker Image
    ↓
  Run Tests
    ↓
  Deploy to Staging
    ↓
  Manual Approval
    ↓
  Deploy to Production
```
