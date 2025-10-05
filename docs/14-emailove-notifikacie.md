# Emailové notifikácie

Tento dokument definuje všetky typy emailových notifikácií v systéme VK Smart.

---

## 1. Email pri vytvorení účtu (Admin, Gestor, Komisia)

**Kedy sa odosiela:**
- Pri vytvorení nového používateľa s rolou ADMIN, GESTOR alebo KOMISIA
- Ak je zaškrtnuté "Odoslať inštruktáž na prihlásenie emailom"

**Príjemca:**
- Novo vytvorený používateľ

**Predmet:**
```
Vitajte v systéme VK Smart - Nastavte si heslo
```

**Obsah:**
```
Dobrý deň {meno} {priezvisko},

Bol vám vytvorený účet v systéme VK Smart s rolou {rola}.

Prihlasovacie údaje:
- Email: {email}
- Heslo: Zatiaľ nie je nastavené

Pre aktiváciu účtu kliknite na nasledujúci link a nastavte si heslo:

{SET_PASSWORD_LINK}

Link je platný 24 hodín.

Po nastavení hesla sa budete môcť prihlásiť do systému.

{AK_VK_PRIRADENE}
Boli ste priradený/á k výberovému konaniu: {VK_IDENTIFIER} - {VK_POSITION}
{/AK_VK_PRIRADENE}

S pozdravom,
Tím VK Smart

---
Tento email bol vygenerovaný automaticky. Neodpovedajte naň.
```

**Premenné:**
- `{meno}` - meno používateľa
- `{priezvisko}` - priezvisko používateľa
- `{rola}` - Admin / Gestor / Komisia
- `{email}` - email používateľa
- `{SET_PASSWORD_LINK}` - https://app.url/set-password?token={passwordSetToken}
- `{VK_IDENTIFIER}` - identifikátor VK (ak je priradený)
- `{VK_POSITION}` - pozícia VK (ak je priradený)

---

## 2. Reset hesla

**Kedy sa odosiela:**
- Keď používateľ klikne na "Zabudli ste heslo?"
- Na login obrazovke

**Príjemca:**
- Používateľ, ktorý požiadal o reset

**Predmet:**
```
VK Smart - Reset hesla
```

**Obsah:**
```
Dobrý deň {meno} {priezvisko},

Požiadali ste o reset hesla v systéme VK Smart.

Pre obnovenie hesla kliknite na nasledujúci link:

{RESET_PASSWORD_LINK}

Link je platný 1 hodinu.

Ak ste o reset hesla nepožiadali, tento email ignorujte.

S pozdravom,
Tím VK Smart

---
Tento email bol vygenerovaný automaticky. Neodpovedajte naň.
```

**Premenné:**
- `{meno}` - meno používateľa
- `{priezvisko}` - priezvisko používateľa
- `{RESET_PASSWORD_LINK}` - https://app.url/reset-password?token={resetToken}

---

## 3. Potvrdenie zmeny hesla

**Kedy sa odosiela:**
- Po úspešnej zmene hesla
- Po prvom nastavení hesla (po vytvorení účtu)

**Príjemca:**
- Používateľ, ktorý si zmenil heslo

**Predmet:**
```
VK Smart - Heslo bolo úspešne zmenené
```

**Obsah:**
```
Dobrý deň {meno} {priezvisko},

Vaše heslo bolo úspešne zmenené.

Dátum a čas zmeny: {timestamp}
IP adresa: {ipAddress}

Ak ste to neboli vy, kontaktujte nás okamžite.

S pozdravom,
Tím VK Smart

---
Tento email bol vygenerovaný automaticky. Neodpovedajte naň.
```

**Premenné:**
- `{meno}` - meno používateľa
- `{priezvisko}` - priezvisko používateľa
- `{timestamp}` - dátum a čas zmeny
- `{ipAddress}` - IP adresa používateľa

---

## 4. Pozvánka na VK - Gestor

**Kedy sa odosiela:**
- Keď admin priradí gestora k VK (v detaile VK)

**Príjemca:**
- Gestor priradený k VK

**Predmet:**
```
VK Smart - Priradenie k výberovému konaniu
```

**Obsah:**
```
Dobrý deň {meno} {priezvisko},

Boli ste priradený/á ako gestor k výberovému konaniu:

Identifikátor: {VK_IDENTIFIER}
Pozícia: {VK_POSITION}
Organizačný útvar: {VK_ORG_UNIT}
Dátum konania: {VK_DATE}

Vaše úlohy:
- Vytvorenie testov pre výberové konanie
- Odoslanie testov na schválenie adminovi

Prihlásiť sa môžete tu: {LOGIN_LINK}

S pozdravom,
Tím VK Smart

---
Tento email bol vygenerovaný automaticky. Neodpovedajte naň.
```

**Premenné:**
- `{meno}` - meno gestora
- `{priezvisko}` - priezvisko gestora
- `{VK_IDENTIFIER}` - identifikátor VK
- `{VK_POSITION}` - pozícia
- `{VK_ORG_UNIT}` - organizačný útvar
- `{VK_DATE}` - dátum konania
- `{LOGIN_LINK}` - https://app.url/login

---

## 5. Pozvánka na VK - Komisia

**Kedy sa odosiela:**
- Keď admin priradí člena komisie k VK (v detaile VK)

**Príjemca:**
- Člen komisie

**Predmet:**
```
VK Smart - Priradenie do výberovej komisie
```

**Obsah:**
```
Dobrý deň {meno} {priezvisko},

Boli ste priradený/á do výberovej komisie pre výberové konanie:

Identifikátor: {VK_IDENTIFIER}
Pozícia: {VK_POSITION}
Organizačný útvar: {VK_ORG_UNIT}
Dátum konania: {VK_DATE}

{AK_PREDSEDA}
Vaša rola: Predseda komisie
{/AK_PREDSEDA}
{AK_CLEN}
Vaša rola: Člen komisie
{/AK_CLEN}

Vaše úlohy:
- Preskúmanie podkladov uchádzačov
- Hodnotenie uchádzačov v osobnom pohovore

Prihlásiť sa môžete tu: {LOGIN_LINK}

S pozdravom,
Tím VK Smart

---
Tento email bol vygenerovaný automaticky. Neodpovedajte naň.
```

**Premenné:**
- `{meno}` - meno člena komisie
- `{priezvisko}` - priezvisko člena komisie
- `{VK_IDENTIFIER}` - identifikátor VK
- `{VK_POSITION}` - pozícia
- `{VK_ORG_UNIT}` - organizačný útvar
- `{VK_DATE}` - dátum konania
- `{AK_PREDSEDA}` - conditional block (isChairman === true)
- `{AK_CLEN}` - conditional block (isChairman === false)
- `{LOGIN_LINK}` - https://app.url/login

---

## 6. Prihlasovacie údaje pre uchádzača

**Kedy sa odosiela:**
- Po vytvorení účtu uchádzača (manuálne alebo CSV import)
- Uchádzač dostáva dočasné heslo (nie link)

**Príjemca:**
- Uchádzač (email zo systému CIS ŠS)

**Predmet:**
```
VK Smart - Prístup k výberovému konaniu {VK_IDENTIFIER}
```

**Obsah:**
```
Dobrý deň {meno} {priezvisko},

Boli ste pozvaný/á na výberové konanie:

Identifikátor: {VK_IDENTIFIER}
Pozícia: {VK_POSITION}
Organizačný útvar: {VK_ORG_UNIT}
Dátum konania: {VK_DATE}

Prihlasovacie údaje:
- Login: {CIS_IDENTIFIER}
- Dočasné heslo: {TEMPORARY_PASSWORD}

DÔLEŽITÉ:
- Prihláste sa s uvedenými údajmi
- Heslo nie je potrebné meniť (účet je dočasný pre toto VK)
- Po skončení VK bude účet deaktivovaný

Link na prihlásenie: {LOGIN_LINK}

Ďalšie kroky:
1. Prihlásenie do systému
2. Absolvovanie písomných testov (ak sú súčasťou VK)
3. Osobný pohovor s výberovou komisiou

S pozdravom,
Tím VK Smart

---
Tento email bol vygenerovaný automaticky. Neodpovedajte naň.
```

**Premenné:**
- `{meno}` - meno uchádzača
- `{priezvisko}` - priezvisko uchádzača
- `{VK_IDENTIFIER}` - identifikátor VK
- `{VK_POSITION}` - pozícia
- `{VK_ORG_UNIT}` - organizačný útvar
- `{VK_DATE}` - dátum konania
- `{CIS_IDENTIFIER}` - identifikátor z CIS ŠS (login!)
- `{TEMPORARY_PASSWORD}` - vygenerované dočasné heslo
- `{LOGIN_LINK}` - https://app.url/login

---

## 7. Pripomienka začiatku testovania (uchádzač)

**Kedy sa odosiela:**
- 24 hodín pred dátumom konania
- Len pre uchádzačov, ktorí ešte neabsolvovali test

**Príjemca:**
- Uchádzač

**Predmet:**
```
VK Smart - Pripomienka: Testovanie zajtra
```

**Obsah:**
```
Dobrý deň {meno} {priezvisko},

Pripomíname vám, že zajtra ({VK_DATE}) prebieha testovacia časť výberového konania:

Identifikátor: {VK_IDENTIFIER}
Pozícia: {VK_POSITION}

Prihlasovacie údaje:
- Login: {CIS_IDENTIFIER}
- Heslo: (použite heslo z predchádzajúceho emailu)

Link na prihlásenie: {LOGIN_LINK}

Pravidlá testovania:
- Po prihlásení sa Vám zobrazí test
- Časový limit: {TEST_DURATION} minút
- Po vypršaní času sa test automaticky odošle
- Test môžete dokončiť aj skôr

Prajeme veľa úspechov!

S pozdravom,
Tím VK Smart

---
Tento email bol vygenerovaný automaticky. Neodpovedajte naň.
```

**Premenné:**
- `{meno}` - meno uchádzača
- `{priezvisko}` - priezvisko uchádzača
- `{VK_DATE}` - dátum konania
- `{VK_IDENTIFIER}` - identifikátor VK
- `{VK_POSITION}` - pozícia
- `{CIS_IDENTIFIER}` - login
- `{LOGIN_LINK}` - link na prihlásenie
- `{TEST_DURATION}` - dĺžka testu v minútach

---

## 8. Schválenie testu (Gestor)

**Kedy sa odosiela:**
- Keď admin schváli test, ktorý gestor vytvoril

**Príjemca:**
- Gestor, ktorý vytvoril test

**Predmet:**
```
VK Smart - Test bol schválený
```

**Obsah:**
```
Dobrý deň {meno} {priezvisko},

Váš test "{TEST_NAME}" bol schválený administrátorom a je pripravený na použitie.

Typ testu: {TEST_TYPE}
Počet otázok: {QUESTION_COUNT}
Schválil: {APPROVED_BY}
Dátum schválenia: {APPROVED_DATE}

Test je teraz dostupný pre priradenie k výberovým konaniam.

Prihlásiť sa môžete tu: {LOGIN_LINK}

S pozdravom,
Tím VK Smart
```

---

## 9. Zamietnutie testu (Gestor)

**Kedy sa odosiela:**
- Keď admin zamietne test a vráti ho gestorom na prepracovanie

**Príjemca:**
- Gestor, ktorý vytvoril test

**Predmet:**
```
VK Smart - Test vyžaduje úpravy
```

**Obsah:**
```
Dobrý deň {meno} {priezvisko},

Váš test "{TEST_NAME}" vyžaduje úpravy pred schválením.

Dôvod vrátenia:
{REJECTION_REASON}

Typ testu: {TEST_TYPE}
Počet otázok: {QUESTION_COUNT}

Prosím, upravte test podľa pripomienok a odošlite znova na schválenie.

Prihlásiť sa môžete tu: {LOGIN_LINK}

S pozdravom,
Tím VK Smart
```

---

## 10. Dokončenie testu - notifikácia pre Admin

**Kedy sa odosiela:**
- Keď uchádzač dokončí test
- Len ak je to prvý dokončený test z daného levelu (alebo všetci dokončili)

**Príjemca:**
- Admin, ktorý vytvoril VK

**Predmet:**
```
VK Smart - Uchádzač dokončil test ({X}/{TOTAL})
```

**Obsah:**
```
Dobrý deň,

Uchádzač {CANDIDATE_NAME} dokončil test pre výberové konanie:

VK: {VK_IDENTIFIER} - {VK_POSITION}
Test: {TEST_NAME}
Výsledok: {SCORE}/{MAX_SCORE} bodov ({PERCENTAGE}%)
Status: {PASSED/FAILED}

Pokrok testovania:
- Dokončených testov: {COMPLETED_COUNT}/{TOTAL_COUNT}

Zobraziť výsledky: {VK_DETAIL_LINK}

S pozdravom,
Tím VK Smart
```

---

## 11. Všetci uchádzači dokončili testy (Admin)

**Kedy sa odosiela:**
- Keď posledný uchádzač dokončí test určitého levelu

**Príjemca:**
- Admin

**Predmet:**
```
VK Smart - Testovacia fáza dokončená
```

**Obsah:**
```
Dobrý deň,

Všetci uchádzači dokončili testovanie pre:

VK: {VK_IDENTIFIER} - {VK_POSITION}
Level: {TEST_LEVEL}

Štatistiky:
- Celkový počet uchádzačov: {TOTAL_COUNT}
- Úspešných: {PASSED_COUNT}
- Neúspešných: {FAILED_COUNT}
- Priemerná úspešnosť: {AVG_PERCENTAGE}%

Ďalší krok: {NEXT_STEP_INFO}

Zobraziť detail VK: {VK_DETAIL_LINK}

S pozdravom,
Tím VK Smart
```

---

## 12. Výsledky VK - Úspešný uchádzač

**Kedy sa odosiela:**
- Po finalizácii hodnotenia všetkých uchádzačov
- Pre úspešných a vybraných uchádzačov

**Príjemca:**
- Uchádzač (úspešný a vybraný)

**Predmet:**
```
VK Smart - Výsledok výberového konania: ÚSPEŠNÝ
```

**Obsah:**
```
Dobrý deň {meno} {priezvisko},

Gratulujeme! Úspešne ste absolvovali výberové konanie:

VK: {VK_IDENTIFIER}
Pozícia: {VK_POSITION}
Organizačný útvar: {VK_ORG_UNIT}

Vaše výsledky:
- Písomné testy: {TEST_SCORE} bodov
- Osobný pohovor: {INTERVIEW_SCORE} bodov
- Celkové hodnotenie: {TOTAL_SCORE} bodov
- Poradie: {RANK}. miesto z {TOTAL_CANDIDATES} uchádzačov

Status: ÚSPEŠNÝ A VYBRANÝ

Ďalšie kroky budú oznámené osobitne.

S pozdravom,
Tím VK Smart
```

---

## 13. Výsledky VK - Neúspešný uchádzač

**Kedy sa odosiela:**
- Po finalizácii hodnotenia
- Pre neúspešných uchádzačov

**Príjemca:**
- Uchádzač (neúspešný)

**Predmet:**
```
VK Smart - Výsledok výberového konania
```

**Obsah:**
```
Dobrý deň {meno} {priezvisko},

Ďakujeme za účasť na výberovom konaní:

VK: {VK_IDENTIFIER}
Pozícia: {VK_POSITION}

Vaše výsledky:
- Písomné testy: {TEST_SCORE} bodov
- Osobný pohovor: {INTERVIEW_SCORE} bodov (ak sa konal)
- Celkové hodnotenie: {TOTAL_SCORE} bodov

Bohužiaľ, na túto pozíciu bol vybraný iný uchádzač.

Ďakujeme za Váš záujem a prajeme veľa úspechov v budúcnosti.

S pozdravom,
Tím VK Smart
```

---

## 14. Expirácia linku na nastavenie hesla

**Kedy sa odosiela:**
- Keď používateľ neklikol na link na nastavenie hesla do 24 hodín

**Príjemca:**
- Používateľ (Admin/Gestor/Komisia)

**Predmet:**
```
VK Smart - Platnosť linku vypršala
```

**Obsah:**
```
Dobrý deň {meno} {priezvisko},

Platnosť linku na nastavenie hesla pre váš účet v systéme VK Smart vypršala.

Pre získanie nového linku kontaktujte administrátora systému.

S pozdravom,
Tím VK Smart
```

---

## 15. Archivácia účtu uchádzača

**Kedy sa odosiela:**
- Po skončení VK, keď sa archivujú účty uchádzačov

**Príjemca:**
- Uchádzač

**Predmet:**
```
VK Smart - Váš účet bol archivovaný
```

**Obsah:**
```
Dobrý deň {meno} {priezvisko},

Výberové konanie {VK_IDENTIFIER} bolo ukončené a váš dočasný účet v systéme VK Smart bol archivovaný.

Ďakujeme za účasť.

S pozdravom,
Tím VK Smart
```

---

## 16. Nová pripomienka/zmena v osobnom pohovore (Komisia)

**Kedy sa odosiela:**
- Keď admin naplánuje/zmení termín osobného pohovoru

**Príjemca:**
- Všetci členovia komisie

**Predmet:**
```
VK Smart - Osobný pohovor: {VK_IDENTIFIER}
```

**Obsah:**
```
Dobrý deň {meno} {priezvisko},

Osobný pohovor pre výberové konanie {VK_IDENTIFIER} je naplánovaný na:

Dátum: {INTERVIEW_DATE}
Čas: {INTERVIEW_TIME}
Miesto: {INTERVIEW_LOCATION}

Počet uchádzačov: {CANDIDATES_COUNT}

Prihlásiť sa môžete tu: {LOGIN_LINK}

S pozdravom,
Tím VK Smart
```

---

## 17. Pripomienka dokončenia hodnotenia (Komisia)

**Kedy sa odosiela:**
- Keď niektorý člen komisie ešte nedokončil hodnotenie všetkých uchádzačov
- Upomienka 24h pred deadline

**Príjemca:**
- Člen komisie, ktorý má nedokončené hodnotenie

**Predmet:**
```
VK Smart - Pripomienka: Dokončite hodnotenie
```

**Obsah:**
```
Dobrý deň {meno} {priezvisko},

Pripomíname, že je potrebné dokončiť hodnotenie uchádzačov pre:

VK: {VK_IDENTIFIER} - {VK_POSITION}

Váš pokrok:
- Ohodnotených: {EVALUATED_COUNT}/{TOTAL_CANDIDATES}
- Zostáva: {REMAINING_COUNT} uchádzačov

Deadline: {DEADLINE_DATE}

Prihlásiť sa môžete tu: {LOGIN_LINK}

S pozdravom,
Tím VK Smart
```

---

## Technická implementácia

### Email provider
- Použitie: **Nodemailer** + SMTP server
- Fallback: SendGrid / Mailgun API

### Template engine
- **Handlebars** alebo **EJS** pre šablóny
- Conditional blocks podporované
- HTML + Plain text verzie

### Queuing
- **Bull** (Redis) pre queue management
- Retry mechanizmus pri zlyhaní
- Logging úspešných/neúspešných odoslaní

### Tracking
- Uloženie do `AuditLog`:
  - `action: "EMAIL_SENT"`
  - `entity: "User"` alebo `"VK"`
  - `details: { emailType, recipient, success }`

### Rate limiting
- Max 100 emailov / hodinu (na začiatku)
- Scaling podľa potreby

---

## API Endpoint pre odoslanie emailu

### POST `/api/admin/send-email`

**Request:**
```json
{
  "type": "ACCOUNT_CREATED" | "RESET_PASSWORD" | "PASSWORD_CHANGED" | "VK_INVITATION_GESTOR" | "VK_INVITATION_KOMISIA" | "CANDIDATE_CREDENTIALS" | "TEST_REMINDER",
  "recipientId": "user_123",
  "data": {
    "vkId": "vk_123",
    "temporaryPassword": "abc123",
    // ... ďalšie dáta podľa typu emailu
  }
}
```

**Response:**
```json
{
  "success": true,
  "emailId": "email_123",
  "sentAt": "2025-10-04T10:30:00Z"
}
```

---

## Súhrn

| # | Typ emailu | Príjemca | Trigger | Link platný |
|---|------------|----------|---------|-------------|
| 1 | Vytvorenie účtu | Admin/Gestor/Komisia | Pri vytvorení účtu | 24h |
| 2 | Reset hesla | Všetci | Na požiadanie | 1h |
| 3 | Zmena hesla | Všetci | Po zmene hesla | - |
| 4 | Pozvánka - Gestor | Gestor | Priradenie k VK | - |
| 5 | Pozvánka - Komisia | Komisia | Priradenie k VK | - |
| 6 | Prihlasovacie údaje | Uchádzač | Vytvorenie účtu | - |
| 7 | Pripomienka testovanie | Uchádzač | 24h pred VK | - |
| 8 | Schválenie testu | Gestor | Admin schváli test | - |
| 9 | Zamietnutie testu | Gestor | Admin zamietne test | - |
| 10 | Dokončenie testu | Admin | Uchádzač dokončí test | - |
| 11 | Všetci dokončili testy | Admin | Posledný test dokončený | - |
| 12 | Výsledky - úspešný | Uchádzač | Finalizácia VK | - |
| 13 | Výsledky - neúspešný | Uchádzač | Finalizácia VK | - |
| 14 | Expirácia linku | Admin/Gestor/Komisia | Po 24h bez akcie | - |
| 15 | Archivácia účtu | Uchádzač | Po skončení VK | - |
| 16 | Osobný pohovor | Komisia | Plánovanie pohovoru | - |
| 17 | Pripomienka hodnotenie | Komisia | 24h pred deadline | - |

**Celkom: 17 typov emailov**
