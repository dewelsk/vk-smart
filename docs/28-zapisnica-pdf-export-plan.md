# Zápisnica – PDF export

**Dátum:** 2025-10-10  
**Status:** Návrh / na konzultáciu (`runtime=handler` nefunguje stabilne)

---

## Cieľ
Pripraviť automatizovaný export zápisnice z výberového konania do PDF, obsahovo totožný so šablónou `Zápisnica - vzor.docx`. Export sa spustí tlačidlom na detaile VK, backend vyplní údaje z databázy a uloží PDF do `storage/`, odkiaľ si ho môže administrátor stiahnuť.

---

## Analýza šablóny a zdrojov dát
*(v zátvorke je poznámka, ak dáta momentálne chýbajú)*

| Sekcia v zápisnici | Očakávané zdroje dát | Poznámky / otvorené body |
| --- | --- | --- |
| Hlavička (identifikátor VK, názov úradu, druh služby, dátum/čas, miesto) | `VyberoveKonanie` + väzby (inštitúcia) | `dátum a čas` sa v modeli nenachádza – treba potvrdiť, či využijeme `vk.date` alebo nový stĺpec (TODO). |
| Zloženie komisie (predseda, členovia + funkcie) | `CommissionMember` + väzba na `User` | Potrebujeme uloženú informáciu o absolvovaní školenia („riadený výberový rozhovor“) – v modeli nie je, dočasne vyznačíme ako *TODO*. |
| Zoznam prihlásených uchádzačov | `Candidate` + `User` | `cisIdentifier`, `email` máme; potrebujeme doplniť identifikátory žiadostí (VK/.../X) – overiť, z ktorého poľa. |
| Uchádzači nezaradení / nezúčastnení | model aktuálne neodlišuje dôvod nezaradenia alebo status neúčasti – vyznačiť prenesené „fiktívne“ údaje, kým nebude stavová logika. |
| Priebeh VK (formy overenia, body, percentá) | kombinácia `TestSession`, `TestResult`, plánovaná budúca ústna časť | Dáta pre ústny rozhovor zatiaľ chýbajú – v exporte označíme ako „TODO – doplniť po implementácii“. Treba pripraviť agregáciu bodov (suma/percentá). |
| Poradie úspešnosti, výsledok VK | `TestResult` + logika poradia podľa bodov | Potrebujeme jasné pravidlá na určovanie úspešnosti (napr. cut-off). Ak chýbajú, v exporte uvedieme fiktívne hodnoty so značkou `***`. |
| Podpisy členov komisie | `CommissionMember` + automatické miesto pre podpis | Reálne podpisy neriešime; do PDF len mená + miesto pre podpis (čiary). |
| Záver (vyhotovil, dátum, výsledok) | `VyberoveKonanie`, `User` (vyhotovil) | Zatiaľ nevieme, kto je „vyhotovil“ – navrhnúť pole (napr. aktuálne prihlásený užívateľ?). |

---

## Technický návrh
1. **Generovanie HTML + PDF:**
   - Vyhotovíme HTML šablónu 1:1 podľa Wordu (typografia, tabuľky, riadkovanie).
   - Backend použije `puppeteer` (headless Chromium) na render HTML → PDF (výhodou je lepšia kontrola nad layoutom).
   - Alternatíva: `@react-pdf/renderer` – odmietnuté kvôli obmedzenej typografii a zložitejším tabuľkám.
   - **Aktualizácia 2025-10-10:** kvôli Next.js obmedzeniam pri `react-dom/server` nepoužívame React komponenty; HTML generujeme cez vlastný templating (string builder).
   - **Otvorený problém:** `puppeteer.launch()` občas nedobehne v rámci Next.js API (Promises zostanú visieť). Treba zvážiť alternatívu (napr. Playwright, serverless-friendly lib, externý service) alebo vyriešiť event-loop blokovanie.

2. **Šablóna a dáta:**
   - Vytvoríme server-side template (napr. vlastný stringový builder, `ejs`, `nunjucks`).
   - Miesta bez dát označíme ako `*** TODO …***`, aby bolo jasné, kde chýbajú podklady.

3. **API vrstva:**
   - Endpoint `POST /api/admin/vk/[id]/export/zapisnica`.
   - Overenie práv: `SUPERADMIN` + `ADMIN` (príslušný rezort).
   - Načíta VK + detailné dáta (komisia, kandidáti, výsledky), pripraví HTML, vygeneruje PDF, uloží na `storage/exports/vk/<vkId>/zapisnica-<timestamp>.pdf`, vráti metadata vrátane download URL.
   - **Pozor:** (viď vyššie) pri `puppeteer.launch()` môže Next API timeoutovať, keďže Promise neukončí event loop.

4. **UI:**
   - Na detaile VK tlačidlo „Exportovať zápisnicu (PDF)“.
   - Po kliknutí loading stav, pri úspechu otvorí stiahnutie, pri chybe toast.
   - (Do budúcna: sekcia „Dokumenty“ s prehľadom exportov.)

5. **Ukladanie & storage:**
   - Ukladanie do `storage/exports/vk/<vkIdentifier>/...`. `.gitignore` už pokrýva `storage/`.
   - Dbať na prístupové práva (prístup len pre autorizovaných adminov – zabezpečené cez API s tokenom).

6. **Fiktívne / chýbajúce údaje:**
   - V prvej verzii budú sekcie bez dát explicitne označené. Po doplnení údajov v DB stačí upraviť data-mapper.

---

## Kroky implementácie
1. **Analýza dát & mapping**
   - Prejsť databázový model, doplniť mapping tabuľka → sekcia.
   - Identifikovať chýbajúce stĺpce (čas konania, dôvody nezaradenia, výsledok pohovoru...).
2. **HTML šablóna**
   - Postaviť layout podľa Wordu.
3. **Puppeteer integrácia**
   - Pridať závislosť, spúšťanie v Node runtime (prípadne fallback riešenie).
4. **API handler**
   - Fetch dát → mapovanie → generovanie PDF → ukladanie.
5. **UI & UX**
   - Button + toast.
6. **Dokumentácia**
   - Aktualizovať README / doc: zapiš TODO polia + varovanie pri spúšťaní exportu.

---

## Otvorené otázky / TODO
- `Dátum a čas konania` – v DB je len `vk.date`; treba doplniť hodiny/minúty.
- `Informácia o školení komisie` – chýba v modeli, zatiaľ placeholder.
- `Dôvod nezaradenia` / `nezúčastnil sa` – chýba stavová logika.
- `Výsledok VK` – definovať pravidlá (percentá/prahy).
- Úschova generovaných PDF (cleanup) – zatiaľ manuálne.
- **Puppeteer vs Next runtime** – treba doriešiť (alternatíva Playwright, resp. fly.io service...).

---

## Ďalšie nápady
- Logovať meta-informácie o exporte (kto/kedy).
- Využiť mechanizmus aj pre iné dokumenty (Sumárny hárok, Záverečné hodnotenie).
- Po uzavretí VK generovať zápisnicu automaticky (mimo scope).

