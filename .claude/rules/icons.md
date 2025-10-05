# Icon Usage Rules

## Always use Heroicons

**NEVER use emoji icons (🔧, ✓, ⚠, ✕, etc.) in the UI.**

Always use Heroicons from `@heroicons/react`:

```typescript
import { IconName } from '@heroicons/react/24/outline'  // outline icons
import { IconName } from '@heroicons/react/24/solid'    // solid icons
```

## Common icon mappings

Replace emoji with Heroicons:

- 🔧 → `WrenchScrewdriverIcon`
- ✓ → `CheckIcon`
- ⚠ → `ExclamationTriangleIcon`
- ✕ → `XMarkIcon`
- ℹ → `InformationCircleIcon`
- 👤 → `UserIcon`
- 📋 → `ClipboardDocumentListIcon`
- ➕ → `PlusIcon`

## Documentation

https://heroicons.com/

## Package

`@heroicons/react` v2.2.0 (installed in package.json)
