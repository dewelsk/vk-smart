# Stav úprav: Detail testu – typ a podmienky

Cielom je

Zoznam testov:
Ukazovat 2 nove stlpce:
Typ test (mto co je v meenu Test/Typy testov)
Stlpec Podmienky (ak ma Typ testu podmienky, zobrazime tento udaj, ak nema tak potom -)

Detail testu:
Aplikovat pravdila podla komentarov nizsie



==============

## Čo je hotové
- Základná obrazovka detailu testu sa refaktorovala: slider „Náročnosť“ je nahradený vstupom typu number a sekcia „Odporúčané nastavenia“ sa premenovala na **Nastavenie**.
*** Uplne zrusit Náročnosť testu (1–10) *, Ak to vyzaduje databaza alebo testy, tak tam posielajme napriklad 0
*** Miesto toho sa bude zobrazovat Podmienky testu. Ak ma Typ testu podmienky, zobrazi sa select box. Ak podmienky nema, nic sa nezobrazuje.

- V nastaveniach je nový select `Typ testu`; pri typoch s podmienkami sa zobrazí aj select pre podmienku (voliteľné). Pod podmienku sa vypisuje opis z dokumentu „Typy a podmienky pri jednotlivých testoch“.
*** Toto treba dorobit, vid vyssie

- Kategória testu je už len read-only zobrazovanie (mapuje sa na prvú kategóriu priradenú k typu – `test_categories` je stále prítomná).
*** Uplne odstranit Kategoria testu

- Zo zoznamu testov (`/tests`) sa odstránila vizuálna lišta náročnosti; namiesto nej sa zobrazuje stĺpec **Typ testu** a vedľa neho textová „Náročnosť“ (`x/10`).
*** Odstranit Narocnost. Miesto neho zobrazit stlpec Podmienky. Vid prvy bod z tohto zoznamu

- Z detailu testu zmizli pôvodné povolené typy otázok (`allowedQuestionTypes`); question edit modal si však ponecháva logiku obmedzení.
*** OK

- Sidebar aj detail pracujú s novými hookmi: `useTestTypes`, `useTestType` pre získanie typov a ich podmienok.
*** OK

- API `PATCH /api/admin/tests/[id]` už akceptuje voliteľné pole `type` (enum) a hodnotu ukladá do `tests.type`.
*** nemozeme pouzivat enum. V stlpci type ma byt identifikator z tabulky test_types
*** zaroven si potrebujeme do testu zapisat aj Podmienky testu

- E2E testy upravené tak, aby pracovali s novými prvkami (`test-type-select`, `test-difficulty-input`) a už nečakali slider či badgy typov v zozname otázok.
*** test-difficulty-input uz prestavame pouzivat

- Seed (`prisma/seed.ts`) mapuje staré názvy typov k novým a prepisuje podmienky podľa PDF. Zaznamenáva aj legacy názvy („Štátny jazyk“ -> „Test zo štátneho jazyka“) a seeduje `test_type_conditions`.
- Migrácie: `20251011120000_add_test_type_conditions` je aplikovaná.

## Čo ostáva / TODO
- API: zvážiť, či `allowedQuestionTypes` ešte potrebujeme; v UI už nie je.
- UI: zvážiť, či detail otázky má ponechať select typov (momentálne sa ukazuje len ak typ umožňuje viac možností).
- TESTY: `test-detail` a `test-navigation` pre úpravy priebežne aktualizované, ale odporúčané je pustiť `npm run test:e2e -- tests/e2e/admin/test-detail.spec.ts` a `...test-navigation.spec.ts`.
- DB seed: hack na mapovanie kategórií vs. typov – zatiaľ predpokladáme, že vždy existuje kategória s `typeId` nového typu. Inak by bolo treba doplniť fallback.

## Poznámky k implementácii
- Typy a podmienky pochádzajú z `test_type_conditions`; UI zobrazuje popis podľa PDF.
- `TEST_TYPE_NAME_TO_ENUM` mapuje textový názov (seed) na enum `TestTyp`; pri zakladaní/uložení posielame `type` späť do API.
- V prehľade / stránke so zoznamom testov sa typ zobrazuje badge-om (`getTestTypeBadge`).
- `tests` ešte stále obsahuje `allowedQuestionTypes`, ale momentálne sa needitujú.