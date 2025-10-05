# CSV Import uchádzačov (Admin, Gestor, Komisia)

## Kontext
- Hromadný import uchádzačov do konkrétneho VK
- Upload CSV súboru s údajmi uchádzačov
- Automatické generovanie hesiel

## Prístup
- **Admin**: môže importovať uchádzačov len pre VK vo svojich rezortoch
- **Gestor, Komisia**: môže importovať uchádzačov len pre VK, kde sú priradení

## Vstupný bod
- Z **zoznamu uchádzačov** → tlačidlo **"CSV Import"**
- Otvorí modal

---

## Wireframe - Modal: CSV Import

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│   ┌────────────────────────────────────────────────────┐    │
│   │ Import uchádzačov do VK-2025-001                   │    │
│   ├────────────────────────────────────────────────────┤    │
│   │                                                     │    │
│   │ 1. Stiahnite CSV šablónu                            │    │
│   │    [⬇ Stiahnuť šablónu (candidates_template.csv)]  │    │
│   │                                                     │    │
│   │ 2. Nahrajte vyplnený CSV súbor                      │    │
│   │                                                     │    │
│   │    ┌──────────────────────────────────────────┐    │    │
│   │    │  Drag & Drop CSV súbor sem               │    │    │
│   │    │  alebo kliknite pre výber                │    │    │
│   │    │                                           │    │    │
│   │    │  [Vybrať súbor]                           │    │    │
│   │    └──────────────────────────────────────────┘    │    │
│   │                                                     │    │
│   │    ✓ candidates.csv (2.3 KB)                        │    │
│   │                                                     │    │
│   │ 3. Nastavenia importu                               │    │
│   │                                                     │    │
│   │    ☑ Automaticky generovať heslá (odporúčané)      │    │
│   │    ☑ Odoslať prihlasovacie údaje emailom           │    │
│   │                                                     │    │
│   │                                                     │    │
│   │                    [Zrušiť]  [Importovať]          │    │
│   │                                                     │    │
│   └────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## CSV Šablóna

### Formát súboru
- **Encoding**: UTF-8
- **Delimiter**: `,` (čiarka)
- **Quoting**: `"` (úvodzovky pre polia obsahujúce čiarku/nový riadok)

### Povinné stĺpce
```csv
firstName,lastName,email,cisIdentifier,note
Peter,Novák,peter.novak@example.com,UC001,Interná poznámka
Mária,Kováčová,maria.kovacova@example.com,UC002,
Ján,Horák,jan.horak@example.com,UC003,Expert v oblasti IT
```

**Stĺpce:**
1. `firstName` - Meno (povinné)
2. `lastName` - Priezvisko (povinné)
3. `email` - Email (povinné)
4. `cisIdentifier` - CIS identifikátor (povinné, musí byť jedinečný v rámci VK)
5. `note` - Poznámka (voliteľné)

---

## Proces importu

### 1. Stiahnutie šablóny
- Klik na **"Stiahnuť šablónu"**
- Stiahne súbor `candidates_template.csv` s header riadkom

**Šablóna:**
```csv
firstName,lastName,email,cisIdentifier,note
```

### 2. Nahratie súboru
- Drag & Drop alebo klik na **"Vybrať súbor"**
- Podporované formáty: `.csv`
- Max veľkosť: 5 MB
- Max počet riadkov: 1000

### 3. Validácia súboru (frontend)
- Kontrola formátu CSV
- Kontrola povinných stĺpcov
- Kontrola max počtu riadkov

**Chyby:**
```
⚠️ Neplatný formát súboru. Použite CSV súbor.
⚠️ Súbor je príliš veľký (max 5 MB).
⚠️ Príliš veľa riadkov (max 1000).
⚠️ Chýbajúce povinné stĺpce: firstName, lastName
```

### 4. Klik na "Importovať"

**API Request:**
```
POST /api/selection-procedures/:spId/candidates/import
Content-Type: multipart/form-data

- file: candidates.csv
- autoGeneratePasswords: true
- sendEmailNotifications: true
```

---

## Backend - Proces importu

### 1. Parse CSV súboru
- Validácia formátu
- Parse každého riadku

### 2. Validácia každého riadku
Pre každý riadok:
- ✓ Povinné polia vyplnené?
- ✓ Email validný formát?
- ✓ CIS identifikátor jedinečný v rámci VK?
- ✓ CIS identifikátor alfanumerický?

**Ak chyba:**
- Zastaví import
- Vráti zoznam chýb s čísly riadkov

### 3. Vytvorenie uchádzačov
Pre každý validný riadok:
- Vygeneruje heslo (ak autoGeneratePasswords=true)
- Vytvorí uchádzača
- Vytvorí záznam v `CandidateSelectionProcedure`
- Uloží prihlasovacie údaje pre neskôr

### 4. Odoslanie emailov (voliteľné)
Ak `sendEmailNotifications=true`:
- Pre každého uchádzača odošle email s prihlasovacími údajmi

---

## Success Modal - Import dokončený

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│   ┌────────────────────────────────────────────────────┐    │
│   │ ✓ Import úspešne dokončený                         │    │
│   ├────────────────────────────────────────────────────┤    │
│   │                                                     │    │
│   │ Importovaných: 15 uchádzačov                       │    │
│   │ Odoslané emaily: 15                                 │    │
│   │                                                     │    │
│   │ [⬇ Stiahnuť prihlasovacie údaje (CSV)]             │    │
│   │                                                     │    │
│   │ ⚠️ Hesla sa zobrazia len raz!                      │    │
│   │    Uložte si CSV súbor s prihlasovacími údajmi.    │    │
│   │                                                     │    │
│   │                              [Zavrieť]              │    │
│   │                                                     │    │
│   └────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### CSV s prihlasovacími údajmi
```csv
firstName,lastName,email,cisIdentifier,password,vkCode
Peter,Novák,peter.novak@example.com,UC001,XyZ9#mK2pQ,VK-2025-001
Mária,Kováčová,maria.kovacova@example.com,UC002,Abc3!nR7sL,VK-2025-001
Ján,Horák,jan.horak@example.com,UC003,Pqr5@tY9mW,VK-2025-001
```

---

## Error Modal - Validačné chyby

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│   ┌────────────────────────────────────────────────────┐    │
│   │ ⚠️ Chyby vo vyplnení CSV súboru                    │    │
│   ├────────────────────────────────────────────────────┤    │
│   │                                                     │    │
│   │ Nájdené chyby:                                      │    │
│   │                                                     │    │
│   │ Riadok 3: Chýba povinné pole "firstName"           │    │
│   │ Riadok 5: Neplatný formát emailu                   │    │
│   │ Riadok 7: CIS identifikátor "UC001" už existuje    │    │
│   │ Riadok 12: CIS identifikátor musí byť alfanumer.   │    │
│   │                                                     │    │
│   │ Opravte chyby a skúste znova.                      │    │
│   │                                                     │    │
│   │                              [Zavrieť]              │    │
│   │                                                     │    │
│   └────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## API Response

### Success (201)
```json
{
  "imported": 15,
  "emailsSent": 15,
  "credentials": [
    {
      "firstName": "Peter",
      "lastName": "Novák",
      "email": "peter.novak@example.com",
      "cisIdentifier": "UC001",
      "password": "XyZ9#mK2pQ",
      "vkCode": "VK-2025-001"
    }
  ]
}
```

### Error - Validation (400)
```json
{
  "error": "Validation Error",
  "errors": [
    {
      "row": 3,
      "message": "Chýba povinné pole 'firstName'"
    },
    {
      "row": 5,
      "message": "Neplatný formát emailu"
    },
    {
      "row": 7,
      "message": "CIS identifikátor 'UC001' už existuje v tomto VK"
    }
  ]
}
```

### Error - File too large (413)
```json
{
  "error": "File Too Large",
  "message": "Súbor je príliš veľký (max 5 MB)"
}
```

---

## UX - Pokročilé funkcie

### 1. Preview pred importom (voliteľné)
- Po nahratí súboru zobrazí tabuľku s náhľadom dát
- Možnosť skontrolovať pred importom

```
┌─────────────────────────────────────────────────────────────┐
│ Náhľad importu (15 riadkov)                                  │
├───┬───────────┬─────────────┬──────────────────┬────────────┤
│ # │ Meno      │ Priezvisko  │ Email            │ CIS ID     │
├───┼───────────┼─────────────┼──────────────────┼────────────┤
│ 1 │ Peter     │ Novák       │ peter@ex.com     │ UC001      │
│ 2 │ Mária     │ Kováčová    │ maria@ex.com     │ UC002      │
│ 3 │ ⚠️        │ ⚠️          │ ⚠️ Neplatný email│ UC003      │
└───┴───────────┴─────────────┴──────────────────┴────────────┘

⚠️ Nájdené 1 chyby. Opravte ich pred importom.

[Zrušiť]  [Importovať aj tak]  [Opraviť a nahrať znova]
```

### 2. Progress bar (pre veľké súbory)
```
┌─────────────────────────────────────────────────────────────┐
│ Prebieha import...                                           │
│                                                              │
│ ████████████████████░░░░░░░░░░░░░░░░░░░░ 60% (600/1000)    │
│                                                              │
│ Vytvorených uchádzačov: 600                                  │
│ Odoslaných emailov: 600                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Permissions

### Admin
- ✅ Môže importovať uchádzačov len pre VK vo svojich rezortoch

### Gestor, Komisia
- ✅ Môže importovať uchádzačov len pre VK, kde je priradený

### Superadmin
- ✅ Môže importovať uchádzačov pre ľubovoľné VK

---

## OTÁZKY (na neskôr):

1. **Max počet riadkov v CSV?**
   - 100, 500, 1000?
   - Alebo neobmedzené (s progress barom)?

2. **Preview pred importom?**
   - Má sa zobraziť náhľad dát pred importom?
   - Alebo priamo importovať?

3. **Duplikáty v CSV súbore?**
   - Ak v CSV sú duplicitné CIS identifikátory, čo robiť?
   - Zastaviť import alebo preskočiť duplikáty?

4. **Update existujúcich uchádzačov?**
   - Ak CIS identifikátor už existuje, má sa updatovať alebo chyba?

5. **Async import pre veľké súbory?**
   - Pre 1000+ riadkov použiť background job?
   - Notifikácia emailom po dokončení?
