# Obrazovky pre člena komisie – Návrh a špecifikácia

**Dátum:** 2025-10-11
**Stav:** Návrh

---

## Kontext a účel

Člen výberovej komisie (rola **KOMISIA**) sa prihlási do systému, aby:
1. Zobrazil **zoznam VK**, kde je členom komisie
2. Zobrazil **detail VK** s prehľadom uchádzačov
3. Prezrel **podklady uchádzača** (CV, certifikáty, výsledky testov)
4. **Vyhodnotil uchádzača** v osobnom pohovore pomocou batérie otázok
5. Zobrazil **konečné výsledky a poradie** uchádzačov

Komisie sa skladá z **nepárneho počtu členov** (min. 2 členovia + 1 predseda).
**Predseda komisie** má špeciálnu funkciu – finalizuje hodnotenie.

---

## Kľúčové požiadavky zo zadania

### Z PDF zadania (PRÍLOHA Hackathon VK Smart):

**Rola Komisia:**
- Prihlásenie: meno/heslo **bez 2FA**
- V prostredí budú primárne prezerať podklady z úložiska a hodnotiť ústnu časť priradením počtu bodov
- Komisia musí byť minimálne 2 členovia, horná hranica nie je určená, spolu s predsedom musí byť **vždy nepárny počet**
- Je potrebné odlíšiť členov a **predsedu komisie**

**Hodnotiaci modul:**
- V prostredí člena komisie by mala byť vidieť **hlavička VK** (identifikátor, organizačný útvar, funkcia, druh ŠS, dátum)
- **Poradie jednotlivých uchádzačov** prihlásených do VK po testovaní
- Po rozkliku konkrétneho uchádzača sa komisii otvoria **podklady z úložiska**: CV, motivačný list, certifikáty, čestné vyhlásenia, odporúčania, hodnotenia a **všetky výsledky písomných testov**

**Hodnotené schopnosti a vlastnosti:**
- Spolu je 10 schopností a osobnostných vlastností
- **Neoverujú sa všetky**, overujú sa len tie, ktoré sú zadefinované vo VK – ich rôzne kombinácie
- Admin pri príprave VK navolí kombinácie (min. 3, max. 10 vlastností)

**Zoznam 10 schopností a vlastností:**
1. Sebadôvera
2. Svedomitosť a spoľahlivosť
3. Samostatnosť
4. Motivácia
5. Adaptabilita a flexibilita
6. Schopnosť pracovať pod tlakom
7. Rozhodovacia schopnosť
8. Komunikačné zručnosti
9. Analytické, koncepčné a strategické myslenie
10. Riadiace schopnosti

**Batéria otázok:**
- Pre jednoduchšie kladenie otázok existuje batéria pomocných otázok
- Pri zadefinovaní hodnotených vlastností by sa mohla členovi komisie **vyrolovať batéria otázok**
- **Pozn:** Tieto otázky sú už implementované v `QuestionCategory` a `QuestionItem` modeloch

**Bodovanie:**
- Po ukončení hodnotiaceho rozhovoru pri každej overovanej vlastnosti je **stupnica hodnotenia 1-5**
- **Podmienka:** Pri hodnotení jednej vlastnosti sa členovia komisie **nesmú odlišovať o viac ako 2 body**
  - ❌ Nemôže dať jeden člen 2 body a druhý 5 bodov
  - Aplikácia by ich na danú diskrepanciu mohla upozorniť (napr. červenou farbou)
  - Musia diskutovať a dohodnúť sa
- Člen komisie bude môcť tabuľku modifikovať, **až kým neodošle adminovi finálne hodnotenie**
- Po kliknutí na **"Uzavrieť"** už nebude môcť zmeniť hodnotenie

**Výstupy:**
- Po dodržaní podmienok a zhode komisie sa hodnotenie za každého člena komisie uloží vo formáte **PDF** ako „Hodnotiaci hárok za každého člena komisie zvlášť"
- PDF dokument bude obsahovať hlavičku – identifikátor VK, organizačný útvar, obsadzovanú funkciu, druh ŠS, dátum VK, meno a priezvisko uchádzača
- Po stlačení **"Vyhodnotiť"** sa všetkým členom aj adminovi zobrazí tabuľka s uvedením počtu bodov, úspešnosťou a poradím jednotlivých uchádzačov

---

## Architektúra a routing

### Multi-role přístup
- Člen komisie môže byť **členom viacerých komisií** naraz (rôzne VK)
- V zozname VK vidí len tie, kde je členom komisie
- Filtrovanie na backendu: `WHERE vk.id IN (SELECT vkId FROM CommissionMember WHERE userId = user.id)`

### Routing štruktúra
```
/commission                           → Dashboard člena komisie
/commission/vk                        → Zoznam VK kde je členom
/commission/vk/[vkId]                 → Detail VK + zoznam uchádzačov
/commission/vk/[vkId]/candidate/[id]  → Detail uchádzača + hodnotenie
```

---

## Obrazovka 1: Dashboard člena komisie

**Route:** `/commission`

**Účel:** Prehľad VK kde je člen komisie, stav hodnotení, notifikácie

```
┌──────────────────────────────────────────────────────────────────────┐
│  Dashboard člena komisie              Prihlásený: Ing. Horváth Jana  │
├──────────────────────────────────────────────────────────────────────┤
│  Moje výberové konania                                               │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Aktívne VK (3)                                                │  │
│  ├────────────────────────────────────────────────────────────────┤  │
│  │  VK/2025/1234 │ Hlavný štátny radca │ 24.7.2025 │ [Detail]    │  │
│  │  Status: Hodnotenie prebieha                                   │  │
│  │  • Vaše hodnotenie: 5/8 uchádzačov                             │  │
│  │  • Finalizované: Nie (čaká sa na predsedu)                     │  │
│  ├────────────────────────────────────────────────────────────────┤  │
│  │  VK/2025/1567 │ Vedúci oddelenia │ 1.8.2025 │ [Detail]        │  │
│  │  Status: Čaká na začiatok hodnotenia                           │  │
│  │  • Písomné testy: Dokončené (15 uchádzačov)                    │  │
│  │  • Osobný pohovor: 5.8.2025 o 9:00                             │  │
│  ├────────────────────────────────────────────────────────────────┤  │
│  │  VK/2025/1890 │ Odborný referent │ 10.8.2025 │ [Detail]       │  │
│  │  Status: Príprava                                              │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  Dokončené VK (12)                                    [Zobraziť]      │
└──────────────────────────────────────────────────────────────────────┘
```

### Funkcionality:
- **Prehľad VK**: Kde je člen komisie (aktívne + dokončené)
- **Stav hodnotení**: Koľko uchádzačov už vyhodnotil
- **Notifikácie**: Upozornenia na blížiace sa termíny hodnotení
- **Quick actions**: Priamy link na detail VK

---

## Obrazovka 2: Zoznam VK

**Route:** `/commission/vk`

**Účel:** Kompletný zoznam všetkých VK kde je člen komisie, filtrovanie, vyhľadávanie

```
┌──────────────────────────────────────────────────────────────────────┐
│  Moje výberové konania                                               │
├──────────────────────────────────────────────────────────────────────┤
│  Hľadať: [______________]  │  Status: [Všetky v]  │  Rok: [2025 v]  │
├──────────────────────────────────────────────────────────────────────┤
│  ID VK        │ Pozícia              │ Dátum     │ Status          │ Akcie │
├───────────────┼──────────────────────┼───────────┼─────────────────┼───────┤
│ VK/2025/1234  │ Hlavný štátny radca  │ 24.7.2025 │ 🟡 Hodnotenie  │[Detail]│
│               │ MZVaEZ – OKP         │           │ 5/8 ohodnotených│       │
├───────────────┼──────────────────────┼───────────┼─────────────────┼───────┤
│ VK/2025/1567  │ Vedúci oddelenia     │ 1.8.2025  │ 🔵 Príprava    │[Detail]│
│               │ MV – Personalistika  │           │ Čaká sa na testy│       │
├───────────────┼──────────────────────┼───────────┼─────────────────┼───────┤
│ VK/2025/1890  │ Odborný referent     │ 10.8.2025 │ ✅ Dokončené   │[Detail]│
│               │ MZ – Zdravotníctvo   │           │ Finalizované   │       │
└──────────────────────────────────────────────────────────────────────┘
Stránka 1 z 3                                              [< 1 2 3 >]
```

### Funkcionality:
- **Filtrovanie** podľa statusu (Príprava, Hodnotenie, Dokončené)
- **Vyhľadávanie** podľa ID VK, pozície, organizačného útvaru
- **Indikátory statusu**: Farebné označenie stavu VK
- **Progres hodnotení**: Koľko uchádzačov už vyhodnotil

---

## Obrazovka 3: Detail VK + Zoznam uchádzačov

**Route:** `/commission/vk/[vkId]`

**Účel:** Detail VK, hlavička, informácie o VK, zoznam uchádzačov na hodnotenie

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Späť na zoznam VK                                                 │
├──────────────────────────────────────────────────────────────────────┤
│  VÝBEROVÉ KONANIE VK/2025/1234                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Identifikátor: VK/2025/1234                                   │  │
│  │  Druh VK: Širšie vnútorné výberové konanie                     │  │
│  │  Organizačný útvar: Odbor implementácie OKP                    │  │
│  │  Odbor štátnej služby: 1.03 – Medzinárodná spolupráca         │  │
│  │  Obsadzovaná funkcia: Hlavný štátny radca                      │  │
│  │  Druh štátnej služby: Stála štátna služba                      │  │
│  │  Dátum VK: 24. júla 2025                                       │  │
│  │  Počet obsadzovaných miest: 1                                  │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  Komisia                                                              │
│  • Predseda: Ing. Novák Peter (vy ste predseda) ⭐                    │
│  • Členovia: Ing. Horváth Jana, Mgr. Kováč Martin                    │
│                                                                       │
│  Hodnotené schopnosti (5):                                            │
│  1. Sebadôvera                                                        │
│  2. Komunikačné zručnosti                                             │
│  3. Analytické, koncepčné a strategické myslenie                     │
│  4. Samostatnosť                                                      │
│  5. Schopnosť pracovať pod tlakom                                     │
├──────────────────────────────────────────────────────────────────────┤
│  UCHÁDZAČI (8)                                                       │
│  Tab: [Všetci (8)] [Na hodnotenie (3)] [Ohodnotení (5)] [Poradie]   │
├──────────────────────────────────────────────────────────────────────┤
│  #│ Meno a priezvisko      │ CIS ID     │ Testy │ Hodnotenie │ Akcie│
├──┼────────────────────────┼────────────┼───────┼────────────┼──────┤
│ 1│ Mgr. Anna Vrbová       │ 1234567890 │ ✅ 18b│ ⏳ Čaká   │[Hodnotiť]│
│ 2│ Ing. Ján Molnár        │ 2345678901 │ ✅ 22b│ ✅ Hotovo  │[Zobraziť]│
│ 3│ PhDr. Eva Slováková    │ 3456789012 │ ✅ 15b│ ⏳ Čaká   │[Hodnotiť]│
│ 4│ Bc. Peter Horný        │ 4567890123 │ ✅ 20b│ ✅ Hotovo  │[Zobraziť]│
│ 5│ Mgr. Katarína Nováková │ 5678901234 │ ✅ 19b│ ⚠️  Rozpor │[Upraviť] │
│  │                        │            │       │ (2b rozdiel)│         │
│ ...│                                                                 │
└──────────────────────────────────────────────────────────────────────┘
```

### Funkcionality:
- **Hlavička VK**: Všetky dôležité informácie o VK (identifikátor, pozícia, dátum, atď.)
- **Informácie o komisii**: Zoznam členov, označenie predsedu
- **Hodnotené schopnosti**: Zoznam vlastností ktoré sa budú hodnotiť (definoval admin)
- **Zoznam uchádzačov**: S filtrom podľa stavu hodnotenia
- **Indikátory**:
  - ✅ Hotovo – člen komisie už ohodnotil
  - ⏳ Čaká – ešte neohodnotil
  - ⚠️ Rozpor – rozdiel v bodoch medzi členmi komisie > 2 body
- **Akcie**:
  - **[Hodnotiť]** – ak ešte neohodnotil
  - **[Zobraziť]** – ak už ohodnotil (read-only)
  - **[Upraviť]** – ak ohodnotil, ale ešte neuzavrel (pred finalizáciou)

---

## Obrazovka 4: Detail uchádzača + Podklady

**Route:** `/commission/vk/[vkId]/candidate/[id]`

**Účel:** Zobrazenie podkladov uchádzača (CV, certifikáty, výsledky testov), hodnotenie

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Späť na zoznam uchádzačov   VK/2025/1234 – Mgr. Anna Vrbová      │
├──────────────────────────────────────────────────────────────────────┤
│  Tab: [Podklady] [Výsledky testov] [Hodnotenie]                     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  === TAB: Podklady ===                                               │
│                                                                       │
│  Osobné údaje                                                        │
│  • Meno: Mgr. Anna Vrbová                                            │
│  • CIS identifikátor: 1234567890                                     │
│  • Email: anna.vrbova@example.com                                    │
│  • Telefón: +421 123 456 789                                         │
│                                                                       │
│  Priložené dokumenty                                                 │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  📄 CV.pdf                        (152 KB) [Stiahnuť] [Otvoriť]│  │
│  │  📄 Motivačný list.pdf            (45 KB)  [Stiahnuť] [Otvoriť]│  │
│  │  📄 Diplom - Mgr.pdf              (230 KB) [Stiahnuť] [Otvoriť]│  │
│  │  📄 Certifikát - Anglický jazyk.pdf (180 KB) [Stiahnuť]        │  │
│  │  📄 Odporúčanie - MZVaEZ.pdf      (95 KB)  [Stiahnuť] [Otvoriť]│  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  === TAB: Výsledky testov ===                                        │
│                                                                       │
│  Odborný test (Level 1)                                              │
│  • Výsledok: 18/30 bodov (60%)                                       │
│  • Minimum: 18 bodov ✅ ÚSPEŠNÝ                                       │
│  • Dátum: 20.7.2025 10:15                                            │
│  • Čas vypracovania: 28 min (z 30 min)                               │
│  [Zobraziť detaily testu]                                            │
│                                                                       │
│  Test cudzieho jazyka - Angličtina (Level 4)                         │
│  • Úroveň: B2                                                        │
│  • Výsledok: 16/20 bodov (80%)                                       │
│  • Minimum: 14 bodov ✅ ÚSPEŠNÝ                                       │
│  • Dátum: 20.7.2025 11:00                                            │
│  [Zobraziť detaily testu]                                            │
│                                                                       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  === TAB: Hodnotenie ===                                             │
│                                                                       │
│  [Prejsť na hodnotenie →]                                            │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### Funkcionality:
- **Taby**: Podklady, Výsledky testov, Hodnotenie
- **Podklady**: Zoznam všetkých dokumentov (CV, certifikáty, atď.)
- **Výsledky testov**: Detailné výsledky všetkých písomných testov
- **Akcie**: Stiahnuť / Otvoriť PDF v novom okne

---

## Obrazovka 5: Hodnotenie uchádzača

**Route:** `/commission/vk/[vkId]/candidate/[id]?tab=hodnotenie`

**Účel:** Hodnotenie uchádzača v osobnom pohovore pomocou batérie otázok

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Späť na detail uchádzača                                          │
├──────────────────────────────────────────────────────────────────────┤
│  HODNOTENIE OSOBNÉHO POHOVORU                                        │
│  VK/2025/1234 – Mgr. Anna Vrbová                                     │
│  Dátum: 24. júla 2025                                                │
├──────────────────────────────────────────────────────────────────────┤
│  Člen komisie: Ing. Horváth Jana                                     │
│  Stav: ⏳ Pracujem na hodnotení                                       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. Sebadôvera                            [? Zobraziť pomocné otázky]│
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Pomocné otázky:                                               │  │
│  │  • Keď máte možnosť vybrať si úlohu, aké kritériá použijete?   │  │
│  │  • Aké úlohy sú pre Vás výzvou?                                │  │
│  │  • Ako ste využili, keď sa Vám niečo nepodarilo?               │  │
│  │  • Ako postupujete, keď robíte zložité veci prvýkrát?          │  │
│  │  • Popíšte situáciu, kedy ste riskovali...                     │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  Vaše hodnotenie:  ○ 1   ○ 2   ⦿ 3   ○ 4   ○ 5                      │
│                    (veľmi slabá)        (vynikajúca)                 │
│                                                                       │
│  Hodnotenia ostatných členov:                                        │
│  • Ing. Novák Peter (predseda): 3 body                               │
│  • Mgr. Kováč Martin: ⏳ (ešte neohodnotil)                          │
│                                                                       │
│  Poznámka (nepovinná):                                               │
│  [_______________________________________________]                    │
│                                                                       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  2. Komunikačné zručnosti                 [? Zobraziť pomocné otázky]│
│                                                                       │
│  Vaše hodnotenie:  ○ 1   ○ 2   ○ 3   ⦿ 4   ○ 5                      │
│                                                                       │
│  Hodnotenia ostatných členov:                                        │
│  • Ing. Novák Peter (predseda): 5 body ⚠️ ROZDIEL 2 BODY!            │
│  • Mgr. Kováč Martin: 4 body                                         │
│                                                                       │
│  ⚠️ UPOZORNENIE: Váš rozdiel s predsedom je 2 body (maximum).       │
│     Zvážte úpravu hodnotenia alebo diskusiu s komisiou.              │
│                                                                       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  3. Analytické, koncepčné a strategické myslenie                     │
│  ...                                                                 │
│                                                                       │
│  4. Samostatnosť                                                     │
│  ...                                                                 │
│                                                                       │
│  5. Schopnosť pracovať pod tlakom                                    │
│  ...                                                                 │
│                                                                       │
├──────────────────────────────────────────────────────────────────────┤
│  SÚHRN                                                               │
│  • Celkový počet bodov: 18/25 (72%)                                  │
│  • Minimum na úspešné absolvovanie: 15 bodov (60%)                   │
│  • Výsledok: ✅ VYHOVUJE                                             │
│                                                                       │
│  [ Uložiť pracovnú verziu ]  [ Uzavrieť a odoslať hodnotenie ]      │
│                                                                       │
│  ⚠️ Po uzavretí už nebudete môcť meniť hodnotenie!                   │
└──────────────────────────────────────────────────────────────────────┘
```

### Funkcionality:
- **Batéria otázok**: Pre každú hodnotenú vlastnosť sú k dispozícii pomocné otázky (kliknutím rozbaliteľné)
- **Bodovanie**: Radio buttons 1-5 pre každú vlastnosť
- **Real-time validácia**: Upozornenie ak rozdiel s iným členom > 2 body
- **Viditeľnosť hodnotení ostatných**: Po zadaní vlastného hodnotenia vidí hodnotenia ostatných členov
- **Poznámky**: Možnosť pridať text poznámky k hodnoteniu
- **Súhrn**: Automatický prepočet celkového počtu bodov a vyhodnotenie
- **Akcie**:
  - **Uložiť pracovnú verziu** – možnosť uložiť rozpracované hodnotenie a vrátiť sa k nemu neskôr
  - **Uzavrieť a odoslať** – finálne odoslanie, po ktorom už nie je možné meniť

### Stavy:
- ⏳ **Pracujem na hodnotení** – rozpracované
- ✅ **Uzavreté** – finálne odoslané, read-only
- ⚠️ **Rozpor** – rozdiel s iným členom > 2 body

---

## Obrazovka 6: Finalizácia hodnotenia (len predseda)

**Route:** `/commission/vk/[vkId]/finalize`

**Účel:** Predseda komisie finalizuje hodnotenie, generuje PDF dokumenty

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Späť na detail VK                                                 │
├──────────────────────────────────────────────────────────────────────┤
│  FINALIZÁCIA HODNOTENIA                                              │
│  VK/2025/1234 – Hlavný štátny radca                                  │
│  Predseda komisie: Ing. Novák Peter ⭐                                │
├──────────────────────────────────────────────────────────────────────┤
│  Stav hodnotení:                                                     │
│  • Celkový počet uchádzačov: 8                                       │
│  • Uzavreté hodnotenia (všetci členovia): 8/8 ✅                     │
│  • Hodnotenia s rozpormi: 1 ⚠️                                       │
│                                                                       │
│  ⚠️ Uchádzači s rozpormi (> 2 body):                                 │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Mgr. Katarína Nováková (CIS: 5678901234)                       │  │
│  │ • Komunikačné zručnosti:                                       │  │
│  │   - Ing. Novák Peter: 5 bodov                                  │  │
│  │   - Ing. Horváth Jana: 2 body (rozdiel 3!)                     │  │
│  │   - Mgr. Kováč Martin: 4 body                                  │  │
│  │ [Požiadať o revíziu] [Ignorovať a pokračovať]                  │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
├──────────────────────────────────────────────────────────────────────┤
│  PORADIE UCHÁDZAČOV (zostupne podľa bodov)                           │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ #│ Uchádzač              │ Testy│ Pohovor│ Spolu│ Vyhovuje│     │  │
│  ├─┼───────────────────────┼──────┼────────┼──────┼─────────┼─────┤  │
│  │1│ Ing. Ján Molnár       │ 22b  │ 23b    │ 45b  │ ✅ Áno  │Vybraný│
│  │2│ Bc. Peter Horný       │ 20b  │ 21b    │ 41b  │ ✅ Áno  │      │  │
│  │3│ Mgr. Katarína Nováková│ 19b  │ 20b    │ 39b  │ ✅ Áno  │      │  │
│  │4│ Mgr. Anna Vrbová      │ 18b  │ 18b    │ 36b  │ ✅ Áno  │      │  │
│  │5│ PhDr. Eva Slováková   │ 15b  │ 19b    │ 34b  │ ✅ Áno  │      │  │
│  │6│ ...                   │      │        │      │         │      │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  Počet obsadzovaných miest: 1                                        │
│  Vybraný uchádzač: Ing. Ján Molnár (45 bodov)                        │
│                                                                       │
├──────────────────────────────────────────────────────────────────────┤
│  GENEROVANIE DOKUMENTÁCIE                                            │
│  Systém vygeneruje:                                                  │
│  ☐ Hodnotiace hárky členov komisie (PDF) – 3 dokumenty               │
│  ☐ Sumárny hodnotiaci hárok (PDF)                                    │
│  ☐ Záverečné hodnotenie (PDF)                                        │
│  ☐ Zápisnica z VK (PDF)                                              │
│                                                                       │
│  Dokumenty budú odoslané na:                                         │
│  • Email admina: admin@example.com                                   │
│  • Uložené do interného úložiska VK                                  │
│                                                                       │
│  [ Zrušiť ]                        [ ✅ Finalizovať výberové konanie]│
│                                                                       │
│  ⚠️ Po finalizácii už nebude možné meniť hodnotenia!                 │
└──────────────────────────────────────────────────────────────────────┘
```

### Funkcionality (len pre predsedu):
- **Prehľad hodnotení**: Stav dokončenosti hodnotení všetkých členov
- **Detekcia rozporov**: Automatická kontrola rozdielov > 2 body
- **Poradie uchádzačov**: Zoradené zostupne podľa celkového počtu bodov
- **Označenie vybraného**: Automatické označenie podľa počtu miest
- **Generovanie PDF**: Všetky požadované dokumenty
- **Finalizácia**: Uzamknutie hodnotení a generovanie dokumentácie

---

## Technické požiadavky

### Backend API

**Endpointy pre komisiu:**
```
GET  /api/commission/vk                         → Zoznam VK kde je člen
GET  /api/commission/vk/[vkId]                  → Detail VK + uchádzači
GET  /api/commission/vk/[vkId]/candidate/[id]   → Detail uchádzača
GET  /api/commission/vk/[vkId]/candidate/[id]/attachments  → Podklady
GET  /api/commission/vk/[vkId]/candidate/[id]/test-results → Výsledky testov

POST /api/commission/vk/[vkId]/evaluations      → Vytvorenie/update hodnotenia
PUT  /api/commission/vk/[vkId]/evaluations/[id] → Update hodnotenia
POST /api/commission/vk/[vkId]/finalize         → Finalizácia (len predseda)

GET  /api/admin/question-categories             → Batéria otázok (read-only)
GET  /api/admin/question-categories/[id]        → Detail kategórie s otázkami
```

### Databázové modely

**Už existujúce (podľa schema.prisma):**
```prisma
model Commission {
  id         String   @id @default(cuid())
  vkId       String   @unique
  vk         VyberoveKonanie @relation(...)
  chairmanId String?
  createdAt  DateTime @default(now())
  members    CommissionMember[]
}

model CommissionMember {
  id           String   @id @default(cuid())
  commissionId String
  commission   Commission @relation(...)
  userId       String
  user         User     @relation(...)
  isChairman   Boolean  @default(false)
  createdAt    DateTime @default(now())
  evaluations  Evaluation[]
}

model Evaluation {
  id         String   @id @default(cuid())
  candidateId String
  candidate   Candidate @relation(...)
  memberId    String
  member      CommissionMember @relation(...)
  userId      String?
  user        User?    @relation(...)

  // Hodnotenia jednotlivých vlastností (JSON)
  scores     Json     // { "Sebadôvera": 3, "Komunikačné zručnosti": 4, ... }
  notes      String?
  totalScore Float?

  status     EvaluationStatus @default(DRAFT)
  finalizedAt DateTime?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

enum EvaluationStatus {
  DRAFT       // Pracovná verzia
  SUBMITTED   // Odoslaná (uzavretá)
  FINALIZED   // Finalizovaná predsedom
}

model EvaluationConfig {
  id              String   @id @default(cuid())
  vkId            String   @unique
  vk              VyberoveKonanie @relation(...)
  evaluatedTraits String[] // Zoznam hodnotených vlastností
  questionBattery Json     // Mapovanie vlastností na otázky
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Autorizácia

```typescript
// Middleware / Auth guard
const isCommissionMember = async (userId: string, vkId: string) => {
  const member = await prisma.commissionMember.findFirst({
    where: {
      userId,
      commission: { vkId }
    }
  })
  return !!member
}

const isCommissionChairman = async (userId: string, vkId: string) => {
  const member = await prisma.commissionMember.findFirst({
    where: {
      userId,
      commission: { vkId },
      isChairman: true
    }
  })
  return !!member
}
```

### Validácia rozdielov v bodoch

```typescript
const validateEvaluationScores = async (
  candidateId: string,
  memberId: string,
  scores: Record<string, number>
) => {
  // Získaj všetky hodnotenia ostatných členov pre tohto uchádzača
  const otherEvaluations = await prisma.evaluation.findMany({
    where: {
      candidateId,
      memberId: { not: memberId },
      status: { in: ['SUBMITTED', 'FINALIZED'] }
    }
  })

  const discrepancies: Array<{
    trait: string
    yourScore: number
    otherMemberScore: number
    difference: number
    memberName: string
  }> = []

  // Pre každú vlastnosť kontroluj rozdiel
  for (const [trait, yourScore] of Object.entries(scores)) {
    for (const other of otherEvaluations) {
      const otherScores = other.scores as Record<string, number>
      const otherScore = otherScores[trait]

      if (otherScore !== undefined) {
        const difference = Math.abs(yourScore - otherScore)
        if (difference > 2) {
          discrepancies.push({
            trait,
            yourScore,
            otherMemberScore: otherScore,
            difference,
            memberName: other.member.user.name
          })
        }
      }
    }
  }

  return discrepancies
}
```

---

## UX/UI poznámky

### Responzivita
- Desktop first (komisie budú hodnotiť primárne na počítačoch)
- Tablet support (pre prezretie podkladov)
- Mobile – obmedzená funkcionalita (len prehľad, nie hodnotenie)

### Farby a indikátory
- **Zelená (✅)**: Dokončené, úspešné
- **Žltá (⏳)**: V procese, čaká
- **Červená (⚠️)**: Upozornenie, rozpor, chyba
- **Modrá (🔵)**: Informácia, príprava

### Toast notifikácie
- **Úspech**: "Hodnotenie bolo uložené"
- **Upozornenie**: "Rozdiel v bodoch s Ing. Novákom je 3 body (maximum 2)"
- **Error**: "Chyba pri ukladaní hodnotenia"
- **Info**: "Všetci členovia komisie už uzavreli hodnotenia"

### Accessibility
- ARIA labels pre screen readers
- Keyboard navigation (Tab, Enter, Escape)
- Focus management (zvýraznenie aktívneho elementu)
- Kontrastné farby (WCAG AA)

---

## E2E testy

**Minimálne požadované testy:**

```typescript
// tests/e2e/commission/dashboard.spec.ts
test('should display list of VK where user is commission member')
test('should show evaluation progress for each VK')

// tests/e2e/commission/vk-detail.spec.ts
test('should display VK header and commission info')
test('should display list of candidates')
test('should show evaluation status for each candidate')

// tests/e2e/commission/candidate-detail.spec.ts
test('should display candidate attachments')
test('should display test results')
test('should navigate to evaluation tab')

// tests/e2e/commission/evaluation.spec.ts
test('should display question battery for each trait')
test('should save draft evaluation')
test('should validate score discrepancies > 2 points')
test('should submit final evaluation')
test('should prevent editing after submission')

// tests/e2e/commission/finalize.spec.ts (chairman only)
test('should display evaluation summary')
test('should detect score discrepancies')
test('should finalize VK and generate PDFs')
test('should prevent finalization if evaluations incomplete')
```

---

## Implementačný plán

### Fáza 1: Backend (3-4 hodiny)
1. Pridať `Evaluation` model do Prisma (ak ešte neexistuje)
2. Vytvoriť API endpointy pre komisiu
3. Implementovať validáciu rozdielov v bodoch
4. Backend testy (Vitest)

### Fáza 2: Frontend - Dashboard a zoznamy (2-3 hodiny)
1. `/commission` – Dashboard
2. `/commission/vk` – Zoznam VK
3. `/commission/vk/[vkId]` – Detail VK + uchádzači

### Fáza 3: Frontend - Hodnotenie (4-5 hodín)
1. `/commission/vk/[vkId]/candidate/[id]` – Detail uchádzača
2. Tab "Hodnotenie" – formulár s batériou otázok
3. Real-time validácia rozporov
4. Uloženie draft / finálne odoslanie

### Fáza 4: Frontend - Finalizácia (2-3 hodiny)
1. `/commission/vk/[vkId]/finalize` – len pre predsedu
2. Prehľad hodnotení
3. Generovanie PDF dokumentov
4. Finalizácia VK

### Fáza 5: E2E testy (3-4 hodiny)
1. Testy pre dashboard a zoznamy
2. Testy pre hodnotenie
3. Testy pre finalizáciu

**Celkový odhad:** 14-19 hodín

---

## Otvorené otázky

1. **Prístup k batérii otázok:**
   - Majú členovia komisie pristup len k otázkam pre dané VK, alebo k celej databáze?
   - **Návrh:** Read-only prístup len k otázkam relevantným pre dané VK (podľa `EvaluationConfig`)

2. **Notifikácie:**
   - Majú byť email notifikácie pre členov komisie? (napr. "Začiatok hodnotenia o 2 dni")
   - **Návrh:** Áno, základné notifikácie (7 dní pred, 1 deň pred, deň D)

3. **Offline režim:**
   - Potrebujú členovia komisie pracovať offline? (napr. offline draft)
   - **Návrh:** Nie, vždy online (WebSocket pre real-time validáciu)

4. **Export hodnotení:**
   - Potrebujú členovia komisie export vlastného hodnotenia? (PDF)
   - **Návrh:** Áno, tlačidlo "Export môjho hodnotenia" (PDF)

5. **Časový limit:**
   - Je časový limit na uzavretie hodnotení?
   - **Návrh:** Nie, ale predseda môže poslať pripomienku členom

6. **Revízia hodnotení:**
   - Môže predseda požiadať o revíziu hodnotenia?
   - **Návrh:** Áno, tlačidlo "Požiadať o revíziu" → člen dostane notifikáciu, hodnotenie sa vráti do DRAFT stavu

---

## Záver

Tento návrh pokrýva všetky požiadavky zo zadania pre **člena výberovej komisie**:

✅ Prihlásenie (meno/heslo bez 2FA)
✅ Zoznam VK kde je členom komisie
✅ Detail VK s hlavičkou a hodnotenými vlastnosťami
✅ Prehľad uchádzačov a ich podkladov
✅ Výsledky písomných testov
✅ Hodnotenie pomocou batérie otázok
✅ Bodovanie 1-5 s validáciou rozdielov (max 2 body)
✅ Real-time zobrazenie hodnotení ostatných členov
✅ Finalizácia (len predseda) s generovaním PDF
✅ Nepárny počet členov komisie
✅ Rozlíšenie predsedu a členov

**Ďalší krok:** Implementácia podľa tohto návrhu s použitím existujúcich pattern-ov z projektu (DataTable, ConfirmModal, TodoWrite, backend testy, E2E testy).
