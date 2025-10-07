# Detail VK - Validácie a Taby

> Kompletná špecifikácia validačných pravidiel, chybových stavov a štruktúry tabov pre detail výberového konania

---

## 1️⃣ VALIDÁCIE V ZOZNAME VK

### Zobrazenie v tabuľke

**Nový stĺpec: "Stav pripravenosti"**

```
┌──────────┬──────────────┬────────┬──────────────────────┐
│ Kód VK   │ Pozícia      │ Status │ Pripravenosť         │
├──────────┼──────────────┼────────┼──────────────────────┤
│VK/25/001 │Analytik dát  │Príprava│ ⚠️ 4 problémy        │
│VK/25/002 │Senior prog.  │Testov. │ ✅ Pripravené        │
│VK/25/003 │Proj. manažér │Hodnot. │ ⚠️ 1 problém         │
└──────────┴──────────────┴────────┴──────────────────────┘
```

### Tooltip pri hover na "⚠️ 4 problémy"

```
┌───────────────────────────────────────┐
│ ❌ Gestor nie je priradený            │
│ ⚠️  Žiadni uchádzači                  │
│ ❌ Žiadne priradené testy             │
│ ❌ Komisia nie je vytvorená           │
└───────────────────────────────────────┘
```

### Farby a indikátory

| Indikátor | Význam | Popis |
|-----------|--------|-------|
| ✅ Zelená | OK | Žiadne problémy, VK je pripravené na prechod |
| ⚠️ Oranžová | Varovania | VK môže pokračovať ale niečo chýba |
| ❌ Červená | Blokery | VK nemôže pokračovať na ďalší status |

---

## 2️⃣ VŠETKY VALIDAČNÉ PRAVIDLÁ

### A) ZÁKLADNÉ NASTAVENIE
*Platné pre každý status VK*

| Pravidlo | Typ | Popis | Bloker pre status |
|----------|-----|-------|-------------------|
| **Gestor priradený** | `ERROR` | VK musí mať priradeného gestora | CAKA_NA_TESTY |
| **Aspoň 1 uchádzač** | `WARNING` | VK by malo mať aspoň jedného uchádzača | - |
| **Organizačný útvar vyplnený** | `ERROR` | Základné info musia byť kompletné | Všetky |
| **Dátum konania v budúcnosti** | `WARNING` | Dátum VK by nemal byť v minulosti | - |

---

### B) TESTY
*Validácie pred prechodom: PRIPRAVA → CAKA_NA_TESTY*

| Pravidlo | Typ | Popis |
|----------|-----|-------|
| **Aspoň 1 test priradený** | `ERROR` | VK musí mať aspoň jeden test |
| **Každý test má konfiguráciu** | `ERROR` | Level, počet otázok, čas, bodovanie musia byť vyplnené |
| **Testy majú unikátne levely** | `ERROR` | Nemôžu byť 2 testy s rovnakým levelom |
| **Min score je validný** | `ERROR` | Minimálne body musia byť medzi 0-100% |
| **Každý test má aspoň 5 otázok** | `WARNING` | Odporúčaný minimum je 5 otázok |
| **Časový limit je realistický** | `WARNING` | Čas by mal byť medzi 10-120 minút |

---

### C) KOMISIA
*Validácie pred prechodom: PRIPRAVA → CAKA_NA_TESTY*

| Pravidlo | Typ | Popis |
|----------|-----|-------|
| **Komisia existuje** | `ERROR` | VK musí mať vytvorenú komisiu |
| **Nepárny počet členov** | `ERROR` | Komisia musí mať nepárny počet členov (3, 5, 7, 9...) |
| **Minimálne 3 členovia** | `ERROR` | Komisia musí mať aspoň 3 členov |
| **Maximálne 9 členov** | `WARNING` | Odporúčaný max počet je 9 členov |
| **Presne 1 predseda** | `ERROR` | Komisia musí mať presne jedného predsedu |
| **Všetci členovia aktívni** | `WARNING` | Niektorí členovia komisie sú neaktívni |
| **Žiadny duplicitný člen** | `ERROR` | Každý používateľ môže byť len raz v komisii |

**Príklady chýb:**

```
❌ Komisia má párny počet členov (4)
   → Pridajte alebo odstráňte 1 člena

❌ Komisia nemá predsedu
   → Nastavte jedného člena ako predsedu

❌ Komisia má 2 predsedov
   → Môže byť len 1 predseda
```

---

### D) UCHÁDZAČI
*Validácie pred prechodom: CAKA_NA_TESTY → TESTOVANIE*

| Pravidlo | Typ | Popis |
|----------|-----|-------|
| **Aspoň 1 uchádzač** | `ERROR` | VK musí mať aspoň jedného uchádzača |
| **Všetci uchádzači majú email** | `WARNING` | Uchádzači bez emailu nedostanú notifikácie |
| **Všetci uchádzači majú heslo nastavené** | `ERROR` | Uchádzači musia mať prístup do systému |
| **Všetci uchádzači sú aktívni** | `WARNING` | Niektorí uchádzači sú deaktivovaní |
| **CIS identifikátory sú unikátne** | `ERROR` | Každý uchádzač musí mať unikátny CIS ID |

---

### E) TESTOVANIE
*Validácie počas a pred prechodom: TESTOVANIE → HODNOTENIE*

| Pravidlo | Typ | Popis |
|----------|-----|-------|
| **Všetci uchádzači dokončili testy** | `ERROR` | Všetci uchádzači musia dokončiť všetky priradené testy |
| **Aspoň 80% uchádzačov dokončilo** | `WARNING` | Väčšina uchádzačov už dokončila, môžete pokračovať |
| **Žiadny uchádzač nezačal testy** | `WARNING` | Nikto ešte nezačal testovanie |
| **Aspoň 1 uchádzač prešiel testami** | `WARNING` | Zatiaľ žiadny uchádzač neprešiel všetkými testami |

**Progress indikátory:**

```
🧪 Testovanie prebieha
Progress: ████████████░░░░░░░░ 12/15 (80%)

• Dokončili: 12 uchádzačov
• Prebieha: 2 uchádzači
• Nezačali: 1 uchádzač
```

---

### F) HODNOTENIE
*Validácie pred prechodom: HODNOTENIE → DOKONCENE*

| Pravidlo | Typ | Popis |
|----------|-----|-------|
| **Evaluation config existuje** | `ERROR` | VK musí mať konfiguráciu hodnotenia |
| **Všetci uchádzači ohodnotení** | `ERROR` | Každý člen komisie musí ohodnotiť každého uchádzača |
| **Všetky hodnotenia finalizované** | `ERROR` | Všetky hodnotenia musia byť označené ako finálne |
| **Aspoň 1 uchádzač prešiel** | `WARNING` | Zatiaľ žiadny uchádzač neprešiel celým procesom |
| **Hodnotenia sú konzistentné** | `WARNING` | Veľký rozptyl v hodnoteniach medzi členmi komisie |

**Progress indikátory:**

```
⭐ Hodnotenie komisiou
Progress: ████░░░░░░░░░░░░░░░ 15/75 (20%)

• Kompletné hodnotenia: 3 uchádzači (všetci 5 členovia ohodnotili)
• Čiastočné hodnotenia: 5 uchádzačov (niektorí členovia ohodnotili)
• Neohodnotení: 7 uchádzačov (žiadne hodnotenie)
```

---

## 3️⃣ ZOBRAZENIE CHÝB V DETAILE VK

### Umiestnenie
**Pod hlavičkou VK, pred tabmi**

---

### STATUS: PRIPRAVA

```
┌─────────────────────────────────────────────────────────┐
│ 🔧 VK v príprave                                         │
├─────────────────────────────────────────────────────────┤
│ Dokončite nastavenie pred spustením testovania.         │
│                                                          │
│ Chýbajúce kroky:                                        │
│   □ Priradiť gestora                                     │
│   □ Pridať testy                                         │
│   □ Vytvoriť komisiu (3-9 členov, nepárny počet)        │
│   □ Nastaviť predsedu komisie                           │
│   □ Pridať uchádzačov                                   │
│                                                          │
│ [→ Prejsť do nastavenia]                                 │
└─────────────────────────────────────────────────────────┘
```

**Ak sú všetky kroky splnené:**

```
┌─────────────────────────────────────────────────────────┐
│ ✅ VK pripravené                                         │
├─────────────────────────────────────────────────────────┤
│ Všetky potrebné kroky sú dokončené.                     │
│ Môžete prejsť na stav "Čaká na testy".                  │
│                                                          │
│ [→ Prejsť na "Čaká na testy"]                           │
└─────────────────────────────────────────────────────────┘
```

**Ak existujú blokery:**

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️  VK nie je pripravené na prechod                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Blokujúce problémy (4):                                 │
│   ❌ Gestor nie je priradený → [Priradiť]               │
│   ❌ Žiadne priradené testy → [Pridať test]             │
│   ❌ Komisia nie je vytvorená → [Vytvoriť komisiu]      │
│   ❌ Komisia musí mať presne jedného predsedu           │
│      → [Nastaviť predsedu]                               │
│                                                          │
│ Varovania (2):                                          │
│   ⚠️  Žiadni uchádzači → [Pridať uchádzača]             │
│   ⚠️  Dátum konania je v minulosti                      │
│                                                          │
│ Dokončite všetky povinné kroky pred prechodom na       │
│ ďalší stav.                                              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

### STATUS: CAKA_NA_TESTY

```
┌─────────────────────────────────────────────────────────┐
│ ✅ Pripravené na testovanie                              │
├─────────────────────────────────────────────────────────┤
│ VK je pripravené. Môžete spustiť testovanie.            │
│                                                          │
│ • Uchádzači: 15                                         │
│ • Testy: 3 priradené                                    │
│ • Komisia: 5 členov (Jozef Novák - predseda)           │
│ • Gestor: Mária Kováčová                                │
│                                                          │
│ Po spustení testovania dostanú uchádzači prístup        │
│ k testom a notifikačný email.                           │
│                                                          │
│ [→ Spustiť testovanie]                                   │
└─────────────────────────────────────────────────────────┘
```

---

### STATUS: TESTOVANIE

```
┌─────────────────────────────────────────────────────────┐
│ 🧪 Prebieha testovanie                                   │
├─────────────────────────────────────────────────────────┤
│ Progress: ████████████░░░░░░░░ 12/15 (80%)              │
│                                                          │
│ • Dokončili: 12 uchádzačov                              │
│ • Prebieha: 2 uchádzači                                 │
│ • Nezačali: 1 uchádzač                                  │
│                                                          │
│ Približný čas do dokončenia: 2-3 dni                    │
│                                                          │
│ [Zobraziť uchádzačov] [Poslať reminder nezačatým]       │
└─────────────────────────────────────────────────────────┘
```

**Ak všetci dokončili:**

```
┌─────────────────────────────────────────────────────────┐
│ ✅ Testovanie dokončené                                  │
├─────────────────────────────────────────────────────────┤
│ Všetci uchádzači dokončili testy.                       │
│ Môžete prejsť na hodnotenie.                            │
│                                                          │
│ • Úspešní: 8 uchádzačov (53%)                           │
│ • Neúspešní: 7 uchádzačov (47%)                         │
│                                                          │
│ [→ Prejsť na hodnotenie]                                 │
└─────────────────────────────────────────────────────────┘
```

---

### STATUS: HODNOTENIE

```
┌─────────────────────────────────────────────────────────┐
│ ⭐ Prebieha hodnotenie komisiou                          │
├─────────────────────────────────────────────────────────┤
│ Progress: ████░░░░░░░░░░░░░░░ 15/75 (20%)              │
│                                                          │
│ • Kompletné hodnotenia: 3 uchádzači                     │
│ • Čiastočné hodnotenia: 5 uchádzačov                    │
│ • Neohodnotení: 7 uchádzačov                            │
│                                                          │
│ Hodnotenie vykonáva 5 členov komisie.                   │
│ Každý člen musí ohodnotiť všetkých uchádzačov.          │
│                                                          │
│ [Zobraziť uchádzačov] [Zobraziť hodnotenia]             │
└─────────────────────────────────────────────────────────┘
```

**Ak sú všetci ohodnotení:**

```
┌─────────────────────────────────────────────────────────┐
│ ✅ Hodnotenie dokončené                                  │
├─────────────────────────────────────────────────────────┤
│ Všetci uchádzači boli ohodnotení všetkými členmi       │
│ komisie. Môžete ukončiť VK.                             │
│                                                          │
│ • Celkovo ohodnotených: 15 uchádzačov                   │
│ • Všetky hodnotenia finalizované: ✓                     │
│                                                          │
│ [→ Ukončiť VK] [Zobraziť finálne výsledky]              │
└─────────────────────────────────────────────────────────┘
```

---

### STATUS: DOKONCENE

```
┌─────────────────────────────────────────────────────────┐
│ ✅ VK dokončené                                          │
├─────────────────────────────────────────────────────────┤
│ Výberové konanie bolo úspešne ukončené.                 │
│                                                          │
│ • Celkovo uchádzačov: 15                                │
│ • Úspešní: 8 (53%)                                      │
│ • Neúspešní: 7 (47%)                                    │
│                                                          │
│ Finálne dokumenty:                                      │
│ • Súmarný hárok                                         │
│ • Záverečné hodnotenie                                  │
│ • Zápisnica                                             │
│                                                          │
│ [Generovať záverečnú správu] [Archivovať VK]            │
└─────────────────────────────────────────────────────────┘
```

---

### STATUS: ZRUSENE

```
┌─────────────────────────────────────────────────────────┐
│ ❌ VK zrušené                                            │
├─────────────────────────────────────────────────────────┤
│ Toto výberové konanie bolo zrušené.                     │
│                                                          │
│ Zrušil: Jozef Novák                                     │
│ Dátum: 20.03.2025 14:30                                 │
│ Dôvod: Zmena organizačnej štruktúry                     │
│                                                          │
│ [Zobraziť detail]                                        │
└─────────────────────────────────────────────────────────┘
```

---

## 4️⃣ NÁVRH TABOV

### Prehľad štruktúry

```
┌─────────────────────────────────────────────────────────┐
│ [📋 Prehľad] [👥 Uchádzači] [📝 Testy] [👨‍⚖️ Komisia]    │
│ [⚙️ Hodnotenie] [📊 Výsledky] [📄 Dokumenty]            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Tab content...                                           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Tab 1: 📋 Prehľad

### Obsah

1. **Základné informácie** (read-only)
   - Identifikátor VK
   - Rezort
   - Pozícia
   - Druh konania
   - Organizačný útvar
   - Odbor štátnej služby
   - Funkcia
   - Druh štátnej služby
   - Dátum konania
   - Počet miest
   - Status (badge)
   - Kto vytvoril + kedy

2. **Priradení ľudia**
   ```
   ┌────────────────────────────────────────┐
   │ Gestor                                  │
   ├────────────────────────────────────────┤
   │ Jozef Novák                             │
   │ jozef.novak@mirri.gov.sk                │
   │                                         │
   │ [Zmeniť gestora]                        │
   └────────────────────────────────────────┘

   ┌────────────────────────────────────────┐
   │ Komisia                                 │
   ├────────────────────────────────────────┤
   │ 5 členov                                │
   │ Predseda: Jozef Novák                  │
   │                                         │
   │ [→ Prejsť na tab Komisia]               │
   └────────────────────────────────────────┘
   ```

3. **Validation Status Card**
   *(Zobrazené v sekcii 3)*

4. **Štatistiky**
   ```
   ┌────────────────────────────────────────┐
   │ Štatistiky                              │
   ├────────────────────────────────────────┤
   │ Uchádzači:       15 (14 aktívnych)     │
   │ Testy:           3 priradené           │
   │ Testovanie:      12/15 dokončilo (80%) │
   │ Hodnotenie:      3/15 dokončilo (20%)  │
   └────────────────────────────────────────┘
   ```

5. **Akcie**
   - **[Upraviť VK]** - Len ak status PRIPRAVA
   - **[Zmeniť stav]** - Dropdown s povolenými prechodmi
   - **[Zrušiť VK]** - Confirmation modal
   - **[Vymazať VK]** - Len Superadmin/Admin

### Prístup
- **Všetci**: Admin, Gestor, Komisia, Superadmin

---

## Tab 2: 👥 Uchádzači

### Obsah

**Tabuľka uchádzačov:**

```
┌───┬──────────────┬────────────────────┬─────────┬─────────┬──────┬─────────┬───────┐
│ # │ Meno         │ Email              │ CIS ID  │ Status  │ Testy│ Hodn.   │ Akcie │
├───┼──────────────┼────────────────────┼─────────┼─────────┼──────┼─────────┼───────┤
│ 1 │ Peter Novák  │ peter@example.com  │ UC001   │ ● Aktív │ 3/3  │ 5/5     │  ⋮    │
│ 2 │ Mária Kováč  │ maria@example.com  │ UC002   │ ● Aktív │ 2/3  │ 0/5     │  ⋮    │
│ 3 │ Ján Horák    │ jan@example.com    │ UC003   │ ○ Arch. │ 3/3  │ 5/5     │  ⋮    │
└───┴──────────────┴────────────────────┴─────────┴─────────┴──────┴─────────┴───────┘
```

**Stĺpce:**
- **#** - Poradové číslo
- **Meno** - Meno a priezvisko (kliknuteľné → detail uchádzača)
- **Email** - Email uchádzača
- **CIS ID** - CIS identifikátor
- **Status** - Aktívny/Archivovaný
- **Testy** - Progress testov (3/3 = dokončil všetky)
- **Hodn.** - Progress hodnotenie (5/5 = všetci 5 členovia ohodnotili)
- **Akcie** - Dropdown menu

**Akcie (dropdown ⋮):**
- **Zobraziť detail** → detail uchádzača
- **Upraviť** → edit modal
- **Poslať link na reset hesla** → email s resetom
- **Deaktivovať/Aktivovať** → toggle active
- **Archivovať** → soft archive
- **Vymazať** → soft delete

**Search & Filter:**
- Search input (fulltext v mene, email, CIS ID)
- Filter: Všetci / Aktívni / Archivovaní
- Filter: Dokončili testy / Nedokončili testy
- Filter: Ohodnotení / Neohodnotení

**Akcie (header):**
- **[+ Pridať uchádzača]** - Modal
- **[CSV Import]** - Modal pre hromadný import
- **[Export do CSV]** - Download CSV so zoznamom

### Prístup
- **Admin, Gestor, Superadmin**: Plný prístup
- **Komisia**: Len čítanie

---

## Tab 3: 📝 Testy

### Obsah

**Zoznam priradených testov:**

```
┌────────────────────────────────────────────────────────┐
│ Level 1: Odborný test                                  │
├────────────────────────────────────────────────────────┤
│ Typ: ODBORNY                                           │
│ Počet otázok: 20                                       │
│ Časový limit: 30 minút                                 │
│ Body za otázku: 5                                      │
│ Minimálne body: 60/100 (60%)                           │
│                                                        │
│ Progress: 12/15 uchádzačov dokončilo (80%)             │
│                                                        │
│ [Upraviť konfiguráciu] [Odstrániť test]                │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Level 2: Všeobecný test                                │
├────────────────────────────────────────────────────────┤
│ ...                                                     │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Level 3: IT zručnosti                                  │
├────────────────────────────────────────────────────────┤
│ ...                                                     │
└────────────────────────────────────────────────────────┘
```

**Akcie:**
- **[+ Pridať test]** - Modal

---

### Modal: Pridať test

```
┌─────────────────────────────────────────────────────────┐
│ Pridať test do VK                                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Test *                                                   │
│ [Vyberte test...]                                   [▼] │
│                                                          │
│ Level *                                                  │
│ [1....]                                                  │
│ (poradie testu - 1, 2, 3...)                            │
│                                                          │
│ Počet otázok *                                           │
│ [20....]                                                 │
│ (odporúčané: 20)                                        │
│                                                          │
│ Časový limit (minúty) *                                  │
│ [30....]                                                 │
│ (odporúčané: 30 minút)                                  │
│                                                          │
│ Body za otázku *                                         │
│ [5....]                                                  │
│                                                          │
│ Minimálne body na úspech *                               │
│ [60....]                                                 │
│ (napr. 60 bodov z max 100)                              │
│                                                          │
│                              [Zrušiť]  [Pridať test]    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**API:**
```
POST /api/admin/vk/:vkId/tests
{
  "testId": "test_123",
  "level": 1,
  "questionCount": 20,
  "durationMinutes": 30,
  "scorePerQuestion": 5,
  "minScore": 60
}
```

### Prístup
- **Admin, Gestor, Superadmin**: Plný prístup
- **Komisia**: Len čítanie

---

## Tab 4: 👨‍⚖️ Komisia

### Obsah

**Tabuľka členov komisie:**

```
┌───┬──────────────┬────────────────────┬──────────┬────────┐
│ # │ Meno         │ Email              │ Predseda │ Akcie  │
├───┼──────────────┼────────────────────┼──────────┼────────┤
│ 1 │ Jozef Novák  │ jozef@mirri.gov.sk │ ✓        │  ⋮     │
│ 2 │ Mária Kováč  │ maria@mirri.gov.sk │          │  ⋮     │
│ 3 │ Ján Horák    │ jan@mirri.gov.sk   │          │  ⋮     │
│ 4 │ Eva Nováková │ eva@mirri.gov.sk   │          │  ⋮     │
│ 5 │ Peter Kováč  │ peter@mirri.gov.sk │          │  ⋮     │
└───┴──────────────┴────────────────────┴──────────┴────────┘
```

**Validation warnings (ak existujú):**

```
⚠️ Nepárny počet členov (aktuálne: 4)
   → Pridajte alebo odstráňte 1 člena

⚠️ Žiadny predseda
   → Nastavte jedného člena ako predsedu

✅ Komisia je validná (5 členov, 1 predseda)
```

**Akcie dropdown (⋮):**
- **Nastaviť ako predsedu** - Toggle isChairman (ak nie je predseda)
- **Odobrať z predsedu** - Odobrať isChairman (ak je predseda)
- **Odstrániť z komisie** - DELETE

**Akcie (header):**
- **[+ Pridať člena]** - Modal

---

### Modal: Pridať člena komisie

```
┌─────────────────────────────────────────────────────────┐
│ Pridať člena komisie                                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Člen komisie *                                           │
│ [Vyberte používateľa...]                            [▼] │
│                                                          │
│ ☐ Nastaviť ako predsedu komisie                         │
│                                                          │
│                              [Zrušiť]  [Pridať]         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**API:**
```
POST /api/admin/vk/:vkId/commission/members
{
  "userId": "user_789",
  "isChairman": true
}
```

### Prístup
- **Admin, Superadmin**: Plný prístup
- **Gestor**: Len čítanie
- **Komisia**: Len čítanie

---

## Tab 5: ⚙️ Hodnotenie

### Obsah

**Konfigurácia hodnotenia:**

```
┌─────────────────────────────────────────────────────────┐
│ Konfigurácia hodnotenia                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Hodnotené vlastnosti:                                   │
│   • Odborné znalosti (váha: 2)                          │
│   • Komunikačné schopnosti (váha: 1)                    │
│   • Analytické myslenie (váha: 2)                       │
│   • Tímová práca (váha: 1)                              │
│   • Vodcovské schopnosti (váha: 1)                      │
│                                                          │
│ Škála hodnotenia: 1-5 (1 = nedostatočné, 5 = výborné)  │
│                                                          │
│ Celková maximálna hodnota: 35 bodov                     │
│                                                          │
│ [Upraviť konfiguráciu] [Náhľad formulára]               │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Batéria otázok (príklad):**

```json
{
  "evaluatedTraits": [
    "Odborné znalosti",
    "Komunikačné schopnosti",
    "Analytické myslenie",
    "Tímová práca",
    "Vodcovské schopnosti"
  ],
  "questionBattery": [
    {
      "trait": "Odborné znalosti",
      "question": "Ako hodnotíte odborné znalosti uchádzača?",
      "scale": "1-5",
      "weight": 2
    },
    {
      "trait": "Komunikačné schopnosti",
      "question": "Ako hodnotíte komunikačné schopnosti uchádzača?",
      "scale": "1-5",
      "weight": 1
    }
    // ...
  ]
}
```

**Akcie:**
- **[Upraviť konfiguráciu]** - Len status PRIPRAVA
- **[Náhľad hodnotiacieho formulára]** - Preview toho, čo uvidia členovia komisie

### Prístup
- **Admin, Superadmin**: Plný prístup
- **Gestor**: Len čítanie
- **Komisia**: Len čítanie

---

## Tab 6: 📊 Výsledky

### Obsah

**Agregované výsledky všetkých uchádzačov:**

```
┌───┬──────────────┬──────────┬────────────┬──────────┬──────────┐
│ # │ Meno         │ Testy    │ Hodnotenie │ Celkom   │ Výsledok │
├───┼──────────────┼──────────┼────────────┼──────────┼──────────┤
│ 1 │ Peter Novák  │ 85/100   │ 32/35      │ 93.4%    │ ✅ Úspech│
│ 2 │ Mária Kováč  │ 78/100   │ 28/35      │ 84.8%    │ ✅ Úspech│
│ 3 │ Ján Horák    │ 55/100   │ 25/35      │ 64.0%    │ ❌ Neúsp.│
└───┴──────────────┴──────────┴────────────┴──────────┴──────────┘
```

**Grafy:**
- Histogram úspešnosti testov
- Rozloženie bodov hodnotenia
- Celkové poradie uchádzačov

**Filter:**
- **Všetci** / **Len úspešní** / **Len neúspešní**
- Sort: Celkové skóre DESC/ASC

**Export:**
- **[Export do CSV]**
- **[Export do PDF]**

### Prístup
- **Všetci**: Admin, Gestor, Komisia, Superadmin

---

## Tab 7: 📄 Dokumenty

### Obsah

**Tabuľka generovaných dokumentov:**

```
┌──────────────────────┬────────────────────┬─────────────┐
│ Typ dokumentu        │ Dátum generovania  │ Akcie       │
├──────────────────────┼────────────────────┼─────────────┤
│ Súmarný hárok        │ 20.03.2025 14:30   │ [⬇ Stiahnuť]│
│ Záverečné hodnotenie │ 22.03.2025 10:15   │ [⬇ Stiahnuť]│
│ Zápisnica            │ 25.03.2025 16:45   │ [⬇ Stiahnuť]│
└──────────────────────┴────────────────────┴─────────────┘
```

**Generovanie nových dokumentov:**

- **[Generovať súmarný hárok]** - Súhrn všetkých uchádzačov
- **[Generovať záverečné hodnotenie]** - Finálne hodnotenie
- **[Generovať zápisnicu]** - Zápisnica z VK

**API:**
```
POST /api/admin/vk/:vkId/documents/generate
{
  "type": "SUMARNY_HAROK" | "ZAVERECNE_HODNOTENIE" | "ZAPISNICA"
}
```

**Stiahnuť:**
```
GET /api/admin/vk/:vkId/documents/:docId/download
```

### Prístup
- **Všetci**: Admin, Gestor, Komisia, Superadmin

---

## 5️⃣ ZHRNUTIE

### Počet tabov: **7**

1. 📋 **Prehľad** - Overview, validácie, štatistiky
2. 👥 **Uchádzači** - Správa uchádzačov
3. 📝 **Testy** - Priradenie a konfigurácia testov
4. 👨‍⚖️ **Komisia** - Správa komisie
5. ⚙️ **Hodnotenie** - Konfigurácia hodnotenia
6. 📊 **Výsledky** - Agregované výsledky
7. 📄 **Dokumenty** - Generované PDF dokumenty

### Celkový počet validačných pravidiel: **32**

- **Blokery (ERROR)**: 20
- **Varovania (WARNING)**: 12

### Počet API endpointov: **Minimum 15**

**Gestor:**
- `PATCH /api/admin/vk/:id/gestor`

**Komisia:**
- `POST /api/admin/vk/:id/commission`
- `POST /api/admin/vk/:id/commission/members`
- `DELETE /api/admin/vk/:id/commission/members/:memberId`
- `PATCH /api/admin/vk/:id/commission/members/:memberId/chairman`

**Testy:**
- `POST /api/admin/vk/:id/tests`
- `PATCH /api/admin/vk/:id/tests/:testId`
- `DELETE /api/admin/vk/:id/tests/:testId`

**Validácie:**
- `GET /api/admin/vk/:id/validation`

**Hodnotenie:**
- `POST /api/admin/vk/:id/evaluation-config`
- `PATCH /api/admin/vk/:id/evaluation-config`

**Dokumenty:**
- `POST /api/admin/vk/:id/documents/generate`
- `GET /api/admin/vk/:id/documents/:docId/download`

**Status:**
- `PATCH /api/admin/vk/:id/status`

**Ostatné (už implementované):**
- `GET /api/admin/vk/:id`
- `PATCH /api/admin/vk/:id`

---

## 6️⃣ IMPLEMENTAČNÉ POZNÁMKY

### Frontend komponenty

```typescript
// Validation Status Card
<ValidationStatusCard vk={vk} />

// Tab Container
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">📋 Prehľad</TabsTrigger>
    <TabsTrigger value="candidates">👥 Uchádzači</TabsTrigger>
    <TabsTrigger value="tests">📝 Testy</TabsTrigger>
    <TabsTrigger value="commission">👨‍⚖️ Komisia</TabsTrigger>
    <TabsTrigger value="evaluation">⚙️ Hodnotenie</TabsTrigger>
    <TabsTrigger value="results">📊 Výsledky</TabsTrigger>
    <TabsTrigger value="documents">📄 Dokumenty</TabsTrigger>
  </TabsList>

  <TabsContent value="overview">
    <OverviewTab vk={vk} />
  </TabsContent>

  {/* ... ostatné taby */}
</Tabs>
```

### Utility funkcie

```typescript
type ValidationIssue = {
  type: 'error' | 'warning'
  code: string
  message: string
  action?: string
  actionLink?: string
}

function validateVK(vk: VK): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Gestor
  if (!vk.gestorId) {
    issues.push({
      type: 'error',
      code: 'NO_GESTOR',
      message: 'Gestor nie je priradený',
      action: 'Priradiť',
      actionLink: '#gestor'
    })
  }

  // Testy
  if (vk.assignedTests.length === 0) {
    issues.push({
      type: 'error',
      code: 'NO_TESTS',
      message: 'Žiadne priradené testy',
      action: 'Pridať test',
      actionLink: '#tests'
    })
  }

  // Komisia
  if (!vk.commission) {
    issues.push({
      type: 'error',
      code: 'NO_COMMISSION',
      message: 'Komisia nie je vytvorená',
      action: 'Vytvoriť komisiu',
      actionLink: '#commission'
    })
  } else {
    const memberCount = vk.commission.members.length

    if (memberCount % 2 === 0) {
      issues.push({
        type: 'error',
        code: 'EVEN_COMMISSION',
        message: `Párny počet členov komisie (${memberCount})`,
        action: 'Upraviť',
        actionLink: '#commission'
      })
    }

    if (memberCount < 3) {
      issues.push({
        type: 'error',
        code: 'MIN_COMMISSION',
        message: 'Komisia musí mať aspoň 3 členov',
        action: 'Pridať členov',
        actionLink: '#commission'
      })
    }

    const chairmen = vk.commission.members.filter(m => m.isChairman)
    if (chairmen.length === 0) {
      issues.push({
        type: 'error',
        code: 'NO_CHAIRMAN',
        message: 'Komisia nemá predsedu',
        action: 'Nastaviť predsedu',
        actionLink: '#commission'
      })
    } else if (chairmen.length > 1) {
      issues.push({
        type: 'error',
        code: 'MULTIPLE_CHAIRMEN',
        message: 'Komisia má viac ako jedného predsedu',
        action: 'Opraviť',
        actionLink: '#commission'
      })
    }
  }

  // Uchádzači
  if (vk.candidates.length === 0) {
    issues.push({
      type: 'warning',
      code: 'NO_CANDIDATES',
      message: 'Žiadni uchádzači',
      action: 'Pridať uchádzača',
      actionLink: '#candidates'
    })
  }

  return issues
}

function canTransitionTo(vk: VK, targetStatus: VKStatus): boolean {
  const issues = validateVK(vk)
  const blockers = issues.filter(i => i.type === 'error')

  if (targetStatus === 'CAKA_NA_TESTY') {
    return blockers.length === 0
  }

  if (targetStatus === 'TESTOVANIE') {
    return blockers.length === 0
  }

  // ... ďalšie statusy

  return true
}

function getReadinessIndicator(vk: VK): {
  status: 'ready' | 'warning' | 'error'
  count: number
  label: string
} {
  const issues = validateVK(vk)
  const errors = issues.filter(i => i.type === 'error')
  const warnings = issues.filter(i => i.type === 'warning')

  if (errors.length > 0) {
    return {
      status: 'error',
      count: errors.length,
      label: `${errors.length} ${errors.length === 1 ? 'problém' : 'problémy'}`
    }
  }

  if (warnings.length > 0) {
    return {
      status: 'warning',
      count: warnings.length,
      label: `${warnings.length} ${warnings.length === 1 ? 'varovanie' : 'varovania'}`
    }
  }

  return {
    status: 'ready',
    count: 0,
    label: 'Pripravené'
  }
}
```

---

**Koniec špecifikácie**
