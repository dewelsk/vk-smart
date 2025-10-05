# ASCII Wireframes - Návod na vytváranie

## Účel

Pre špecifikáciu obrazoviek používame ASCII wireframes. Tieto wireframes musia mať **perfektne zarovnané riadky** (každý riadok rovnakej dĺžky), aby sa správne zobrazovali v editore.

---

## Prečo Python script?

Manuálne vytváranie ASCII wireframov je náchylné na chyby:
- Rôzna dĺžka riadkov
- Problémy s Unicode znakmi
- Medzery vs. tabulátory
- Neviditeľné znaky

**Python script garantuje:**
✅ Každý riadok má presnú dĺžku
✅ Konzistentné padding
✅ Žiadne problémy s encoding

---

## Python Script Template

```python
#!/usr/bin/env python3

WIDTH = 58  # Content width (adjust as needed)

lines = [
    "  [Menu] Vyberove konania        [Admin] [Odhlasit sa]",
    "",
    "  Dashboard",
    "  ==========",
    "",
    "  +------------+ +------------+ +------------+",
    "  | Aktivne VK | | Uchadzaci  | | Prebieha   |",
    "  |            | |            | |            |",
    "  |     5      | |     42     | | testov: 3  |",
    "  +------------+ +------------+ +------------+",
    "",
    # ... add more lines
]

border = "+" + "-" * WIDTH + "+"
print(border)
for line in lines:
    padded = line.ljust(WIDTH)  # Left-justify and pad to WIDTH
    print("|" + padded + "|")
print(border)
```

---

## Ako používať

### 1. Vytvor Python script

```bash
# Create temp file
cat > /tmp/wireframe.py << 'EOF'
WIDTH = 58

lines = [
    "  Your content here",
    "",
    "  More content",
]

border = "+" + "-" * WIDTH + "+"
print(border)
for line in lines:
    padded = line.ljust(WIDTH)
    print("|" + padded + "|")
print(border)
EOF
```

### 2. Spusti script

```bash
python3 /tmp/wireframe.py
```

### 3. Skopíruj výstup do .md súboru

Výstup vlož do markdown súboru medzi ` ``` ` bloky:

````markdown
## ASCII Wireframe

```
+----------------------------------------------------------+
|  Your content here                                        |
|                                                          |
|  More content                                            |
+----------------------------------------------------------+
```
````

---

## Best Practices

### 1. Odporúčaná šírka

- **Obsah (WIDTH):** 58 znakov
- **Celková šírka:** 60 znakov (vrátane `|` na oboch stranách)
- **S newline:** 61 znakov

### 2. Padding

- Začni každý riadok s **2 medzerami** pre odsadenie
- Použij `.ljust(WIDTH)` pre automatické padding vpravo

### 3. Vnorené boxy

```python
lines = [
    "  +------------+",  # Inner box
    "  | Content    |",
    "  +------------+",
]
```

### 4. Prázdne riadky

```python
lines = [
    "  Section 1",
    "",  # Empty line - will be padded automatically
    "  Section 2",
]
```

---

## Overenie správnosti

### Bash one-liner na overenie dĺžky riadkov

```bash
# Check all lines have same length
awk '{print length}' obrazovky/admin/01_dashboard.md | sort -u
```

**Očakávaný výstup:** Jedno číslo (napr. `61`)

Ak vidíš viac čísel → riadky nie sú rovnakej dĺžky!

### Kontrola konkrétnych riadkov

```bash
# Check line 11
sed -n '11p' file.md | wc -c

# Check line 12
sed -n '12p' file.md | wc -c
```

Obe by mali vrátiť rovnaký počet.

---

## Príklad: Kompletný wireframe

```python
#!/usr/bin/env python3

WIDTH = 58

lines = [
    "  [Header]                                  [User Menu]",
    "",
    "  Page Title",
    "  ==========",
    "",
    "  +-----------------------+  +-----------------------+",
    "  | Card 1                |  | Card 2                |",
    "  |                       |  |                       |",
    "  | Content here          |  | More content          |",
    "  +-----------------------+  +-----------------------+",
    "",
    "  Main content section",
    "  ---------------------------------------------------",
    "",
    "  +----------------------------------------------------+",
    "  | Item 1 | Description              | [Button]      |",
    "  | Item 2 | Another description      | [Button]      |",
    "  +----------------------------------------------------+",
    "",
    "  [Footer info]                              [Actions]",
]

border = "+" + "-" * WIDTH + "+"
print(border)
for line in lines:
    padded = line.ljust(WIDTH)
    print("|" + padded + "|")
print(border)
```

**Výstup:**
```
+----------------------------------------------------------+
|  [Header]                                  [User Menu]    |
|                                                          |
|  Page Title                                              |
|  ==========                                              |
|                                                          |
|  +-----------------------+  +-----------------------+    |
|  | Card 1                |  | Card 2                |    |
|  |                       |  |                       |    |
|  | Content here          |  | More content          |    |
|  +-----------------------+  +-----------------------+    |
|                                                          |
|  Main content section                                    |
|  ---------------------------------------------------    |
|                                                          |
|  +----------------------------------------------------+  |
|  | Item 1 | Description              | [Button]      |  |
|  | Item 2 | Another description      | [Button]      |  |
|  +----------------------------------------------------+  |
|                                                          |
|  [Footer info]                              [Actions]    |
+----------------------------------------------------------+
```

---

## Troubleshooting

### Problém: Rôzna dĺžka riadkov

**Príčina:** Niektoré riadky majú viac znakov ako WIDTH

**Riešenie:**
```python
# Debug - print line lengths
for i, line in enumerate(lines, 1):
    print(f"Line {i}: {len(line)} chars")
```

### Problém: Unicode znaky sa rozbiť

**Príčina:** Slovenské diakritické znamienka (č, š, ž, ...)

**Riešenie:** Odstráň diakritiku z ASCII wireframov
```python
lines = [
    "  Uchadzaci",  # NOT: Uchádzači
    "  Vytvorenie VK",  # OK
]
```

### Problém: Tab vs. medzery

**Riešenie:** Nikdy nepoužívaj tabulátory! Len medzery.

```python
"  Content"  # ✅ 2 spaces
"\tContent"  # ❌ Tab character
```

---

## Quick Reference

```bash
# Generate wireframe
python3 /tmp/wireframe.py > /tmp/output.txt

# Verify line lengths
awk '{print length}' /tmp/output.txt | sort -u

# Should return single number (e.g., 61)
```

---

## Zhrnutie

1. ✅ **Vždy použi Python script** pre ASCII wireframes
2. ✅ Nastav **WIDTH = 58** (alebo adjust)
3. ✅ Použij `.ljust(WIDTH)` pre padding
4. ✅ **Odstráň diakritiku** z wireframov
5. ✅ **Overu dĺžku riadkov** po vygenerovaní
6. ✅ Žiadne **tab znaky**, len **medzery**

---

## Šablóna pre nové wireframy

### Hotové scripty v projekte

Vytvorili sme hotové scripty v adresári `scripts/`:

1. **`scripts/generate-wireframe.py`** - Príklad s demo obsahom
2. **`scripts/wireframe-template.py`** - Template na kopírovanie

### Použitie hotových scriptov

```bash
# Metóda 1: Použiť template
cp scripts/wireframe-template.py /tmp/my-screen.py
nano /tmp/my-screen.py  # Edituj lines array
python3 /tmp/my-screen.py

# Metóda 2: Spusti demo
python3 scripts/generate-wireframe.py

# Metóda 3: Ulož výstup
python3 scripts/generate-wireframe.py > wireframe.txt
```

### Vlastný template

Ak chceš vytvoriť vlastný template:

```python
#!/usr/bin/env python3
# ASCII Wireframe Generator

WIDTH = 58  # Adjust as needed

lines = [
    # Add your lines here
    "  Line 1",
    "",
    "  Line 2",
]

# Generate wireframe
border = "+" + "-" * WIDTH + "+"
print(border)
for line in lines:
    padded = line.ljust(WIDTH)
    print("|" + padded + "|")
print(border)
```

Viac info: `scripts/README.md`
