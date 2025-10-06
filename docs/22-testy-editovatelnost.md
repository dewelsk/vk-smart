# Editovateľnosť testov

## Business pravidlo

**Test, ktorý bol už použitý v nejakom výberovom konaní, nemôže byť editovaný.**

### Dôvod
- Zmena testu by invalidovala už existujúce výsledky uchádzačov
- Zachovanie konzistencie dát
- Audit trail - test musí zostať v pôvodnej podobe

## Implementácia

### 1. Detekcia použitia testu

Test je považovaný za "použitý", ak:
```typescript
test.vkAssignments.length > 0
```

Teda ak existuje aspoň jeden záznam v tabuľke `vk_tests`, ktorý odkazuje na tento test.

### 2. Ochrana proti editácii

#### API úroveň
```typescript
// PUT /api/admin/tests/:id
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  // 1. Získaj test
  const test = await prisma.test.findUnique({
    where: { id: params.id },
    include: {
      vkAssignments: true
    }
  })

  // 2. Kontrola použitia
  if (test.vkAssignments.length > 0) {
    return NextResponse.json(
      {
        error: 'Tento test nemožno upraviť, pretože už bol použitý vo výberovom konaní. Vytvorte kópiu testu.'
      },
      { status: 403 }
    )
  }

  // 3. Povoliť editáciu
  // ...
}
```

#### UI úroveň

Na stránke detailu testu:

```tsx
const isUsedInVK = test.vkAssignments.length > 0

return (
  <div>
    {isUsedInVK && (
      <Alert type="warning">
        🔒 Tento test je použitý vo výberovom konaní a nemôže byť upravený.
        Pre zmeny vytvorte kópiu testu.
      </Alert>
    )}

    <div className="flex gap-2">
      <Button
        onClick={handleEdit}
        disabled={isUsedInVK}
      >
        ✏️ Upraviť test
      </Button>

      {isUsedInVK && (
        <Button
          onClick={handleClone}
          variant="secondary"
        >
          📋 Vytvoriť kópiu
        </Button>
      )}
    </div>
  </div>
)
```

### 3. Klonování testu

Funkcia na vytvorenie kópie testu:

```typescript
// POST /api/admin/tests/:id/clone
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()

  // 1. Získaj pôvodný test
  const originalTest = await prisma.test.findUnique({
    where: { id: params.id }
  })

  if (!originalTest) {
    return NextResponse.json({ error: 'Test not found' }, { status: 404 })
  }

  // 2. Vytvor kópiu
  const clonedTest = await prisma.test.create({
    data: {
      name: `${originalTest.name} (kópia)`,
      type: originalTest.type,           // Legacy enum (pre spätnokompatibilitu)
      description: originalTest.description,
      questions: originalTest.questions,
      recommendedQuestionCount: originalTest.recommendedQuestionCount,
      recommendedDuration: originalTest.recommendedDuration,
      recommendedScore: originalTest.recommendedScore,
      difficulty: originalTest.difficulty,

      // NOVÁ organizácia: kategória testu
      categoryId: originalTest.categoryId,

      // Kópia NIE JE schválená
      approved: false,
      approvedAt: null,

      // Autor je aktuálny užívateľ
      authorId: session.user.id
    }
  })

  return NextResponse.json({ test: clonedTest })
}
```

### 4. Zobrazenie stavu v zozname testov

V tabuľke testov pridať indikátor:

```tsx
{
  accessorKey: 'usage',
  header: 'Použitie',
  cell: ({ row }) => {
    const { usage } = row.original

    if (usage.totalVKs === 0) {
      return (
        <span className="text-gray-500">
          📝 Editovateľný
        </span>
      )
    }

    return (
      <span className="text-orange-600">
        🔒 Použitý v {usage.totalVKs} VK
      </span>
    )
  },
}
```

## Výnimky

Nasledujúce operácie SÚ povolené aj pre použité testy:

1. **Čítanie** - detail testu môže byť zobrazený
2. **Schvaľovanie/Zrušenie schválenia** - SUPERADMIN môže schváliť/zrušiť schválenie (nemení obsah)
3. **Zmazanie** - nie je možné, ak je test použitý v AKTÍVNOM VK (status TESTOVANIE)
4. **Priradenie do ďalšieho VK** - test môže byť použitý vo viacerých VK súčasne

## Toast notifikácie

- ❌ "Test nemožno upraviť - už bol použitý vo výberovom konaní"
- ✅ "Kópia testu bola vytvorená. Môžete ju upravovať."
- ℹ️ "Tento test je použitý v {n} výberových konaniach"

## SQL Query na zistenie použitia

```sql
-- Získaj všetky testy s počtom použití
SELECT
  t.id,
  t.name,
  COUNT(vt.id) as usage_count,
  COUNT(CASE WHEN vk.status = 'TESTOVANIE' THEN 1 END) as active_usage_count
FROM tests t
LEFT JOIN vk_tests vt ON vt.test_id = t.id
LEFT JOIN vyberove_konania vk ON vk.id = vt.vk_id
GROUP BY t.id, t.name
```

## Budúce rozšírenia (v2)

- **Versioning testov** - možnosť vytvoriť novú verziu testu s prepojením na pôvodný
- **Archivovanie starých verzií** - označenie, ktorá verzia je aktuálna
- **History / Change log** - história zmien testov
- **Template system** - oddelenie templatu od konkrétnych inštancií testu

---

## Technické poznámky

- `vkAssignments` relace v Prisma modeli Test už existuje
- API endpoint pre klonování bude implementovaný v `/app/api/admin/tests/[id]/clone/route.ts`
- UI pre detail testu bude v `/app/(admin-protected)/tests/[id]/page.tsx` (zatiaľ neexistuje)

## Príklad workflow

### Scenár 1: Upravenie nevyužitého testu
1. Gestor vytvorí test "Slovenský jazyk A1"
2. Test ešte nie je priradený k žiadnemu VK
3. Gestor môže test slobodne upravovať
4. Po úpravách môže test schváliť SUPERADMIN

### Scenár 2: Pokus o úpravu využitého testu
1. Test "Slovenský jazyk A1" je priradený k VK-2024-001
2. Gestor otvorí detail testu
3. Vidí varovanie: "🔒 Test je použitý vo výberovom konaní"
4. Tlačidlo "Upraviť" je disabled
5. Tlačidlo "Vytvoriť kópiu" je aktívne

### Scenár 3: Klonovanie testu
1. Gestor klikne na "Vytvoriť kópiu"
2. Systém vytvorí nový test "Slovenský jazyk A1 (kópia)"
3. Kópia má rovnaké otázky a nastavenia
4. Kópia NIE JE schválená (approved = false)
5. Kópia je editovateľná
6. Gestor môže kópiu upravovať
7. Po úpravách požiada o schválenie
