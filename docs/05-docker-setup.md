# Docker Setup

## docker-compose.yml

```yaml
version: '3.8'

services:
  # PostgreSQL databáza
  postgres:
    image: postgres:16-alpine
    container_name: vk-postgres
    ports:
      - "5601:5432"
    environment:
      POSTGRES_DB: vk_system
      POSTGRES_USER: vkadmin
      POSTGRES_PASSWORD: ${DB_PASSWORD:-vkpass123}
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --locale=sk_SK.UTF-8"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - vk-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U vkadmin -d vk_system"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # Next.js aplikácia
  app:
    build:
      context: .
      dockerfile: ./docker/Dockerfile
      args:
        NODE_ENV: development
    container_name: vk-app
    ports:
      - "5600:3000"
    environment:
      # Database
      DATABASE_URL: postgresql://vkadmin:${DB_PASSWORD:-vkpass123}@postgres:5432/vk_system

      # NextAuth
      NEXTAUTH_URL: http://localhost:5600
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:-dev-secret-key-change-in-production-min-32-chars}

      # Application
      NODE_ENV: development
      UPLOAD_DIR: /app/public/uploads
      MAX_FILE_SIZE: 10485760

      # Email (simulované)
      EMAIL_FROM: vk-system@mirri.gov.sk
      EMAIL_SIMULATE: "true"

      # OTP (simulované)
      OTP_SIMULATE: "true"
      OTP_EXPIRY_MINUTES: 5
    volumes:
      # Hot reload pre vývoj
      - ./src:/app/src
      - ./public:/app/public
      - ./prisma:/app/prisma
      # Node modules ako named volume (lepší performance)
      - node_modules:/app/node_modules
    networks:
      - vk-network
    depends_on:
      postgres:
        condition: service_healthy
    command: npm run dev
    restart: unless-stopped

  # Adminer - DB admin rozhranie
  adminer:
    image: adminer:latest
    container_name: vk-adminer
    ports:
      - "5602:8080"
    environment:
      ADMINER_DEFAULT_SERVER: postgres
      ADMINER_DESIGN: nette
    networks:
      - vk-network
    depends_on:
      - postgres
    restart: unless-stopped

networks:
  vk-network:
    driver: bridge

volumes:
  postgres_data:
    driver: local
  node_modules:
    driver: local
```

## Dockerfile

```dockerfile
# docker/Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
# ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# Set permissions for uploads directory
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

## Dockerfile.dev (Development)

```dockerfile
# docker/Dockerfile.dev
FROM node:20-alpine

WORKDIR /app

# Install dependencies for Prisma
RUN apk add --no-cache libc6-compat openssl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy rest of the application
COPY . .

# Create uploads directory
RUN mkdir -p /app/public/uploads

EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
```

## docker-compose.prod.yml (Production override)

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: ./docker/Dockerfile
      args:
        NODE_ENV: production
    environment:
      NODE_ENV: production
      EMAIL_SIMULATE: "false"
      OTP_SIMULATE: "false"
      # Ostatné production env vars
    command: node server.js
    volumes:
      # V produkcii len uploads
      - ./public/uploads:/app/public/uploads

  postgres:
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}  # Musí byť silné heslo!
    volumes:
      - /var/lib/vk-system/postgres:/var/lib/postgresql/data

  # Nginx reverse proxy
  nginx:
    image: nginx:alpine
    container_name: vk-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./docker/nginx/ssl:/etc/nginx/ssl
    networks:
      - vk-network
    depends_on:
      - app
    restart: unless-stopped
```

## .dockerignore

```
# Dependencies
node_modules
npm-debug.log*

# Next.js
.next
out

# Environment files
.env*
!.env.example

# Development
.git
.gitignore
README.md

# IDE
.vscode
.idea

# OS
.DS_Store
Thumbs.db

# Prisma
prisma/migrations

# Uploads (will be mounted as volume)
public/uploads

# Tests
tests
coverage
```

## Spustenie projektu

### Development:
```bash
# Prvé spustenie
docker-compose up --build

# Normálne spustenie
docker-compose up

# Na pozadí
docker-compose up -d

# Zastavenie
docker-compose down

# Zastavenie + vymazanie volumes
docker-compose down -v
```

### Production:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Užitočné príkazy

### Pripojenie do kontajnera:
```bash
# App kontajner
docker exec -it vk-app sh

# PostgreSQL
docker exec -it vk-postgres psql -U vkadmin -d vk_system
```

### Logs:
```bash
# Všetky služby
docker-compose logs -f

# Len aplikácia
docker-compose logs -f app

# Posledných 100 riadkov
docker-compose logs --tail=100 app
```

### Databázové operácie:
```bash
# Migrácie
docker-compose exec app npx prisma migrate dev

# Prisma Studio
docker-compose exec app npx prisma studio

# Seed
docker-compose exec app npx prisma db seed

# Reset DB (DEV ONLY!)
docker-compose exec app npx prisma migrate reset
```

### Restart služieb:
```bash
# Všetky
docker-compose restart

# Len aplikácia
docker-compose restart app
```

### Clean up:
```bash
# Zastavenie a vymazanie všetkého
docker-compose down -v --rmi all

# Vymazanie unused images
docker system prune -a
```

## Environment Variables

### .env.example
```env
# Database
DB_PASSWORD=strong-password-here

# NextAuth
NEXTAUTH_URL=http://localhost:5600
NEXTAUTH_SECRET=your-secret-key-min-32-chars-long

# Application
NODE_ENV=development
UPLOAD_DIR=/app/public/uploads
MAX_FILE_SIZE=10485760

# Email
EMAIL_FROM=vk-system@mirri.gov.sk
EMAIL_SIMULATE=true

# OTP
OTP_SIMULATE=true
OTP_EXPIRY_MINUTES=5

# Optional
LOG_LEVEL=info
```

### Vytvorenie .env:
```bash
cp .env.example .env
# Potom editovať hodnoty
```

## Health Checks

### PostgreSQL health check:
```bash
curl http://localhost:5602  # Adminer UI
```

### App health check:
```bash
curl http://localhost:5600/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "database": "connected",
  "uptime": 12345
}
```

## Troubleshooting

### Port už používaný:
```bash
# Zistiť, čo používa port
lsof -i :5600
lsof -i :5601

# Zabiť proces
kill -9 <PID>
```

### Prisma chyby:
```bash
# Regenerovať Prisma Client
docker-compose exec app npx prisma generate

# Vymazať .next cache
docker-compose exec app rm -rf .next
```

### Permission issues (uploads):
```bash
# Nastaviť správne permissions
docker-compose exec app chown -R nextjs:nodejs /app/public/uploads
```

### Hot reload nefunguje:
1. Reštartovať app service
2. Skontrolovať volumes mapping
3. Skúsiť `docker-compose down && docker-compose up`

## Monitoring (Production)

### Docker stats:
```bash
docker stats vk-app vk-postgres
```

### Logs rotation:
```yaml
# V docker-compose.yml pridať:
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## Backup & Restore

### Backup databázy:
```bash
docker-compose exec postgres pg_dump -U vkadmin vk_system > backup.sql

# Alebo priamo do archívu
docker-compose exec postgres pg_dump -U vkadmin vk_system | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restore databázy:
```bash
cat backup.sql | docker-compose exec -T postgres psql -U vkadmin -d vk_system

# Z archívu
gunzip -c backup_20250101.sql.gz | docker-compose exec -T postgres psql -U vkadmin -d vk_system
```

### Backup uploads:
```bash
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz public/uploads/
```
