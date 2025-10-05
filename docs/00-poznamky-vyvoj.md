# Poznámky k vývoju

Tento súbor obsahuje poznámky, nápady a rozhodnutia počas vývoja projektu.

---

## Detail VK - Priradenie rolí

**Dátum:** 2025-10-04

V detaile VK (obrazovka `obrazovky/admin/07_detail_vk.md`) bude potrebné implementovať:

### 1. Výber Gestora pre VK
- Dropdown/autocomplete zo zoznamu používateľov s rolou `GESTOR`
- Možnosť vybrať 1 gestora pre VK
- Gestor môže byť priradený k viacerým VK
- Gestor **nie je** naviazaný na VK pri vytváraní účtu (trvalý účet)

### 2. Priradenie členov komisie
- Multi-select zo zoznamu používateľov s rolou `KOMISIA`
- Možnosť vybrať N členov (minimum 2, vždy nepárny počet spolu s predsedom)
- Označenie jedného člena ako **predseda komisie** (`isChairman = true`)
- Tí istí členovia môžu byť v komisiách viacerých VK
- Členovia komisie **nie sú** naviazaní na VK pri vytváraní účtu (trvalé účty)

### Databázové väzby:
- **Gestor → VK**: Potrebné doplniť do `VyberoveKonanie` model (pole `gestorId`?)
- **Komisia → VK**: Cez existujúce modely:
  - `Commission` (1:1 s VK)
  - `CommissionMember` (N členov, jeden s `isChairman = true`)

### UI Flow:
1. Admin otvorí Detail VK
2. Sekcia "Priradenie rolí" alebo "Tím VK"
3. **Výber gestora**: Dropdown s používateľmi (role = GESTOR)
4. **Výber komisie**:
   - Multi-select s používateľmi (role = KOMISIA)
   - Radio button alebo dropdown pre výber predsedu
   - Validácia: minimálne 2 členovia, nepárny počet
5. Uložiť

---

## Typy používateľov - priraďovanie k VK

**Dátum:** 2025-10-04

### ADMIN, GESTOR, KOMISIA - trvalé účty
- **NIE SÚ** naviazané na konkrétne VK pri vytváraní
- Môžu participovať vo **viacerých VK**
- Vytvárajú sa v **centrálnej správe používateľov**
- VK **nie je** povinný údaj pri vytváraní účtu
- Priraďujú sa k VK neskôr (v detaile VK)

### UCHÁDZAČ - dočasné účty
- **SÚ** naviazané na konkrétne VK
- **Dočasné** - archivujú sa po skončení VK
- Vytvárajú sa **v kontexte konkrétneho VK** (samostatná obrazovka)
- VK **JE** povinný údaj pri vytváraní
- Login = CIS identifikátor
- Samostatný zoznam uchádzačov (oddelený od Admin/Gestor/Komisia)

---
