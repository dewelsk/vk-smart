# Admin Dashboard

## Účel obrazovky
Hlavná vstupná obrazovka pre admina po prihlásení. Zobrazuje prehľad všetkých VK, štatistiky a rýchly prístup k hlavným funkciám.

---

## ASCII Wireframe

```
+----------------------------------------------------------+
|  [Menu] Vyberove konania        [Admin] [Odhlasit sa]    |
|                                                          |
|  Dashboard                                               |
|  ==========                                              |
|                                                          |
|  +------------+ +------------+ +------------+            |
|  | Aktivne VK | | Uchadzaci  | | Prebieha   |            |
|  |            | |            | |            |            |
|  |     5      | |     42     | | testov: 3  |            |
|  +------------+ +------------+ +------------+            |
|                                                          |
|  Posledne vyberove konania        [+ Nove VK]            |
|  ------------------------------------------------------  |
|                                                          |
|  +-------------------------------------------------+     |
|  | VK/2025/1234 | Hlavny statny radca | TESTOVANIE |     |
|  | 5 uchadzacov | 3 testy priradene   | [Detail]   |     |
|  +-------------------------------------------------+     |
|                                                          |
|  +-------------------------------------------------+     |
|  | VK/2025/1235 | Referent            | PRIPRAVA   |     |
|  | 0 uchadzacov | 0 testov            | [Detail]   |     |
|  +-------------------------------------------------+     |
|                                                          |
|  +-------------------------------------------------+     |
|  | VK/2025/1230 | Riaditel odboru     | DOKONCENE  |     |
|  | 8 uchadzacov | Vybrany: Jan Novak  | [Detail]   |     |
|  +-------------------------------------------------+     |
|                                                          |
|  [Zobrazit vsetky VK ->]                                 |
|                                                          |
|  Cakajuce ulohy                                          |
|  ---------------                                         |
|  * 2 testy cakaju na schvalenie [Zobrazit ->]            |
|  * 1 VK bez priradenych testov [Zobrazit ->]             |
|                                                          |
+----------------------------------------------------------+
```

---

## Elementy na stránke

### 1. Header (Top Navigation)
**Komponenty:**
- **Logo/Názov aplikácie**: "Výberové konania"
- **Menu hamburger [☰]**: Toggle pre sidebar
- **User info**: "Admin" (meno a rola)
- **Tlačidlo Odhlásiť sa**: Logout button

**Správanie:**
- Klik na meno → dropdown s:
  - Profil
  - Nastavenia
  - Odhlásiť sa
- Klik na "Odhlásiť sa" → Logout + redirect na `/login`

**API:** `POST /api/auth/logout`

---

### 2. Štatistické karty (Stats Cards)

#### Karta "Aktívne VK"
- **Zobrazuje:** Počet VK so statusom `TESTOVANIE` alebo `HODNOTENIE`
- **Klik:** Redirect na `/admin/vk?status=active`
- **API:** `GET /api/admin/vk?status=TESTOVANIE,HODNOTENIE&count=true`

#### Karta "Uchádzači"
- **Zobrazuje:** Celkový počet aktívnych uchádzačov
- **Klik:** Redirect na `/admin/users?role=UCHADZAC`
- **API:** `GET /api/admin/users?role=UCHADZAC&count=true`

#### Karta "Prebieha testov"
- **Zobrazuje:** Počet práve prebiehajúcich testov
- **Klik:** Redirect na `/admin/monitoring`
- **API:** `GET /api/admin/tests/active?count=true`

**Vizualizácia:**
- Veľké číslo (font-size: 2rem)
- Popis pod číslom (font-size: 0.875rem)
- Hover effect (shadow, scale)

---

### 3. Sekcia "Posledné výberové konania"

**Komponenty:**
- **Nadpis sekcie:** "Posledné výberové konania"
- **Tlačidlo [+ Nové VK]:** Primary button, zelená
- **Zoznam VK:** Posledných 5 VK (podľa `createdAt DESC`)

#### Karta VK (pre každé VK v zozname)
**Zobrazované informácie:**
- **Identifikátor:** `VK/2025/1234` (bold, large)
- **Funkcia:** "Hlavný štátny radca"
- **Status badge:** `TESTOVANIE` (color-coded)
  - PRIPRAVA: šedá
  - TESTOVANIE: modrá
  - HODNOTENIE: oranžová
  - DOKONČENÉ: zelená
  - ZRUŠENÉ: červená
- **Dátum:** "24.7" (deň.mesiac)
- **Meta info:**
  - Počet uchádzačov: "5 uchádzačov"
  - Počet testov: "3 testy priradené"
- **Tlačidlo [Detail]:** Secondary button

**Správanie:**
- **Klik na kartu:** Redirect na `/admin/vk/[id]`
- **Klik na [Detail]:** Redirect na `/admin/vk/[id]`
- **Hover:** Shadow + border

**API:** `GET /api/admin/vk?limit=5&orderBy=createdAt&order=desc`

**Response príklad:**
```json
{
  "vks": [
    {
      "id": "vk_1",
      "identifikator": "VK/2025/1234",
      "funkcia": "Hlavný štátny radca",
      "status": "TESTOVANIE",
      "datum": "2025-07-24",
      "pocetKandidatov": 5,
      "pocetTestov": 3
    }
  ]
}
```

---

### 4. Tlačidlo [+ Nové VK]
**Typ:** Primary button (zelený)
**Pozícia:** Vpravo hore v sekcii "Posledné VK"
**Text:** "+ Nové VK"

**Správanie:**
- Klik → Redirect na `/admin/vk/nove`

---

### 5. Link "Zobraziť všetky VK"
**Typ:** Text link s ikonou →
**Správanie:**
- Klik → Redirect na `/admin/vk` (zoznam všetkých VK)

---

### 6. Sekcia "Čakajúce úlohy"

**Zobrazuje notifikácie o:**
- Testy čakajúce na schválenie
- VK bez priradených testov
- VK bez uchádzačov
- Výsledky čakajúce na finalizáciu

**Formát:**
- Bullet list s odkazmi
- Každý item má link → [Zobraziť →]

**Príklad:**
```
• 2 testy čakajú na schválenie [Zobraziť →]
  → Redirect na /admin/tests?status=pending

• 1 VK bez priradených testov [Zobraziť →]
  → Redirect na /admin/vk?filter=no_tests
```

**API:** `GET /api/admin/dashboard/notifications`

**Response:**
```json
{
  "notifications": [
    {
      "type": "pending_tests",
      "count": 2,
      "link": "/admin/tests?status=pending"
    },
    {
      "type": "vk_no_tests",
      "count": 1,
      "link": "/admin/vk?filter=no_tests"
    }
  ]
}
```

---

## Navigácia

### Odkiaľ sa dostať na túto obrazovku:
- Po úspešnom prihlásení (login redirect)
- Klik na logo v headeri (z akejkoľvek admin stránky)
- `/admin/dashboard` URL

### Kam viesť z tejto obrazovky:
- `/admin/vk/nove` - Tlačidlo [+ Nové VK]
- `/admin/vk` - Link "Zobraziť všetky VK"
- `/admin/vk/[id]` - Klik na kartu VK
- `/admin/users` - Klik na štatistiku uchádzačov
- `/admin/monitoring` - Klik na štatistiku testov
- `/admin/tests` - Čakajúce testy link

---

## API Volania

### Pri načítaní stránky (useEffect):
```typescript
// Paralelné volania
const [stats, recentVKs, notifications] = await Promise.all([
  fetch('/api/admin/dashboard/stats'),
  fetch('/api/admin/vk?limit=5&orderBy=createdAt&order=desc'),
  fetch('/api/admin/dashboard/notifications'),
]);
```

### Endpoints:

1. **GET `/api/admin/dashboard/stats`**
   ```json
   {
     "activeVK": 5,
     "totalCandidates": 42,
     "activeTests": 3
   }
   ```

2. **GET `/api/admin/vk?limit=5&orderBy=createdAt&order=desc`**
   (viď response príklad vyššie)

3. **GET `/api/admin/dashboard/notifications`**
   (viď response príklad vyššie)

---

## Stavy (Loading, Error, Success)

### Loading State:
```
┌─────────────────────────┐
│  Dashboard              │
│  ═══════════            │
│                         │
│  [🔄 Načítavam...]      │
│                         │
│  ┌───┐  ┌───┐  ┌───┐  │
│  │...│  │...│  │...│  │  ← Skeleton loaders
│  └───┘  └───┘  └───┘  │
└─────────────────────────┘
```

**Implementácia:**
- Skeleton screens pre karty
- Shimmer effect
- Disable tlačidlá počas loadingu

### Error State:
```
┌─────────────────────────────────────┐
│  ⚠️ Nepodarilo sa načítať údaje     │
│                                     │
│  [Skúsiť znova]                     │
└─────────────────────────────────────┘
```

**Správanie:**
- Toast notifikácia s chybou
- Tlačidlo "Skúsiť znova" → retry API call
- Fallback: Zobraziť prázdny stav

### Empty State (žiadne VK):
```
┌─────────────────────────────────────┐
│  📋 Zatiaľ nemáte žiadne VK         │
│                                     │
│  [+ Vytvoriť prvé VK]               │
└─────────────────────────────────────┘
```

---

## Validácie

**Prístupové práva:**
- Len ADMIN role má prístup
- Iné role → redirect na ich dashboard

**Session validácia:**
- Middleware check: `session.user.role === 'ADMIN'`
- Ak nie je prihlásený → redirect na `/login`

---

## Edge Cases

### 1. Žiadne VK v systéme
- Zobraziť empty state
- Tlačidlo [+ Vytvoriť prvé VK]

### 2. API timeout
- Retry 3x s exponenciálnym backoff
- Po 3 neúspešných pokusoch → error state

### 3. Veľký počet VK (performance)
- Limitovať na 5 posledných
- Lazy loading pre štatistiky

### 4. Real-time updates (voliteľné)
- WebSocket alebo polling každých 30s
- Aktualizácia počtu aktívnych testov

---

## Technické poznámky

**Komponenty (React):**
```typescript
<AdminDashboard>
  <Header user={session.user} />
  <StatsCards stats={stats} />
  <RecentVKSection vks={recentVKs} />
  <NotificationsSection notifications={notifications} />
</AdminDashboard>
```

**State management:**
```typescript
const [stats, setStats] = useState(null);
const [vks, setVKs] = useState([]);
const [notifications, setNotifications] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
```

**Refresh interval (optional):**
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    refreshStats();
  }, 30000); // 30s

  return () => clearInterval(interval);
}, []);
```

---

## Accessibility (WCAG)

- **Keyboard navigation:** Tab medzi kartami a tlačidlami
- **Screen readers:** Aria labels pre štatistiky
- **Fokus indikátory:** Viditeľné outline
- **Color contrast:** Min. 4.5:1 ratio

---

## Responsive Design

**Desktop (> 1024px):**
- 3 karty vedľa seba
- Zoznam VK 2 stĺpce

**Tablet (768px - 1024px):**
- 2 karty vedľa seba
- Zoznam VK 1 stĺpec

**Mobile (< 768px):**
- Všetko pod sebou
- Stack layout
