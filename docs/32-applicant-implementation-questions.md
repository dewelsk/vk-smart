# Otázky k Implementácii Uchádzačskej Časti

**Dátum:** 2025-10-10
**Status:** 🟡 Čaká na rozhodnutie

---

## Prehľad

Tento dokument obsahuje otázky a rozhodnutia, ktoré treba urobiť pred implementáciou uchádzačskej časti aplikácie.

**Súvisiace dokumenty:**
- [Stav Uchádzačskej Časti](30-applicant-screens-status.md) - Analýza čo máme hotové
- [Role Switching Feature](31-role-switching-feature.md) - Prepínanie admin → uchádzač
- [Obrazovky Uchádzača](../obrazovky/uchadzac/README.md) - Existujúce návrhy

---

## ⚠️ KRITICKÁ POZNÁMKA: Logika Uchádzačov

**POZNÁMKA OD POUŽÍVATEĽA:** "Musíme upraviť logiku uchádzačov"

**Otázky:**
- Čo presne je potrebné upraviť v logike?
- Týka sa to modelu Candidate vs. User?
- Alebo API endpointov?
- Alebo autentifikačného flow?

**TODO:** Diskutovať s používateľom a zapísať rozhodnutia.

---

## Otázky Pred Implementáciou

### 1. Middleware Routing 🔐

**Otázka:** Keď je admin switched na uchádzača, middleware musí povoliť prístup na `/applicant/*` routes. Ale zároveň musí zablokovať prístup na `/admin/*` routes?

**Možnosti:**

**A) Hard Block** (odporúčané)
- Admin (switched) nemôže pristúpiť na `/admin/*`
- Redirect na `/applicant/dashboard`
- Musí kliknúť "Vrátiť sa späť" aby videl admin panel

**B) Soft Block**
- Zobrazí warning banner
- Ale povolí prístup na admin routes

**C) Úplná Voľnosť**
- Admin môže prepínať medzi admin/applicant views
- Bez obmedzení

**Rozhodnutie:** ❓ (čaká na schválenie)

**Implementácia:**
```typescript
// middleware.ts
if (token.switchedToUserId) {
  // A) Hard block
  if (!pathname.startsWith('/applicant')) {
    return NextResponse.redirect(new URL('/applicant/dashboard', request.url))
  }
}
```

---

### 2. Header v Applicant Layout 🎨

**Otázka:** Kde zobrazíme žltý banner "Dočasne prihlásený ako [Meno]"?

**Možnosti:**

**A) V oboch layoutoch** (odporúčané)
- Banner v admin layoute (`components/admin/Header.tsx`) ✅ HOTOVO
- Banner aj v applicant layoute (`app/(applicant-protected)/layout.tsx`)
- Admin vždy vidí že je switched

**B) Len v admin layoute**
- V applicant views žiadny banner
- Admin môže zabudnúť že je switched

**Rozhodnutie:** ❓ (čaká na schválenie)

---

### 3. Výber Kandidáta - Aplikačná Logika 🎯

**Problém:** Jeden user (UCHADZAC) môže mať **viacero Candidate záznamov** (pre rôzne VK).

API `/api/applicant/dashboard` potrebuje vedieť, **ktorého kandidáta** zobrazovať.

**Možnosti:**

**A) Zobrazíme prvé VK** (najjednoduchšie)
```typescript
const candidate = user.candidates[0]
// Dashboard zobrazí testy len pre toto VK
```
- ✅ Jednoduché
- ❌ Ak má uchádzač viac VK, vidí len prvé

**B) Zobrazíme všetky VK** (komplexnejšie)
```typescript
// Dashboard zobrazí všetky VK kde je tento user kandidát
VK 1: Test 1, Test 2 (level locking)
VK 2: Test 1, Test 3 (level locking)
```
- ✅ Vidí všetky svoje VK
- ❌ Zložitejší UI
- ❌ Ako riešiť level locking naprieč VK?

**C) Admin pri switchi vyberie konkrétne VK**
```typescript
// V tabuľke uchádzačov vedľa každého VK bude "Prepnúť"
// Uložíme vkId do session (switchedToVkId)
// Dashboard zobrazí len toto VK
```
- ✅ Presná kontrola
- ✅ Admin vie na ktoré VK sa prepínal
- ❌ Komplexnejšia implementácia (uloženie vkId do JWT)

**Rozhodnutie:** ❓ (čaká na schválenie)

**Odporúčanie:** Začať s **A)** pre MVP, neskôr upgrade na **C)**.

---

### 4. Applicant Dashboard - Design 🎨

**Otázka:** Aký bohatý má byť dashboard?

**Možnosti:**

**A) Minimalistický** (odporúčané pre MVP)
- VK info card (identifier, position, date)
- Test cards (zoznam testov)
- Start test button
- Žiadne grafy, štatistiky, historické výsledky

**B) Bohatý Dashboard**
- Všetko z A) plus:
- Progress bars (celkový progress)
- Grafy výsledkov
- Hodnotenia komisie
- Historické výsledky
- Kalendár udalostí

**Rozhodnutie:** ❓ (čaká na schválenie)

**Odporúčanie:** Začať s **A)**, neskôr pridať features z **B)**.

---

### 5. Test Session - Auto-save UI 💾

**Otázka:** Počas testu auto-save každých 30 sekúnd volá `POST /api/applicant/test/[sessionId]/save`. Má používateľ vidieť indikátor?

**Možnosti:**

**A) Silent Auto-save** (odporúčané)
- Žiadny UI indikátor
- Beží na pozadí
- Používateľ to nevidí
- Len v console.log pre debugging

**B) Visible Auto-save**
- Mini toast: "Uložené" (2s)
- Malá ikona v rohu "Ukladám..." → "Uložené ✓"
- Používateľ má istotu že odpovede sú uložené

**Rozhodnutie:** ❓ (čaká na schválenie)

**Odporúčanie:** **A)** pre cleaner UX, ale ak používatelia majú obavy o strate dát → **B)**.

---

### 6. Level Locking - Vizualizácia 🔒

**Otázka:** Ako vizualizovať locked testy?

**Možnosti:**

**A) Disabled Card + Tooltip**
```tsx
<div className="opacity-50 cursor-not-allowed">
  <LockClosedIcon />
  <span>Level 2: IT Test</span>
  {/* Tooltip: "Dokončite Level 1: Všeobecný test" */}
</div>
```

**B) Disabled Card + Inline Text**
```tsx
<div className="opacity-50">
  <LockClosedIcon />
  <span>Level 2: IT Test</span>
  <p className="text-sm text-gray-500">
    🔒 Dokončite Level 1 pre odomknutie
  </p>
</div>
```

**C) Completely Hidden**
- Nezobrazovať locked testy vôbec
- Používateľ vidí len aktuálne dostupné

**Rozhodnutie:** ❓ (čaká na schválenie)

**Odporúčanie:** **B)** je najbezpečnejšie - jasne komunikuje prečo je test locked.

---

### 7. Middleware - Redirect Logic pri Switch 🚦

**Otázka:** Ak admin (switched) skúsi pristúpiť na `/admin/*` routes, čo sa stane?

**Možnosti:**

**A) Hard Redirect** (odporúčané)
- Immediate redirect na `/applicant/dashboard`
- Žiadna možnosť pristúpiť na admin routes
- Admin musí kliknúť "Vrátiť sa späť"

**B) Warning Banner**
- Zobrazí stránku + warning banner
- "Ste v prepnutom režime, niektoré funkcie môžu nefungovať"
- Umožní prístup

**C) Normálny Prístup**
- Povolí prístup na admin routes
- Žiadne obmedzenia

**Rozhodnutie:** ❓ (čaká na schválenie)

**Odporúčanie:** **A)** pre konzistenciu a bezpečnosť.

---

## Implementačný Plán (po rozhodnutí otázok)

### Fáza 1: Layout & Dashboard (3-4h)
1. Applicant Layout
2. Dashboard Page
3. Test Card Component
4. VK Info Component

### Fáza 2: Test Session (4-5h)
5. Test Session Page
6. Timer Component
7. Question Component
8. Progress Bar Component
9. Submit Modal

### Fáza 3: Results (2h)
10. Results Page
11. Result Card Component

### Fáza 4: Middleware (1h)
12. Middleware routing logic
13. Authorization checks

### Fáza 5: Testing (2-3h)
14. E2E testy
15. Manual testing
16. Bug fixes

**Total: 12-15 hodín** (2 pracovné dni)

---

## Bezpečnostné Úvahy

### Autorizácia
- Admin môže prepnúť len na uchádzačov **svojho rezortu**
- SUPERADMIN môže prepnúť na **akéhokoľvek** uchádzača
- Prepnutie len na rolu UCHADZAC (nie na iných adminov)

### Session Management
- JWT obsahuje `originalUserId` a `switchedToUserId`
- Timeout: 24 hodín (rovnaký ako normálna session)
- Žiadny auto-logout (len manual "Vrátiť sa späť")

### Audit Log
```typescript
{
  action: "SWITCH_TO_APPLICANT",
  userId: adminId,
  targetUserId: applicantId,
  metadata: {
    timestamp: "2025-10-10T10:30:00Z",
    adminUsername: "admin.jozef",
    applicantUsername: "uchadzac123"
  }
}
```

---

## Otvorené Otázky

1. **Logika uchádzačov** - Čo presne je potrebné upraviť?
2. **Middleware routing** - Hard block alebo soft block?
3. **Výber kandidáta** - Prvé VK, všetky VK, alebo admin vyberie?
4. **Dashboard design** - Minimalistický alebo bohatý?
5. **Auto-save** - Silent alebo visible?
6. **Level locking** - Disabled + tooltip alebo inline text?
7. **Redirect logic** - Hard redirect alebo warning?

---

## Changelog

- **2025-10-10** - Vytvorenie dokumentu
- **2025-10-10** - Pridaná poznámka "Musíme upraviť logiku uchádzačov"
