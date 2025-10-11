# Scripts

Utility scripty pre projekt.

---

## Import batérie otázok

- **`import-question-battery.ts`** – načíta kategórie a otázky z dokumentu „Bateŕia otázok RR - komisii.docx“ a uloží ich do databázy.

### Použitie

```bash
npx tsx scripts/import-question-battery.ts

# Prípadne z vlastnej cesty
npx tsx scripts/import-question-battery.ts /cesta/k/súboru.docx
```

Skript je idempotentný – opätovné spustenie aktualizuje existujúce záznamy a nevyrobí duplicity.

---

## ASCII Wireframe Generator

### Súbory

- **`generate-wireframe.py`** - Príklad wireframe generátora
- **`wireframe-template.py`** - Template pre nové wireframy

### Použitie

#### Metóda 1: Použiť template

```bash
# Skopíruj template
cp scripts/wireframe-template.py /tmp/my-screen.py

# Edituj súbor
nano /tmp/my-screen.py  # alebo tvoj editor

# Spusti
python3 /tmp/my-screen.py
```

#### Metóda 2: Priamo upraviť generate-wireframe.py

```bash
# Edituj lines array v súbore
nano scripts/generate-wireframe.py

# Spusti
python3 scripts/generate-wireframe.py
```

#### Metóda 3: Inline (rýchle použitie)

```bash
python3 << 'EOF'
WIDTH = 58

lines = [
    "  Dashboard",
    "",
    "  Content here",
]

border = "+" + "-" * WIDTH + "+"
print(border)
for line in lines:
    print("|" + line.ljust(WIDTH) + "|")
print(border)
EOF
```

### Overenie správnosti

```bash
# Ulož výstup do súboru
python3 scripts/generate-wireframe.py > /tmp/wireframe.txt

# Overte, že všetky riadky majú rovnakú dĺžku
awk '{print length}' /tmp/wireframe.txt | sort -u

# Malo by vrátiť jedno číslo (napr. 61)
```

### Príklad

**Input (lines array):**
```python
lines = [
    "  [Menu] Dashboard                 [Admin] [Odhlasit sa]",
    "",
    "  Welcome to the system",
]
```

**Output:**
```
+----------------------------------------------------------+
|  [Menu] Dashboard                 [Admin] [Odhlasit sa]  |
|                                                          |
|  Welcome to the system                                   |
+----------------------------------------------------------+
```

### Tips

1. **Začni s 2 medzerami** na začiatku každého riadku (pre odsadenie)
2. **Použij WIDTH = 58** (alebo adjust podľa potreby)
3. **Prázdne riadky** = prázdny string `""`
4. **Bez diakritiky** v ASCII wireframes (pre kompatibilitu)
5. **Overuj dĺžku riadkov** pomocou `awk` príkazu vyššie

---

## Ďalšie scripty (budúce)

- `seed.sh` - Database seeding helper
- `backup.sh` - Backup databázy a súborov
- `deploy.sh` - Deployment script
