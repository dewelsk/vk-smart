# Obrazovka: Prihlásenie uchádzača

**Route:** `/applicant/login`

**Účel:** Autentifikácia uchádzača pomocou dočasných prístupových údajov.

---

## Požiadavky zo zadania

- Uchádzač dostane od Admina **dočasné prihlasovacie údaje**
- Prihlási sa prostredníctvom **jedinečného autentifikátora** (napr. VK/2025/1234)
- Zmena hesla nie je potrebná
- Účet slúži výhradne pre konkrétne VK a po skončení sa deaktivuje/archivuje
- Dočasné prístupy budú doručené prostredníctvom e-mailového účtu z CIS ŠŠ

---

## Layout

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    [LOGO / NÁZOV SYSTÉMU]              │
│                                                         │
│              Prihlásenie do výberového konania         │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │                                                 │  │
│  │  Identifikátor VK:                             │  │
│  │  [___________________________________]         │  │
│  │  (napr. VK/2025/1234)                         │  │
│  │                                                 │  │
│  │  Identifikátor uchádzača (CIS ŠŠ):            │  │
│  │  [___________________________________]         │  │
│  │  (napr. VK-001)                               │  │
│  │                                                 │  │
│  │  Heslo:                                        │  │
│  │  [___________________________________] [Oko]   │  │
│  │                                                 │  │
│  │              [Prihlásiť sa]                    │  │
│  │                                                 │  │
│  │  Zabudli ste heslo? Kontaktujte administrátora│  │
│  │                                                 │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Komponenty

### 1. Form fields

**Identifikátor VK:**
- Input type: text
- Placeholder: "VK/2025/1234"
- Required: áno
- Validácia: formát VK/YYYY/číslo
- `data-testid="vk-identifier-input"`

**Identifikátor uchádzača (CIS ŠŠ):**
- Input type: text
- Placeholder: "VK-001"
- Required: áno
- Validácia: neprázdny string
- `data-testid="cis-identifier-input"`
- Label: "Identifikátor uchádzača (CIS ŠŠ)"

**Heslo:**
- Input type: password (s možnosťou zobrazenia)
- Toggle icon (EyeIcon/EyeSlashIcon z Heroicons)
- Required: áno
- `data-testid="password-input"`

### 2. Submit button

- Text: "Prihlásiť sa"
- Variant: Primary (`bg-blue-600 text-white hover:bg-blue-700`)
- Disabled state počas načítavania
- `data-testid="login-button"`

### 3. Error handling

**Inline error messages:**
- Červený border na chybnom inpute
- Error text pod inputom: `text-sm text-red-600`
- `data-testid="vk-identifier-error"`, `data-testid="password-error"`

**Validačné chyby:**
- "Identifikátor VK je povinný"
- "Identifikátor uchádzača je povinný"
- "Heslo je povinné"
- "Nesprávny formát identifikátora VK (očakávaný formát: VK/YYYY/číslo)"

**Server errors:**
- "Nesprávne prihlasovacie údaje"
- "Účet neexistuje alebo bol deaktivovaný"
- "Výberové konanie už bolo ukončené"
- Toast notifikácia s chybou

---

## Funkcionalita

### Login flow

1. Uchádzač vyplní:
   - Identifikátor VK (napr. VK/2025/1234)
   - Identifikátor uchádzača CIS ŠŠ (napr. VK-001)
   - Heslo
2. Klikne "Prihlásiť sa"
3. Frontend validácia (formát VK, povinné polia)
4. Request na `/api/applicant/login`
5. Server overí credentials:
   - Nájde VyberoveKonanie podľa VK identifikátora
   - Nájde Candidate v tomto VK podľa cisIdentifier
   - Overí heslo (User.password kde userId = Candidate.userId)
   - Skontroluje či VK nie je ukončené/zrušené
   - Skontroluje či účet nie je archivovaný
6. Vytvorí session pre uchádzača
7. Redirect na `/applicant/dashboard`

### Error handling

- Inline validácia pri zmene inputu
- Toast notifikácia pri server error
- Disabled button počas submitu
- Loading state: "Overujem prihlasovacie údaje..."

### Security

- HTTPS komunikácia
- Session uložená v secure cookie
- Heslo nikdy nie je zobrazené v clear textu (okrem toggle)
- Audit log: login attempt (success/failure)

---

## API Endpoint

**POST /api/applicant/login**

Request:
```json
{
  "vkIdentifier": "VK/2025/1234",
  "cisIdentifier": "VK-001",
  "password": "dočasné-heslo"
}
```

Response (success):
```json
{
  "success": true,
  "candidateId": "clxy...",
  "vkId": "clxz...",
  "vk": {
    "identifier": "VK/2025/1234",
    "position": "hlavný štátny radca",
    "date": "2025-07-24T00:00:00Z"
  }
}
```

Response (error):
```json
{
  "error": "Nesprávne prihlasovacie údaje"
}
```

---

## Data-testid attributes

- `vk-identifier-input` - Input pre VK identifikátor
- `cis-identifier-input` - Input pre CIS ŠŠ identifikátor
- `password-input` - Input pre heslo
- `login-button` - Submit button
- `vk-identifier-error` - Error message pre VK identifikátor
- `cis-identifier-error` - Error message pre CIS identifikátor
- `password-error` - Error message pre heslo
- `show-password-button` - Toggle pre zobrazenie hesla

---

## Notes

- **ŽIADNE EMOJI** - používať len Heroicons (EyeIcon, EyeSlashIcon pre toggle hesla)
- Dodržať konzistentný dizajn tlačidiel z CLAUDE.md
- Inline validácia s červeným borderom
- Form validation pattern podľa `docs/patterns/form-validation.md`
- Po úspešnom prihlásení uložiť session info
