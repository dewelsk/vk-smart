# Obrazovka: Bateria otázok

**Route:** `/questions/battery`

**Účel:** Administrátor spravuje kategórie a otázky používané pri riadenom rozhovore (RR). Na hlavovej obrazovke vidí súhrn kategórií, môže otvoriť detail, upraviť názov/popisy a pridávať/meniť/mazať otázky.

**Role:** SUPERADMIN, ADMIN (len v rámci vlastného rezortu – ak sa neskôr kategórie zúžia podľa inštitúcií)

---

## Zoznam kategórií

```
┌────────────────────────────────────────────────────────────────────────┐
│  Bateria otázok                                         [ Importovať ] │
├────────────────────────────────────────────────────────────────────────┤
│  Popis: Databáza otázok pre riadený rozhovor (RR).                      │
│  Kategórie vychádzajú z dokumentu „Bateŕia otá­zok RR - komisii“.       │
├────────────────────────────────────────────────────────────────────────┤
│  Hľadať: [_____________________]  |  Filtrovať: [ Všetko v zozname ]    │
├────────────────────────────────────────────────────────────────────────┤
│  KATEGÓRIA              │ POPIS                                   │ Q │ AKT. │ │
├─────────────────────────┼─────────────────────────────────────────┼───┼──────┤
│  Sebadôvera             │ Viera vo svoje schopnosti…              │10 │ 8.10 │ [Spravovať] │
│  Svedomitosť a …        │ Zodpovedný prístup k práci…             │12 │ 7.10 │ [Spravovať] │
│  Samostatnosť           │ Schopnosť konať a rozhodovať samostatne │ 8 │ 7.10 │ [Spravovať] │
│  ... (10 riadkov)                                                           │
└────────────────────────────────────────────────────────────────────────┘
Legenda: „Q“ = počet otázok, „Akt.“ = dátum poslednej zmeny (dd.mm).
```

### Interakcie
- Klik na **Spravovať** otvorí detail kategórie (`/questions/battery/[id]`).
- Tlačidlo **Importovať** spustí manuálny import (budúce rozšírenie – spúšťa skript).
- Vyhľadávanie filtrovaním na klientovi (fulltext v názve/popise).

---

## Detail kategórie

**Route:** `/questions/battery/[categoryId]`

```
┌────────────────────────────────────────────────────────────────────────┐
│  Sebadôvera                                      Posledná úprava: 8.10 │
├────────────────────────────────────────────────────────────────────────┤
│  Kategória pre riadený rozhovor                                                │
│  Názov:      [ Sebadôvera                         ]                            │
│  Popis:      [ Viera vo svoje schopnosti splniť… ] (textarea)                 │
│  [ Uložiť zmeny ]                     [ Zrušiť ]                              │
├────────────────────────────────────────────────────────────────────────┤
│  Otázky                                                                          │
│  ┌───────────────────────────────────────────────────────────────────────┐     │
│  │  Hľadať otázku: [____________]          |  Počet: 10                │ │     │
│  ├───────────────────────┬──────────────────────────────────────────────┤ │     │
│  │ # │ Otázka            │ Akcie                                       │ │     │
│  ├───────────────────────┼──────────────────────────────────────────────┤ │     │
│  │ 1 │ Keď máte možnosť… │ [ Upraviť ] [ Vymazať ]                      │ │     │
│  │ 2 │ Aké úlohy sú …    │ [ Upraviť ] [ Vymazať ]                      │ │     │
│  │ 3 │ Ako ste využili…  │ [ Upraviť ] [ Vymazať ]                      │ │     │
│  │ … │ ...               │ ...                                          │ │     │
│  └───────────────────────┴──────────────────────────────────────────────┘ │     │
│                                                                              │
│  [+ Pridať otázku]                                                           │
└────────────────────────────────────────────────────────────────────────┘
```

### Stavy
- **Upraviť otázku:**
  - po kliknutí na „Upraviť“ sa riadok prepne na editáciu (textarea + tlačidlá `Uložiť`, `Zrušiť`).
  - `Vymazať` otvorí ConfirmModal („Naozaj chcete odstrániť otázku?“).
- **Pridať otázku:**
  - tlačidlo otvorí inline formulár: textarea + `Pridať` / `Zrušiť`.
- **Validácia:**
  - názov/popisy vyžadujú text, otázka musí obsahovať aspoň 5 znakov; chyby zobrazíme pod poľom.
- **Loading/Empty:**
  - pri načítavaní skeleton, pri prázdnom zozname text „Kategória zatiaľ nemá otázky“ + CTA pridať.

### UX poznámky
- Po úspešnom uloženom update / pridaní / zmazaní: toast „Otázka bola uložená“.
- `Posledná úprava` na hornej lište sa aktualizuje po každej zmene v kategórii.
- `Počet` v tabuľke sa prepočíta po každej zmene.

---

## Modal – potvrdzovanie operácií

Použijeme existujúci `ConfirmModal`:
```
[ Varovanie ikonka ]  Vymazať otázku?
„Otázka bude nenávratne odstránená. Pokračovať?“
Buttons: [Zrušiť] [Vymazať]
```

---

## Technické poznámky k UI
- Formulár kategórie a otázok využije `react-hook-form` (bez reloadu).
- Tabuľka otázok – klasický layout, nepotrebujeme full `DataTable` (môžeme použiť tailwind/styled UI).
- Pre zmenu poradia zatiaľ neimplementujeme drag&drop; ak bude treba neskôr, doplní sa.

---

## Napojenie na backend
- API route names:
  - `GET /api/admin/question-categories`
  - `GET /api/admin/question-categories/[id]`
  - `PUT /api/admin/question-categories/[id]`
  - `POST /api/admin/question-categories/[id]/questions`
  - `PUT /api/admin/question-categories/[id]/questions/[questionId]`
  - `DELETE ...`
- Autorizácia rovnaká ako pri iných admin sekciách (token z NextAuth session).

---

## Legendy / stavy
- Farby a typografia držíme v súlade s admin UI (Tailwind grey/blue palette).
- Loading: skeleton pre tabuľku, spinner pri akcii („Ukladám…“).
- Empty state: box s ikonou a textom „Kategorie zatiaľ nemá otázky“ + CTA na pridanie.

