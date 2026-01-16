/fig# Figma Redesign Skill

Tento skill slúži na aplikovanie Figma dizajnu na existujúce alebo nové obrazovky v projekte.

## Argumenty

- `$ARGUMENTS` - Figma URL s node-id (napr. `https://www.figma.com/design/.../...?node-id=39-13922`)

## Workflow

### Krok 1: Získanie Figma dizajnu

1. Extrahuj `node-id` z poskytnutej Figma URL
   - Formát URL: `https://www.figma.com/design/:fileKey/:fileName?node-id=X-Y`
   - Node ID je vo formáte `X-Y` alebo `X:Y`

2. Použi `mcp__figma-desktop__get_screenshot` tool na získanie screenshotu Figma dizajnu
   - Tento screenshot bude slúžiť ako referencia

3. Použi `mcp__figma-desktop__get_design_context` tool na získanie detailov dizajnu:
   - Farby
   - Fonty a ich veľkosti
   - Spacing
   - Border radius
   - Layout

### Krok 2: Analýza aktuálneho stavu

1. Spýtaj sa používateľa, ktorý súbor/stránku treba upraviť
   - Ak ide o novú obrazovku, spýtaj sa na cestu kde ju vytvoriť

2. Ak ide o existujúcu obrazovku:
   - Prečítaj aktuálny kód stránky
   - Urob screenshot aktuálnej implementácie pomocou Playwright
   - Identifikuj rozdiely medzi Figma dizajnom a aktuálnou implementáciou

### Krok 3: Plánovanie zmien

Vytvor zoznam zmien, ktoré treba spraviť:

**Kontroluj tieto aspekty:**
- [ ] Rozloženie stránky (layout, grid, flex)
- [ ] Pozadie stránky a sekcií
- [ ] Farby (použiť design system `ds-*` z Tailwind)
- [ ] Fonty (General Sans pre nadpisy, Inter pre text)
- [ ] Veľkosti fontov
- [ ] Font weight
- [ ] Spacing (padding, margin, gap)
- [ ] Border radius (zaoblenie rohov)
- [ ] Tiene (shadows)
- [ ] Ikony (použiť Heroicons)
- [ ] Badge komponenty (farby, veľkosti)
- [ ] Tlačidlá (štýly, farby)
- [ ] Input polia
- [ ] Nové komponenty ktoré treba pridať
- [ ] Komponenty ktoré treba odstrániť

**Dôležité:**
- Spýtaj sa používateľa či má nejaké výnimky (čo nechce implementovať z Figmy alebo čo chce zachovať)

### Krok 4: Implementácia

1. Aplikuj zmeny postupne podľa zoznamu
2. Používaj Tailwind CSS triedy
3. Používaj design system farby:
   - `ds-black-100` (#2A222B) - hlavný text
   - `ds-black-30` (#BFBDBF) - sekundárny text
   - `ds-grey-50` (#F4F3F5) - svetlé pozadie
   - `ds-grey-40` (#F7F7F8) - najsvetlejšie pozadie
   - `ds-purple-80` (#504EDD) - primárna akcia
   - `ds-purple-10` (#EDEDFC) - svetlá fialová
   - `ds-green` (#3DAC67) - úspech
   - `ds-green-light` (#9EE2B5) - svetlá zelená
   - `ds-red` (#B93429) - chyba
   - `ds-red-light` (#FDC5BB) - svetlá červená

4. Používaj správne fonty:
   - `font-heading` - General Sans pre nadpisy
   - `font-sans` - Inter pre bežný text

### Krok 5: Validácia

1. Urob screenshot implementovanej stránky pomocou Playwright:
   ```
   mcp__playwright__playwright_navigate -> URL stránky
   mcp__playwright__playwright_screenshot -> uložiť screenshot
   ```

2. Zobraz oba screenshoty používateľovi:
   - Figma dizajn (referencia)
   - Aktuálna implementácia

3. Spýtaj sa používateľa:
   - "Zodpovedá implementácia Figma dizajnu?"
   - "Sú nejaké rozdiely ktoré treba opraviť?"

4. Ak sú rozdiely, oprav ich a opakuj validáciu

## Použitie

```
/figma-redesign https://www.figma.com/design/AxHb5Mf8oCubiYyDDtObig/vyberove-konanie-smart?node-id=39-13922
```

## Príklad konverzácie

**Používateľ:** /figma-redesign https://www.figma.com/design/.../...?node-id=138-22299

**Claude:**
1. Získavam Figma dizajn pre node 138:22299...
2. [Zobrazí screenshot Figma dizajnu]
3. Ktorú stránku v projekte chceš upraviť podľa tohto dizajnu? (alebo mám vytvoriť novú?)

**Používateľ:** app/(admin-protected)/vk/page.tsx

**Claude:**
4. Analyzujem aktuálnu stránku...
5. [Zobrazí screenshot aktuálnej implementácie]
6. Identifikoval som tieto rozdiely:
   - Pozadie stránky: aktuálne sivé, má byť biele
   - Filter sidebar: chýba badge s počtom aktívnych filtrov
   - ...
7. Sú nejaké výnimky? Čo nechceš meniť?

**Používateľ:** Navigačné menu nechaj ako je

**Claude:**
8. OK, menu ponechám. Implementujem ostatné zmeny...
9. [Aplikuje zmeny]
10. [Zobrazí nový screenshot]
11. Zodpovedá implementácia dizajnu?
