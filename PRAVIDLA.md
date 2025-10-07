# PRAVIDLA - Ako komunikovať s Claude Code

Tento súbor obsahuje pravidlá a formulácie, ktoré pomáhajú dosiahnuť konzistentný a kvalitný kód podľa `CLAUDE.md`.

---

## 🎯 Základné pravidlo

**VŽDY** keď zadávate úlohu týkajúcu sa formulárov, validácie, UI komponentov alebo testov, **explicitne spomente CLAUDE.md**.

---

## 📝 Odporúčané formulácie

### Pre formuláre a validáciu

```
Vytvor formulár [názov] PODĽA CLAUDE.md
```

```
Pridaj validáciu do formulára PODĽA CLAUDE.md - sekcia "Formuláre a validácia"
```

```
Prejdi si checklist z CLAUDE.md sekcie "Formuláre a validácia"
a potvrď každý bod pred implementáciou
```

```
Nezabudni:
- Inline errors pod každým input fieldom
- Červené bordery pri chybe (border-red-500)
- data-testid pre všetky elementy
- Clear error pri zmene hodnoty
- Auto-scroll na prvý error
```

### Pre E2E testy

```
Vytvor E2E test PODĽA CLAUDE.md - používaj data-testid, nie text selectors
```

```
Skontroluj či test dodržiava pravidlo 90/10 z CLAUDE.md
```

```
NIKDY nepoužívaj text selectors. Používaj iba:
- data-testid
- CSS triedy
- ID elementov
```

### Pre UI komponenty

```
Pridaj ikony PODĽA CLAUDE.md - používaj Heroicons, nie emoji
```

```
Pre potvrdenie použi ConfirmModal z CLAUDE.md, NIKDY nepoužívaj window.confirm()
```

### Pre code review

```
Skontroluj či kód spĺňa CLAUDE.md požiadavky pred spustením testov
```

```
Urob code review podľa CLAUDE.md checklistov
```

---

## ✅ Checklist pred začatím úlohy

Keď zadávate úlohu, ktorá zahŕňa:

- [ ] **Formulár** → Spomenúť "PODĽA CLAUDE.md sekcia Formuláre"
- [ ] **Validáciu** → Spomenúť "inline errors, červené bordery, data-testid"
- [ ] **E2E test** → Spomenúť "používaj data-testid, nie text"
- [ ] **Ikony** → Spomenúť "používaj Heroicons, nie emoji"
- [ ] **Potvrdenie** → Spomenúť "používaj ConfirmModal, nie confirm()"
- [ ] **Toast správy** → Spomenúť "toast.loading → dismiss → success/error"

---

## 🚫 Čo NEHOVORIŤ

❌ "Vytvor formulár pre kategórie"
✅ "Vytvor formulár pre kategórie PODĽA CLAUDE.md"

❌ "Pridaj validáciu"
✅ "Pridaj validáciu s inline errors a červenými bordermi PODĽA CLAUDE.md"

❌ "Vytvor test"
✅ "Vytvor E2E test s data-testid PODĽA CLAUDE.md"

❌ "Pridaj ikonu"
✅ "Pridaj Heroicon (nie emoji) PODĽA CLAUDE.md"

---

## 🔍 Ako skontrolovať dodržiavanie pravidiel

### Pre formuláre:

```
Skontroluj:
1. Má každý input data-testid?
2. Zobrazujú sa inline error messages?
3. Majú chybné inputy červený border (border-red-500)?
4. Clearujú sa errory pri zmene hodnoty?
5. Je validácia konzistentná s CLAUDE.md?
```

### Pre E2E testy:

```
Skontroluj:
1. Používa test getByTestId() namiesto locator('text=...')?
2. Má každý testovaný element data-testid?
3. Je test nezávislý od textového obsahu?
4. Dodržiava test pravidlo 90/10?
```

### Pre UI komponenty:

```
Skontroluj:
1. Používajú sa Heroicons namiesto emoji?
2. Používa sa ConfirmModal namiesto confirm()?
3. Používajú sa toast správy správne (loading → dismiss → success/error)?
```

---

## 💡 Tipy pre efektívnu komunikáciu

### Keď niečo nefunguje:

```
"Oprav [problém] a uisti sa, že dodržiavaš CLAUDE.md pravidlá pre [sekcia]"
```

### Keď chcete pridať novú funkcionalitu:

```
"Pridaj [funkcionalita] PODĽA CLAUDE.md. Pred implementáciou prejdi si
relevantné checklisty."
```

### Keď robíte code review:

```
"Urob code review tohto súboru podľa CLAUDE.md a uprav všetko,
čo nie je v súlade s pravidlami"
```

---

## 📚 Súvisiace dokumenty

- **CLAUDE.md** - Hlavné pravidlá pre projekt (data-testid, validácia, ikony...)
- **docs/13-testovanie.md** - Detailné pravidlá pre E2E testy

---

## 🎓 Príklad dobrého zadania úlohy

### ❌ ZLE:
> "Vytvor formulár na pridanie používateľa"

### ✅ DOBRE:
> "Vytvor formulár na pridanie používateľa PODĽA CLAUDE.md sekcie 'Formuláre a validácia'.
>
> Skontroluj pred implementáciou:
> - Inline validácia s červenými bordermi
> - data-testid na všetkých elementoch
> - Clear errors pri zmene
> - Auto-scroll na prvý error
> - Toast správy podľa patternu"

---

**Zapamätaj si:** Čím explicitnejšie spomeniete CLAUDE.md a konkrétne požiadavky,
tým väčšia šanca, že kód bude konzistentný a kvalitný na prvýkrát.
