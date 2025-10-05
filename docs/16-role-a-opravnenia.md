# Role a oprávnenia

Tento dokument definuje všetky role v systéme a ich oprávnenia.

---

## Prehľad rolí

| Rola | Typ účtu | Prístup | Popis |
|------|----------|---------|-------|
| **SUPERADMIN** | Trvalý | Celý systém | Správca celého systému, spravuje rezorty a adminov |
| **ADMIN** | Trvalý | Jeden alebo viac rezortov | Správca rezortu, vytvára VK a spravuje používateľov v rámci svojho rezortu |
| **GESTOR** | Trvalý | Priradené VK | Vytvára testy, spravuje uchádzačov, administruje konkrétne VK |
| **KOMISIA** | Trvalý | Priradené VK | Hodnotí uchádzačov, účastní sa komisie |
| **UCHÁDZAČ** | Dočasný | Jedno VK | Zúčastňuje sa výberového konania, vypĺňa testy |

---

## Multi-tenancy koncept

### Rezort (Institution)

**Definícia:** Organizačná jednotka (ministerstvo, úrad), ktorá organizuje výberové konania.

**Príklady:**
- Ministerstvo zahraničných vecí a európskych záležitostí (MZVaEZ)
- Ministerstvo vnútra (MV)
- Ministerstvo zdravotníctva (MZ)
- Úrad vlády SR

**Vlastnosti:**
- Každý **Admin**, **Gestor** a **Komisia** je priradený k jednému alebo viacerým rezortom
- Každé **VK** patrí k jednému rezortu
- **Gestor** a **Komisia** SÚ viazaní na rezort (admin ich vytvára pre svoj rezort)
- Admin vidí len Gestorov/Komisiu svojho rezortu
- **Superadmin** vidí všetky rezorty

---

## 1. SUPERADMIN

### Oprávnenia

#### Správa rezortov
- ✅ Vytvoriť nový rezort
- ✅ Upraviť existujúci rezort (názov, kód, stav)
- ✅ Deaktivovať/Aktivovať rezort
- ✅ Zobraziť zoznam všetkých rezortov
- ✅ Zobraziť štatistiky rezortu (počet VK, počet adminov)

#### Správa adminov
- ✅ Vytvoriť nového admina
- ✅ Priradiť/Odstrániť admina k rezortu (M:N)
- ✅ Upraviť údaje admina
- ✅ Deaktivovať/Vymazať admina
- ✅ Zobraziť zoznam všetkých adminov (všetky rezorty)
- ✅ Reset hesla admina

#### Prehľad VK
- ✅ Zobraziť zoznam všetkých VK (všetky rezorty)
- ✅ Filtrovať VK podľa rezortu
- ✅ Zobraziť detail VK (read-only)
- ❌ Nevytvára VK (to robí Admin)
- ❌ Neupravu VK

#### Audit a reporting
- ✅ Zobraziť audit log (všetky akcie, všetky rezorty)
- ✅ Exportovať dáta (všetky rezorty)
- ✅ Systémové nastavenia (globálne)

### Obmedzenia
- ❌ Nemôže vytvárať VK (to je úloha Admina)
- ❌ Nemôže priamo upravovať VK
- ❌ Nemôže vytvárať Gestorov/Komisiu (to robí Admin)

### Prístup k obrazovkám

| Obrazovka | Prístup |
|-----------|---------|
| Dashboard | ✅ Superadmin dashboard (štatistiky všetkých rezortov) |
| Správa rezortov | ✅ CRUD |
| Správa adminov | ✅ CRUD + priradenie k rezortom |
| Zoznam VK | ✅ Read-only, všetky rezorty |
| Detail VK | ✅ Read-only |
| Správa Gestorov/Komisie | ❌ Nie (to robí Admin) |
| Správa uchádzačov | ❌ Nie |
| Audit log | ✅ Všetky rezorty |

---

## 2. ADMIN

### Oprávnenia

#### Správa VK (len vlastný rezort)
- ✅ Vytvoriť nové VK (automaticky priradené k rezortu admina)
- ✅ Upraviť VK (len VK svojho rezortu)
- ✅ Archivovať VK
- ✅ Zobraziť zoznam VK (len VK svojho rezortu)
- ✅ Zobraziť detail VK
- ✅ Priradiť Gestora k VK
- ✅ Vytvoriť komisiu pre VK
- ✅ Priradiť členov komisie

#### Správa používateľov (len vlastný rezort)
- ✅ Vytvoriť Gestora (priradený k rezortu admina)
- ✅ Vytvoriť člena Komisie (priradený k rezortu admina)
- ✅ Upraviť používateľa (len používateľov svojho rezortu)
- ✅ Deaktivovať/Vymazať používateľa
- ✅ Zobraziť zoznam Gestorov/Komisie (len svojho rezortu)
- ❌ Nemôže vytvárať adminov (to robí Superadmin)
- ❌ Nevidí adminov z iných rezortov

#### Správa uchádzačov
- ✅ Vytvoriť uchádzača pre VK (v rámci svojho VK)
- ✅ Importovať uchádzačov cez CSV
- ✅ Upraviť údaje uchádzača
- ✅ Vymazať uchádzača
- ✅ Zobraziť zoznam uchádzačov (len VK svojho rezortu)

#### Správa testov
- ✅ Schvaľovať testy vytvorené Gestorom
- ✅ Zobraziť výsledky testov

#### Audit a reporting
- ✅ Zobraziť audit log (len vlastný rezort)
- ✅ Exportovať dáta (len vlastný rezort)

### Obmedzenia
- ❌ Nemôže vytvárať adminov (len Superadmin)
- ❌ Nevidí VK z iných rezortov
- ❌ Nevidí používateľov (Gestor/Komisia) z iných rezortov
- ❌ Nemôže priradiť Gestora/Komisiu z iného rezortu (len vlastný rezort)
- ❌ Nemôže upravovať nastavenia systému

### Multi-rezort Admin
- Ak je Admin priradený k **viacerým rezortom** (napr. MZ + MŠ):
  - Vidí VK oboch rezortov
  - Môže vytvárať VK pre oba rezorty (pri vytváraní si vyberie rezort)
  - Vidí používateľov oboch rezortov

### Prístup k obrazovkám

| Obrazovka | Prístup |
|-----------|---------|
| Dashboard | ✅ Admin dashboard (štatistiky vlastného rezortu) |
| Vytvorenie VK | ✅ CRUD (len vlastný rezort) |
| Zoznam VK | ✅ Len VK vlastného rezortu |
| Detail VK | ✅ Len VK vlastného rezortu |
| Správa Gestorov/Komisie | ✅ CRUD (len vlastný rezort) |
| Správa uchádzačov | ✅ CRUD (len VK vlastného rezortu) |
| Správa testov | ✅ Schvaľovanie |
| Audit log | ✅ Len vlastný rezort |
| Správa rezortov | ❌ Nie |
| Správa adminov | ❌ Nie |

---

## 3. GESTOR

### Oprávnenia

#### Správa VK (len priradené VK)
- ✅ Zobraziť detail VK (len VK, kde je gestorom)
- ✅ Upraviť základné údaje VK
- ✅ Zmeniť stav VK (PRIPRAVA → TESTOVANIE, atď.)
- ❌ Nemôže vytvoriť VK (to robí Admin)

#### Správa testov
- ✅ Vytvoriť test pre VK
- ✅ Upraviť test (pred schválením)
- ✅ Nahrať súbor s otázkami (CSV/Excel)
- ✅ Zobraziť výsledky testov
- ❌ Nemôže schvaľovať test (to robí Admin)

#### Správa uchádzačov (len priradené VK)
- ✅ Vytvoriť uchádzača
- ✅ Importovať uchádzačov cez CSV
- ✅ Upraviť údaje uchádzača
- ✅ Vymazať uchádzača
- ✅ Zobraziť zoznam uchádzačov (len VK kde je gestorom)
- ✅ Odoslať prihlasovacie údaje uchádzačom

#### Dokumenty
- ✅ Generovať dokumenty (pozvánky, protokoly)
- ✅ Stiahnuť dokumenty

### Obmedzenia
- ❌ Nemôže vytvárať VK
- ❌ Nemôže vytvárať iných používateľov (Admin, Gestor, Komisia)
- ❌ Nevidí VK, kde nie je gestorom
- ❌ Nemôže schvaľovať testy

### Prístup k obrazovkám

| Obrazovka | Prístup |
|-----------|---------|
| Dashboard | ✅ Gestor dashboard (len priradené VK) |
| Zoznam VK | ✅ Len VK kde je gestorom |
| Detail VK | ✅ Len VK kde je gestorom |
| Správa uchádzačov | ✅ Len VK kde je gestorom |
| Správa testov | ✅ Vytváranie testov |
| Generovanie dokumentov | ✅ Áno |
| Správa používateľov | ❌ Nie |
| Audit log | ❌ Nie |

---

## 4. KOMISIA

### Oprávnenia

#### Hodnotenie (len priradené VK)
- ✅ Zobraziť detail VK (len VK, kde je členom komisie)
- ✅ Zobraziť zoznam uchádzačov (len VK kde je členom komisie)
- ✅ Zobraziť výsledky testov uchádzačov
- ✅ Zadať hodnotenie uchádzača
- ✅ Upraviť vlastné hodnotenie (pred finalizáciou)
- ✅ Zobraziť hodnotenia ostatných členov komisie
- ⭐ **Predseda komisie**: Finalizovať hodnotenie (potvrdenie výsledkov)

#### Dokumenty
- ✅ Zobraziť dokumenty VK (read-only)
- ✅ Stiahnuť dokumenty

### Obmedzenia
- ❌ Nemôže vytvárať VK
- ❌ Nemôže vytvárať uchádzačov
- ❌ Nemôže vytvárať testy
- ❌ Nevidí VK, kde nie je členom komisie
- ❌ Nemôže upravovať VK

### Prístup k obrazovkám

| Obrazovka | Prístup |
|-----------|---------|
| Dashboard | ✅ Komisia dashboard (len priradené VK) |
| Zoznam VK | ✅ Len VK kde je členom komisie |
| Detail VK | ✅ Len VK kde je členom komisie (read-only) |
| Zoznam uchádzačov | ✅ Len VK kde je členom komisie |
| Hodnotenie uchádzačov | ✅ Áno |
| Finalizácia hodnotenia | ⭐ Len predseda komisie |
| Správa testov | ❌ Nie |
| Správa používateľov | ❌ Nie |

---

## 5. UCHÁDZAČ

### Oprávnenia

#### Účasť vo VK
- ✅ Zobraziť detail VK (len VK, kde je prihlásený)
- ✅ Stiahnuť dokumenty (pozvánka, informácie)
- ✅ Vypĺňať test (v časovom limite)
- ✅ Zobraziť vlastné výsledky testov
- ✅ Zobraziť vlastné hodnotenie (po finalizácii)

### Obmedzenia
- ❌ Nevidí iné VK
- ❌ Nevidí iných uchádzačov
- ❌ Nemôže upravovať VK
- ❌ Nemôže vytvárať testy
- ❌ Nevidí hodnotenia iných uchádzačov

### Prístup k obrazovkám

| Obrazovka | Prístup |
|-----------|---------|
| Dashboard | ✅ Uchádzač dashboard (len priradené VK) |
| Detail VK | ✅ Read-only |
| Vypĺňanie testu | ✅ Áno (v časovom limite) |
| Moje výsledky | ✅ Áno |
| Moje hodnotenie | ✅ Áno (po finalizácii) |
| Správa VK | ❌ Nie |
| Správa používateľov | ❌ Nie |

---

## Prihlasovacie údaje

| Rola | Login | Heslo |
|------|-------|-------|
| **SUPERADMIN** | `username` (napr. `superadmin`) | Vlastné (nastavené pri prvom prihlásení) |
| **ADMIN** | `username` (napr. `novak.jozef`) | Vlastné (nastavené cez email link) |
| **GESTOR** | `username` (napr. `kovac.martin`) | Vlastné (nastavené cez email link) |
| **KOMISIA** | `username` (napr. `horvath.jana`) | Vlastné (nastavené cez email link) |
| **UCHÁDZAČ** | `cisIdentifier` (z CIS ŠS, napr. `1234567890`) | Dočasné (odoslané emailom, nemení sa) |

---

## Filtrovanie dát podľa rezortu

### Pravidlá filtrovania

#### VyberoveKonanie
```typescript
// Admin vidí len VK svojho rezortu
WHERE vk.institutionId IN (adminUser.institutionIds)

// Gestor vidí len VK kde je gestorom
WHERE vk.gestorId = user.id

// Komisia vidí len VK kde je členom
WHERE vk.id IN (SELECT vkId FROM CommissionMember WHERE userId = user.id)

// Superadmin vidí všetky
(no filter)
```

#### User (Gestor, Komisia)
```typescript
// Admin vidí len používateľov svojho rezortu
WHERE user.institutionIds && adminUser.institutionIds  // array overlap

// Superadmin vidí všetkých
(no filter)
```

#### Candidate
```typescript
// Admin vidí len uchádzačov VK svojho rezortu
WHERE candidate.vk.institutionId IN (adminUser.institutionIds)

// Gestor vidí len uchádzačov VK kde je gestorom
WHERE candidate.vk.gestorId = user.id

// Komisia vidí len uchádzačov VK kde je členom
WHERE candidate.vk.id IN (SELECT vkId FROM CommissionMember WHERE userId = user.id)
```

---

## Matica oprávnení

| Akcia | SUPERADMIN | ADMIN | GESTOR | KOMISIA | UCHÁDZAČ |
|-------|------------|-------|--------|---------|----------|
| **Rezorty** |
| Vytvoriť rezort | ✅ | ❌ | ❌ | ❌ | ❌ |
| Upraviť rezort | ✅ | ❌ | ❌ | ❌ | ❌ |
| Zobraziť rezorty | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Admini** |
| Vytvoriť admina | ✅ | ❌ | ❌ | ❌ | ❌ |
| Upraviť admina | ✅ | ❌ | ❌ | ❌ | ❌ |
| Priradiť admin k rezortu | ✅ | ❌ | ❌ | ❌ | ❌ |
| **VK** |
| Vytvoriť VK | ❌ | ✅ (vlastný rezort) | ❌ | ❌ | ❌ |
| Upraviť VK | ❌ | ✅ (vlastný rezort) | ✅ (priradené) | ❌ | ❌ |
| Zobraziť VK | ✅ (všetky) | ✅ (vlastný rezort) | ✅ (priradené) | ✅ (priradené) | ✅ (prihlásený) |
| Archivovať VK | ❌ | ✅ (vlastný rezort) | ❌ | ❌ | ❌ |
| **Používatelia** |
| Vytvoriť Gestora | ❌ | ✅ (vlastný rezort) | ❌ | ❌ | ❌ |
| Vytvoriť Komisiu | ❌ | ✅ (vlastný rezort) | ❌ | ❌ | ❌ |
| Upraviť používateľa | ✅ | ✅ (vlastný rezort) | ❌ | ❌ | ❌ |
| **Uchádzači** |
| Vytvoriť uchádzača | ❌ | ✅ (VK vlastného rezortu) | ✅ (priradené VK) | ❌ | ❌ |
| Importovať CSV | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Testy** |
| Vytvoriť test | ❌ | ❌ | ✅ (priradené VK) | ❌ | ❌ |
| Schvaľovať test | ❌ | ✅ (VK vlastného rezortu) | ❌ | ❌ | ❌ |
| Vypĺňať test | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Hodnotenie** |
| Zadať hodnotenie | ❌ | ❌ | ❌ | ✅ (priradené VK) | ❌ |
| Finalizovať hodnotenie | ❌ | ❌ | ❌ | ⭐ (predseda) | ❌ |
| **Audit** |
| Zobraziť audit log | ✅ (všetky) | ✅ (vlastný rezort) | ❌ | ❌ | ❌ |

---

## Poznámky

1. **Superadmin** je špeciálna rola - môže byť len jeden alebo niekoľko v systéme
2. **Admin** môže mať viac rezortov (M:N) - vidí VK všetkých svojich rezortov
3. **Gestor** a **Komisia** môžu byť priradení k VK iného rezortu (zdieľaní experti)
4. **Uchádzač** má vždy dočasný účet - archivuje sa po ukončení VK
5. **Multi-tenancy** je implementované cez `Institution` (Rezort)
6. **Soft delete** sa používa pre všetky typy používateľov
