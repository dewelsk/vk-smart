# API Endpoints

## Autentifikácia

### POST `/api/auth/login`
Prihlásenie používateľa.

**Request:**
```json
{
  "email": "admin@mirri.gov.sk",
  "password": "Admin123!"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "admin@mirri.gov.sk",
    "name": "Ján",
    "surname": "Novák",
    "role": "ADMIN"
  },
  "requires2FA": true
}
```

### POST `/api/auth/2fa/generate`
Generovanie OTP kódu.

**Request:**
```json
{
  "userId": "user_123"
}
```

**Response:**
```json
{
  "success": true,
  "otpCode": "123456",  // V dev mode
  "expiresAt": "2025-01-01T12:05:00Z"
}
```

### POST `/api/auth/2fa/verify`
Overenie OTP kódu.

**Request:**
```json
{
  "userId": "user_123",
  "otpCode": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "session": {
    "token": "jwt_token_here",
    "expiresAt": "2025-01-01T16:00:00Z"
  }
}
```

### POST `/api/auth/reset-password`
Reset hesla.

**Request:**
```json
{
  "userId": "user_123",
  "newPassword": "NewPass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Heslo bolo zmenené"
}
```

## Admin - Výberové Konania

### GET `/api/admin/vk`
Zoznam všetkých VK.

**Query params:**
- `status?`: Filter podľa statusu
- `page?`: Číslo stránky (default: 1)
- `limit?`: Počet záznamov (default: 20)

**Response:**
```json
{
  "vks": [
    {
      "id": "vk_1",
      "identifikator": "VK/2025/1234",
      "druhKonania": "širšie vnútorné výberové konanie",
      "funkcia": "hlavný štátny radca",
      "datum": "2025-07-24T00:00:00Z",
      "status": "TESTOVANIE",
      "pocetKandidatov": 5,
      "createdBy": {
        "name": "Ján",
        "surname": "Novák"
      }
    }
  ],
  "total": 42,
  "page": 1,
  "pages": 3
}
```

### POST `/api/admin/vk`
Vytvorenie nového VK.

**Request:**
```json
{
  "identifikator": "VK/2025/1234",
  "druhKonania": "širšie vnútorné výberové konanie",
  "organizacnyUtvar": "Odbor implementácie OKP",
  "odborSS": "1.03 – Medzinárodná spolupráca",
  "funkcia": "hlavný štátny radca",
  "druhSS": "stála štátna služba",
  "datum": "2025-07-24",
  "pocetMiest": 1
}
```

**Response:**
```json
{
  "success": true,
  "vk": {
    "id": "vk_1",
    "identifikator": "VK/2025/1234",
    ...
  }
}
```

### GET `/api/admin/vk/[id]`
Detail VK.

**Response:**
```json
{
  "id": "vk_1",
  "identifikator": "VK/2025/1234",
  "druhKonania": "širšie vnútorné výberové konanie",
  ...
  "candidates": [...],
  "assignedTests": [...],
  "commission": {...}
}
```

### PUT `/api/admin/vk/[id]`
Aktualizácia VK.

**Request:**
```json
{
  "status": "TESTOVANIE",
  "datum": "2025-07-25"
}
```

**Response:**
```json
{
  "success": true,
  "vk": {...}
}
```

### DELETE `/api/admin/vk/[id]`
Zmazanie VK.

**Response:**
```json
{
  "success": true,
  "message": "VK bolo zmazané"
}
```

## Admin - Používatelia

### GET `/api/admin/users`
Zoznam používateľov.

**Query params:**
- `role?`: Filter podľa role
- `vkId?`: Filter podľa VK

**Response:**
```json
{
  "users": [
    {
      "id": "user_1",
      "email": "jan.novak@gmail.com",
      "name": "Ján",
      "surname": "Novák",
      "role": "UCHADZAC",
      "active": true,
      "createdAt": "2025-01-01T10:00:00Z"
    }
  ],
  "total": 10
}
```

### POST `/api/admin/users`
Vytvorenie používateľa.

**Request:**
```json
{
  "email": "jan.novak@gmail.com",
  "name": "Ján",
  "surname": "Novák",
  "role": "UCHADZAC",
  "vkId": "vk_1",
  "identifikatorCIS": "CIS123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {...},
  "temporaryPassword": "TempPass123!"
}
```

### POST `/api/admin/users/bulk`
Hromadné vytvorenie používateľov (CSV import).

**Request:** `multipart/form-data`
```
csvFile: File
vkId: string
```

**Response:**
```json
{
  "success": true,
  "created": 10,
  "errors": [
    {
      "row": 5,
      "email": "duplicate@email.com",
      "error": "Email už existuje"
    }
  ]
}
```

### PUT `/api/admin/users/[id]`
Aktualizácia používateľa.

**Request:**
```json
{
  "active": false,
  "role": "GESTOR"
}
```

### DELETE `/api/admin/users/[id]`
Deaktivácia používateľa.

## Admin - Typy testov

### GET `/api/admin/test-types`
Zoznam typov testov.

**Response:**
```json
{
  "testTypes": [
    {
      "id": "type_1",
      "name": "Štátny jazyk",
      "description": "Testy štátneho jazyka",
      "categoryCount": 5,
      "createdAt": "2025-01-01T10:00:00Z",
      "updatedAt": "2025-01-01T10:00:00Z"
    }
  ]
}
```

### POST `/api/admin/test-types`
Vytvorenie nového typu testu.

**Request:**
```json
{
  "name": "Nový typ testu",
  "description": "Popis typu"
}
```

**Response:**
```json
{
  "testType": {
    "id": "type_1",
    "name": "Nový typ testu",
    "description": "Popis typu"
  }
}
```

### PUT `/api/admin/test-types/:id`
Aktualizácia typu testu.

**Request:**
```json
{
  "name": "Aktualizovaný názov",
  "description": "Aktualizovaný popis"
}
```

### DELETE `/api/admin/test-types/:id`
Zmazanie typu testu (len ak nemá priradené kategórie).

---

## Admin - Kategórie testov

### GET `/api/admin/test-categories`
Zoznam kategórií testov.

**Query params:**
- `typeId?`: Filter podľa typu testu
- `search?`: Vyhľadávanie v názve

**Response:**
```json
{
  "categories": [
    {
      "id": "cat_1",
      "name": "Slovenský jazyk - A1",
      "typeId": "type_1",
      "type": {
        "id": "type_1",
        "name": "Štátny jazyk"
      },
      "description": "Základná úroveň",
      "testCount": 3,
      "createdAt": "2025-01-01T10:00:00Z"
    }
  ]
}
```

### POST `/api/admin/test-categories`
Vytvorenie novej kategórie.

**Request:**
```json
{
  "name": "Slovenský jazyk - A1",
  "typeId": "type_1",
  "description": "Základná úroveň"
}
```

**Response:**
```json
{
  "category": {
    "id": "cat_1",
    "name": "Slovenský jazyk - A1",
    "typeId": "type_1",
    "description": "Základná úroveň"
  }
}
```

### PUT `/api/admin/test-categories/:id`
Aktualizácia kategórie.

**Request:**
```json
{
  "name": "Aktualizovaný názov",
  "typeId": "type_2",
  "description": "Nový popis"
}
```

### DELETE `/api/admin/test-categories/:id`
Zmazanie kategórie (len ak nemá priradené testy).

---

## Admin - Testy

### GET `/api/admin/tests`
Zoznam testov.

**Query params:**
- `categoryId?`: Filter podľa kategórie

**Response:**
```json
{
  "tests": [
    {
      "id": "test_1",
      "nazov": "Odborný test - Medzinárodná spolupráca",
      "type": "ODBORNY",
      "categoryId": "cat_1",
      "category": {
        "id": "cat_1",
        "name": "Slovenský jazyk - A1"
      },
      "pocetOtazok": 20,
      "schvaleny": true,
      "autor": {...}
    }
  ]
}
```

### POST `/api/admin/tests`
Vytvorenie testu.

**Request:**
```json
{
  "nazov": "Odborný test - IT",
  "type": "ODBORNY",
  "categoryId": "cat_1",
  "popis": "Test pre IT pozície",
  "otazky": [
    {
      "id": "q1",
      "otazka": "Čo je API?",
      "odpovede": [
        "Application Programming Interface",
        "Advanced Programming Interface",
        "Application Protocol Interface"
      ],
      "spravnaOdpoved": 0
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "test": {...}
}
```

### POST `/api/admin/tests/assign`
Priradenie testu k VK.

**Request:**
```json
{
  "vkId": "vk_1",
  "testId": "test_1",
  "level": 1,
  "pocetOtazok": 15,
  "casMinut": 20,
  "bodZaOtazku": 1,
  "minimalneBody": 12
}
```

**Response:**
```json
{
  "success": true,
  "assignment": {...}
}
```

## Testy (Uchádzač)

### GET `/api/tests/candidate/[candidateId]`
Zoznam testov pre kandidáta.

**Response:**
```json
{
  "tests": [
    {
      "id": "test_1",
      "nazov": "Odborný test",
      "typ": "ODBORNY",
      "level": 1,
      "casMinut": 20,
      "status": "PENDING",  // PENDING, IN_PROGRESS, COMPLETED
      "started": false
    }
  ]
}
```

### POST `/api/tests/[testId]/start`
Spustenie testu.

**Request:**
```json
{
  "candidateId": "candidate_1"
}
```

**Response:**
```json
{
  "success": true,
  "testResult": {
    "id": "result_1",
    "test": {
      "id": "test_1",
      "nazov": "Odborný test",
      "otazky": [
        {
          "id": "q1",
          "otazka": "Čo je API?",
          "odpovede": ["...", "...", "..."]
          // BEZ spravnaOdpoved!
        }
      ]
    },
    "casStart": "2025-01-01T10:00:00Z",
    "casKoniec": "2025-01-01T10:20:00Z"
  }
}
```

### POST `/api/tests/[testId]/submit`
Odoslanie testu.

**Request:**
```json
{
  "candidateId": "candidate_1",
  "odpovede": {
    "q1": 0,
    "q2": 2,
    "q3": 1
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "body": 15,
    "maxBody": 20,
    "percentoUspesnost": 75,
    "uspesny": true,
    "spravneOdpovede": {
      "q1": 0,
      "q2": 1,  // Používateľ dal 2, správna je 1
      "q3": 1
    }
  }
}
```

### GET `/api/tests/results/[candidateId]`
Výsledky všetkých testov kandidáta.

**Response:**
```json
{
  "results": [
    {
      "test": {
        "nazov": "Odborný test",
        "typ": "ODBORNY"
      },
      "body": 15,
      "maxBody": 20,
      "percentoUspesnost": 75,
      "uspesny": true,
      "casTrvania": 1140  // sekundy
    }
  ],
  "celkoveBody": 35,
  "celkoveMaxBody": 50
}
```

## Hodnotenie (Komisia)

### GET `/api/evaluations/[vkId]/candidates`
Zoznam kandidátov pre hodnotenie.

**Response:**
```json
{
  "candidates": [
    {
      "id": "candidate_1",
      "user": {
        "name": "Ján",
        "surname": "Novák"
      },
      "testResults": [...],
      "evaluations": [...]  // Existing evaluations
    }
  ]
}
```

### POST `/api/evaluations/submit`
Odoslanie hodnotenia.

**Request:**
```json
{
  "candidateId": "candidate_1",
  "memberId": "member_1",
  "hodnotenie": [
    {
      "vlastnost": "Sebadovera",
      "body": 4
    },
    {
      "vlastnost": "Komunikacne zrucnosti",
      "body": 5
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "evaluation": {...}
}
```

### GET `/api/evaluations/candidate/[candidateId]`
Hodnotenie kandidáta + dokumenty.

**Response:**
```json
{
  "candidate": {...},
  "documents": [
    {
      "id": "doc_1",
      "typ": "CV",
      "nazov": "cv_jan_novak.pdf",
      "url": "/api/documents/download/doc_1"
    }
  ],
  "evaluations": [...]
}
```

## Dokumenty

### POST `/api/documents/upload`
Nahratie dokumentu.

**Request:** `multipart/form-data`
```
file: File
candidateId: string
typ: "CV" | "MOTIVACNY_LIST" | "CERTIFIKAT"
```

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "doc_1",
    "nazov": "cv.pdf",
    "cesta": "cv/vk-2025-1234/candidate-001/cv.pdf"
  }
}
```

### GET `/api/documents/[candidateId]`
Zoznam dokumentov kandidáta.

**Response:**
```json
{
  "documents": [...]
}
```

### GET `/api/documents/generate-pdf/[type]/[vkId]`
Generovanie PDF dokumentu.

**Params:**
- `type`: `sumarny-harok` | `zaverecne-hodnotenie` | `zapisnica`
- `vkId`: ID výberového konania

**Response:** PDF file download

## Audit

### GET `/api/audit`
Audit logy.

**Query params:**
- `userId?`: Filter podľa používateľa
- `akcia?`: Filter podľa akcie
- `from?`: Dátum od
- `to?`: Dátum do

**Response:**
```json
{
  "logs": [
    {
      "id": "log_1",
      "user": {...},
      "akcia": "LOGIN",
      "timestamp": "2025-01-01T10:00:00Z",
      "ipAddress": "192.168.1.1",
      "details": {...}
    }
  ]
}
```

## Health Check

### GET `/api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T12:00:00Z",
  "database": "connected",
  "uptime": 12345,
  "version": "1.0.0"
}
```

## Error Responses

Všetky endpointy vracajú štandardné error response:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Nemáte oprávnenie",
    "details": {...}
  }
}
```

**Error codes:**
- `UNAUTHORIZED` - 401
- `FORBIDDEN` - 403
- `NOT_FOUND` - 404
- `VALIDATION_ERROR` - 400
- `INTERNAL_ERROR` - 500
