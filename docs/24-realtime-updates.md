# Real-time Updates - Návrh riešenia

Real-time synchronizácia dát medzi používateľmi bez potreby manuálneho refreshu stránky.

---

## Problém

**Súčasný stav:**
- Keď admin A upraví názov testu, admin B vidí zmenu až po refreshi stránky (F5)
- React Query cache sa neaktualizuje automaticky
- Žiadna real-time synchronizácia medzi klientmi

**Požiadavka:**
- Automatická aktualizácia dát na stránke keď iný používateľ vykoná zmenu
- Bez potreby manuálneho refreshu

---

## Možné riešenia

### 1. **Polling (Auto-refresh)** ⭐ Odporúčané pre MVP

**Princíp:**
Periodické dotazovanie sa servera na nové dáta (napr. každých 30-60 sekúnd).

**Implementácia:**

```typescript
// hooks/useTests.ts
const { data, isLoading } = useTests(
  {
    search,
    type: typeFilter?.value,
    categoryId: categoryFilter?.value,
    approved: approvedFilter?.value,
  },
  {
    // Auto-refresh každých 60 sekúnd
    refetchInterval: 60000,

    // Len keď je tab aktívny (šetrí resources)
    refetchIntervalInBackground: false,

    // Refetch pri focus na tab
    refetchOnWindowFocus: true,
  }
)
```

**Výhody:**
- ✅ Najjednoduchšia implementácia (1-2 hodiny)
- ✅ Funguje s existujúcou architektúrou (React Query)
- ✅ Žiadne nové dependencies
- ✅ Funguje cez HTTP (nie je potrebný WebSocket server)

**Nevýhody:**
- ❌ Nie je to skutočný real-time (delay 30-60s)
- ❌ Zbytočné API calls ak sa nič nezmenilo
- ❌ Vyššia záťaž na server pri veľa používateľoch

**Náročnosť:**
- Implementácia: **0.5h**
- Testovanie: **0.5h**
- Deployment: **0h** (žiadne zmeny v infraštruktúre)
- **Celkom: 1 hodina**

**Kedy použiť:**
- Pre MVP / testing fázu
- Keď nie je kritické mať okamžité updates
- Keď je počet používateľov nízky (<50 súčasne)

---

### 2. **Server-Sent Events (SSE)**

**Princíp:**
Server posiela updates klientom cez HTTP stream (jednosmerná komunikácia: server → client).

**Implementácia:**

```typescript
// app/api/tests/stream/route.ts
export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      // Simulácia: Pošli event pri zmene
      const interval = setInterval(() => {
        const data = { type: 'test-updated', testId: '123' }
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
      }, 1000)

      // Cleanup
      return () => clearInterval(interval)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}

// Frontend
useEffect(() => {
  const eventSource = new EventSource('/api/tests/stream')

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data)

    if (data.type === 'test-updated') {
      // Invalidate React Query cache
      queryClient.invalidateQueries(['tests'])
    }
  }

  return () => eventSource.close()
}, [])
```

**Výhody:**
- ✅ Real-time updates (okamžité)
- ✅ Jednoduchšie ako WebSockets
- ✅ Funguje cez HTTP (nie je potrebný samostatný WebSocket server)
- ✅ Podpora v moderných browseroch

**Nevýhody:**
- ❌ Jednosmerná komunikácia (len server → client)
- ❌ Potrebné držať connection otvorené (vyššia záťaž na server)
- ❌ Ťažšie škálovanie pri veľkom počte klientov

**Náročnosť:**
- Implementácia: **3h** (API stream + frontend integration)
- Testovanie: **2h**
- Deployment: **1h** (nginx konfigurácia pre long-lived connections)
- **Celkom: 6 hodín**

**Kedy použiť:**
- Keď potrebujete real-time, ale len jednosmerné updates
- Keď nechcete komplexnosť WebSocketov
- Pre notifikácie, live dashboardy, atď.

---

### 3. **WebSockets (Socket.io)** ⭐⭐ Najlepšie pre produkciu

**Princíp:**
Obojsmerná real-time komunikácia medzi serverom a klientom.

**Implementácia:**

```typescript
// server.js (samostatný WebSocket server)
import { Server } from 'socket.io'
import { createServer } from 'http'

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: 'https://vk.retry.sk',
    credentials: true
  }
})

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  // Join room pre testy
  socket.join('tests')

  // Emit pri zmene
  socket.on('test:update', async (data) => {
    // Validate & save to DB
    await updateTest(data)

    // Broadcast všetkým v room
    io.to('tests').emit('test:updated', data)
  })
})

httpServer.listen(3001)

// Frontend
import { io } from 'socket.io-client'

const socket = io('https://vk.retry.sk:3001')

socket.on('connect', () => {
  console.log('Connected to WebSocket')
})

socket.on('test:updated', (test) => {
  // Update React Query cache immediately
  queryClient.setQueryData(['tests'], (old) => {
    return old.map(t => t.id === test.id ? test : t)
  })
})
```

**PM2 config:**

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'vk-retry',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork'
    },
    {
      name: 'vk-websocket',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
```

**Nginx config:**

```nginx
# WebSocket proxy
location /socket.io/ {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

**Výhody:**
- ✅ Skutočný real-time (okamžité updates)
- ✅ Obojsmerná komunikácia
- ✅ Efektívne (len zmeny sa posielajú, nie celé datasety)
- ✅ Socket.io má auto-reconnect, fallbacks, room support

**Nevýhody:**
- ❌ Potrebný samostatný WebSocket server
- ❌ Zložitejší deployment (PM2, nginx config)
- ❌ Vyššia komplexita kódu
- ❌ Potrebné riešiť authentication, rooms, error handling

**Náročnosť:**
- Implementácia: **6h** (WebSocket server + client integration + auth)
- Testovanie: **3h** (connection handling, reconnects, room logic)
- Deployment: **2h** (PM2 multi-app, nginx WebSocket proxy)
- **Celkom: 11 hodín**

**Kedy použiť:**
- Pre produkčné prostredie s viacerými používateľmi
- Keď je real-time kritický requirement
- Keď potrebujete obojsmernú komunikáciu

---

### 4. **Managed Service (Pusher, Ably, Supabase Realtime)**

**Princíp:**
Použiť externú službu pre real-time updates namiesto vlastnej implementácie.

**Implementácia (Pusher):**

```typescript
// Backend
import Pusher from 'pusher'

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: 'eu',
})

// Trigger event pri update
await pusher.trigger('tests', 'test-updated', {
  testId: test.id,
  name: test.name,
})

// Frontend
import Pusher from 'pusher-js'

const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
  cluster: 'eu'
})

const channel = pusher.subscribe('tests')

channel.bind('test-updated', (data) => {
  queryClient.invalidateQueries(['tests'])
})
```

**Výhody:**
- ✅ Jednoduchá implementácia (2-3 hodiny)
- ✅ Real-time bez vlastného WebSocket servera
- ✅ Škálovateľné out-of-the-box
- ✅ Managed infraštruktúra (žiadna údržba)

**Nevýhody:**
- ❌ **Platené** (Pusher: $49/mesiac, Ably: $29/mesiac)
- ❌ Závislosť na third-party službe
- ❌ Potenciálne GDPR problémy (dáta idú cez third-party)

**Náročnosť:**
- Implementácia: **2h**
- Testovanie: **1h**
- Deployment: **0.5h**
- **Celkom: 3.5 hodiny**

**Ceny:**
- Pusher: $49/mesiac (100 concurrent connections)
- Ably: $29/mesiac (50 concurrent connections)
- Supabase Realtime: Free tier dostačuje pre testing

**Kedy použiť:**
- Keď nechcete spravovať vlastnú infraštruktúru
- Keď máte budget na platené služby
- Pre rapid prototyping

---

## Porovnanie riešení

| Riešenie | Real-time | Náročnosť | Cena | Škálovateľnosť |
|----------|-----------|-----------|------|----------------|
| **Polling** | ⚠️ Delay 30-60s | ⭐ Veľmi nízka (1h) | ✅ Free | ⚠️ Stredná |
| **SSE** | ✅ Áno | ⭐⭐ Stredná (6h) | ✅ Free | ⚠️ Stredná |
| **WebSockets** | ✅ Áno | ⭐⭐⭐ Vysoká (11h) | ✅ Free | ✅ Vysoká |
| **Managed** | ✅ Áno | ⭐⭐ Stredná (3.5h) | ❌ $29-49/m | ✅ Vysoká |

---

## Odporúčanie

### **Pre MVP / Testing:**
```typescript
// Polling s React Query
const { data } = useTests(filters, {
  refetchInterval: 60000,
  refetchIntervalInBackground: false
})
```
- ✅ Rýchle nasadenie (1 hodina)
- ✅ Žiadne infraštruktúrne zmeny
- ✅ Funguje dostatočne dobre pre <50 používateľov

### **Pre Produkciu (long-term):**
**WebSocket s Socket.io**
- ✅ Najlepší pomer real-time/náročnosť
- ✅ Plná kontrola nad infraštruktúrou
- ✅ Žiadne mesačné náklady
- ⚠️ Vyššia implementačná náročnosť (11h)

---

## Implementačný plán (WebSockets)

### Fáza 1: Setup (2h)
- [ ] Install Socket.io (`npm install socket.io socket.io-client`)
- [ ] Vytvoriť WebSocket server (`server.js`)
- [ ] PM2 multi-app config

### Fáza 2: Authentication (2h)
- [ ] JWT token verification pre WebSocket connections
- [ ] Session management

### Fáza 3: Events (2h)
- [ ] `test:update` event backend
- [ ] `test:updated` event frontend
- [ ] React Query cache invalidation

### Fáza 4: Testing (3h)
- [ ] Unit tests pre WebSocket server
- [ ] Integration tests pre events
- [ ] E2E tests pre real-time updates

### Fáza 5: Deployment (2h)
- [ ] Nginx WebSocket proxy config
- [ ] PM2 deployment
- [ ] Production testing

**Celkom: 11 hodín**

---

## Ďalšie zdroje

- **Socket.io docs:** https://socket.io/docs/v4/
- **React Query invalidation:** https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation
- **Next.js WebSockets:** https://nextjs.org/docs/app/building-your-application/routing/route-handlers#websockets
- **Pusher docs:** https://pusher.com/docs

---

## Poznámky

- Pre malý počet používateľov (<20) stačí **polling**
- Pre stredný počet (20-100) odporúčam **WebSockets**
- Pre veľký počet (100+) zvážte **managed service** (Pusher/Ably)

Real-time je "nice to have", nie "must have" pre túto aplikáciu. Štartujte s pollingom a upgradujte na WebSockets len ak to bude potrebné.
