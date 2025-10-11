# Bateria otázok – import a správa

**Dátum:** 2025-10-10  
**Stav:** Implementované

---

## Ciele
- Načítať otázky z dokumentu `Bateŕia otázok RR - komisii.docx` a uložiť ich do databázy.
- Sprístupniť v administrácii novú sekciu „Bateria otázok“ s prehľadom kategórií.
- Umožniť editáciu názvu/popisu kategórie a CRUD operácie nad otázkami v danej kategórii.

---

## Analýza vstupného dokumentu
- Dokument obsahuje **10 hlavných kategórií** (Sebadôvera, Svedomitosť a spoľahlivosť, ...).
- Pri každej kategórii je:
  - Názov kategórie (jednoznačný, presné znenie zachováme).
  - Krátky popis (1–2 vety) – použijeme ako `description`.
  - Zoznam otázok (1 otázka na riadok). Otázky bezpečne uložíme ako plain text.
- Dokument neobsahuje informáciu o poradí / priorite. Budeme ukladať `sort_order` podľa pôvodného poradia v dokumente.

---

## Návrh databázy
Vytvoríme dve nové tabuľky (Prisma modely):
1. `QuestionCategory` (napr. `question_categories`):
   - `id` (cuid)
   - `name` (unikátne)
   - `description`
   - `sortOrder`
   - `createdAt`, `updatedAt`
2. `QuestionItem` (napr. `question_items`):
   - `id` (cuid)
   - `categoryId` (FK na `QuestionCategory`)
   - `text`
   - `sortOrder`
   - `createdAt`, `updatedAt`

---

## Import dát
- Použijeme skript (TS/Node) na spracovanie DOCX cez `mammoth` alebo podobnú knižnicu.
- Parsovanie: pre každý názov kategórie uložíme popis a následné odrážky/riadky ako otázky.
- Skript vykoná `upsert`: ak kategória existuje (podľa mena), aktualizuje text a nahradí otázky; inak ju vytvorí.
- Otázky uložíme s poradím (1..N) podľa poradia v dokumente.
- Skript pridáme do `scripts/import-question-battery.ts` (alebo podobne) a zdokumentujeme v README.

---

## API / Backend
- Endpointy pod `/api/admin/questions` (SUPERADMIN + ADMIN):
  - `GET /categories` – zoznam kategórií (name, description, counts, updatedAt).
  - `GET /categories/[id]` – detail vrátane otázok.
  - `PUT /categories/[id]` – update názvu a popisu.
  - `POST /categories/[id]/questions` – pridanie otázky.
  - `PUT /categories/[id]/questions/[questionId]` – editácia otázky.
  - `DELETE /categories/[id]/questions/[questionId]` – odstránenie.
- Pri zmene otázok aktualizovať `updatedAt` kategórie.

### Backend testy
- `tests/backend/question-categories.test.ts` (Vitest + Prisma):
  - CRUD pre kategóriu (bez delete), validácia povinných polí.
  - CRUD pre otázky (create/update/delete).

---

## Frontend
### Navigácia
- V menu „Výberové konanie“ pridáme položku **„Bateria otázok“** (len pre SUPERADMIN/ADMIN). Klik vedie na `/questions/battery`.

### Zoznam kategórií
- Tabuľka so stĺpcami: `Kategória | Popis | Počet otázok | Posledná aktualizácia`.
- Každý riadok má link „Spravovať“ → detail kategórie.

### Detail kategórie
- Horná časť: formulár s názvom a popisom (inline edit, tlačidlo „Uložiť“).
- Nižšie tabulka otázok:
  - Text otázky (inline edit textarea / modal), tlačidlá `Upraviť`, `Vymazať`.
  - „Pridať otázku“ – otvorí modal alebo rozbalený formulár.
- Po operáciách zobraziť toast (úspech/neúspech).

### UI návrh
- Vytvoriť dokument nášho štýlu v `obrazovky/admin/17_bateria_otazok.md` (nadviazanie na existujúci číselný rad), s ascii wireframe pre zoznam a detail.

---

## Postup implementácie
1. **Prisma migrácia** – pridať modely `QuestionCategory`, `QuestionItem`.
2. **Import skript** – naparsovať DOCX → uložiť do DB (písané tak, aby bolo možné spustiť kedykoľvek).
3. **API routes & služby** – CRUD endpointy podľa návrhu.
4. **Frontend** – menu + stránky (list/detail, formuláre, stavy).
5. **Testy** – Vitest backend testy pre API/service.
6. **Dokumentácia** – aktualizovať README (ako spustiť import) + pridať wireframe do `obrazovky/admin`.

---

## Otvorené otázky
- Má byť zmienka o ústnom testovaní alebo ďalších podtypoch otázok (nateraz nie)?
- Budeme potrebovať audit trail zmien (zatiaľ nie, ale logika v budúcnosti)?
- Ako často sa bude import spúšťať „automaticky“ (zatím manual script)?
- Potrebujeme filtrovať otázky podľa typu (napr. pre rôzne roly) – nateraz nie.
