# IDSK Integrácia

## Použitie IDSK v projekte

**DÔLEŽITÉ:** IDSK dizajn systém používame **IBA** pre verejné časti:
- Landing page (pred prihlásením)
- Login / 2FA stránky
- Uchádzač sekcia (testovanie)
- Možno Komisia sekcia

**Admin a Gestor sekcie** používajú **Tailwind CSS** + shadcn/ui pre moderné admin rozhranie.

## Inštalácia

```bash
npm install @id-sk/frontend
```

## Setup v Next.js

### 1. Import IDSK CSS

```typescript
// src/app/(public)/layout.tsx
import '@id-sk/frontend/dist/css/idsk-frontend.min.css';
import '@id-sk/frontend/dist/css/idsk-core.css';

export default function PublicLayout({ children }) {
  return (
    <div className="idsk-wrapper">
      {children}
    </div>
  );
}
```

### 2. Štruktúra layouts

```
src/app/
├── (public)/                    # IDSK Layout
│   ├── layout.tsx              # IDSK imports
│   ├── page.tsx                # Landing
│   ├── login/
│   └── 2fa/
├── (uchadzac)/                 # IDSK Layout
│   ├── layout.tsx
│   └── test/
├── (admin)/                    # Tailwind Layout
│   ├── layout.tsx              # NO IDSK
│   └── dashboard/
└── (gestor)/                   # Tailwind Layout
    ├── layout.tsx
    └── tests/
```

## IDSK Komponenty - React Wrappery

### Button

```tsx
// src/components/idsk/Button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'warning';
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', fullWidth, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'govuk-button',
          'idsk-button',
          {
            'govuk-button--primary': variant === 'primary',
            'govuk-button--secondary': variant === 'secondary',
            'govuk-button--warning': variant === 'warning',
            'govuk-button--full-width': fullWidth,
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### Input

```tsx
// src/components/idsk/Input.tsx
import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={clsx('govuk-form-group', { 'govuk-form-group--error': error })}>
        <label className="govuk-label idsk-label" htmlFor={inputId}>
          {label}
        </label>

        {hint && (
          <div className="govuk-hint idsk-hint">
            {hint}
          </div>
        )}

        {error && (
          <span className="govuk-error-message idsk-error-message">
            <span className="govuk-visually-hidden">Chyba:</span> {error}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'govuk-input',
            'idsk-input',
            { 'govuk-input--error': error },
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';
```

### Select

```tsx
// src/components/idsk/Select.tsx
import { SelectHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className, id, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={clsx('govuk-form-group', { 'govuk-form-group--error': error })}>
        <label className="govuk-label idsk-label" htmlFor={selectId}>
          {label}
        </label>

        {error && (
          <span className="govuk-error-message idsk-error-message">
            <span className="govuk-visually-hidden">Chyba:</span> {error}
          </span>
        )}

        <select
          ref={ref}
          id={selectId}
          className={clsx('govuk-select', 'idsk-select', className)}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);

Select.displayName = 'Select';
```

### Card

```tsx
// src/components/idsk/Card.tsx
import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  footer?: React.ReactNode;
}

export function Card({ title, children, footer, className, ...props }: CardProps) {
  return (
    <div className={clsx('idsk-card', className)} {...props}>
      {title && (
        <div className="idsk-card__header">
          <h2 className="idsk-card__title">{title}</h2>
        </div>
      )}

      <div className="idsk-card__body">
        {children}
      </div>

      {footer && (
        <div className="idsk-card__footer">
          {footer}
        </div>
      )}
    </div>
  );
}
```

### Header

```tsx
// src/components/idsk/Header.tsx
import Link from 'next/link';

interface HeaderProps {
  user?: {
    name: string;
    role: string;
  } | null;
  onLogout?: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="govuk-header idsk-header" role="banner">
      <div className="govuk-header__container govuk-width-container">
        <div className="govuk-header__logo">
          <Link href="/" className="govuk-header__link">
            <span className="govuk-header__logotype">
              <span className="govuk-header__logotype-text">
                Výberové konania
              </span>
            </span>
          </Link>
        </div>

        {user && (
          <div className="govuk-header__content">
            <nav className="govuk-header__navigation">
              <ul className="govuk-header__navigation-list">
                <li className="govuk-header__navigation-item">
                  <span className="govuk-header__menu-button">
                    {user.name} ({user.role})
                  </span>
                </li>
                <li className="govuk-header__navigation-item">
                  <button
                    onClick={onLogout}
                    className="govuk-header__link"
                  >
                    Odhlásiť sa
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
```

### Breadcrumbs

```tsx
// src/components/idsk/Breadcrumbs.tsx
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <div className="govuk-breadcrumbs idsk-breadcrumbs">
      <ol className="govuk-breadcrumbs__list">
        {items.map((item, index) => (
          <li key={index} className="govuk-breadcrumbs__list-item">
            {item.href ? (
              <Link href={item.href} className="govuk-breadcrumbs__link">
                {item.label}
              </Link>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
```

### Banner (Info/Warning)

```tsx
// src/components/idsk/Banner.tsx
import { clsx } from 'clsx';

interface BannerProps {
  type?: 'info' | 'warning' | 'success' | 'error';
  title?: string;
  children: React.ReactNode;
}

export function Banner({ type = 'info', title, children }: BannerProps) {
  return (
    <div
      className={clsx('idsk-banner', {
        'idsk-banner--info': type === 'info',
        'idsk-banner--warning': type === 'warning',
        'idsk-banner--success': type === 'success',
        'idsk-banner--error': type === 'error',
      })}
    >
      {title && <h2 className="idsk-banner__title">{title}</h2>}
      <div className="idsk-banner__content">{children}</div>
    </div>
  );
}
```

## Export všetkých komponentov

```typescript
// src/components/idsk/index.ts
export { Button } from './Button';
export { Input } from './Input';
export { Select } from './Select';
export { Card } from './Card';
export { Header } from './Header';
export { Breadcrumbs } from './Breadcrumbs';
export { Banner } from './Banner';
```

## Použitie v kóde

### Login stránka

```tsx
// src/app/(public)/login/page.tsx
'use client';

import { useState } from 'react';
import { Button, Input, Card, Header } from '@/components/idsk';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <>
      <Header />

      <main className="govuk-main-wrapper">
        <div className="govuk-width-container">
          <div className="govuk-grid-row">
            <div className="govuk-grid-column-two-thirds">
              <Card title="Prihlásenie do systému">
                <form>
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <Input
                    label="Heslo"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <Button variant="primary" type="submit">
                    Prihlásiť sa
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
```

## IDSK CSS Classes Reference

### Layout
- `govuk-width-container` - Obmedzenie šírky
- `govuk-main-wrapper` - Hlavný obal
- `govuk-grid-row` - Riadok gridu
- `govuk-grid-column-two-thirds` - Stĺpec 2/3

### Typography
- `govuk-heading-xl` - Extra large nadpis
- `govuk-heading-l` - Large nadpis
- `govuk-heading-m` - Medium nadpis
- `govuk-body` - Bežný text
- `govuk-body-s` - Malý text

### Spacing
- `govuk-!-margin-bottom-4` - Margin bottom
- `govuk-!-padding-4` - Padding

### Colors (IDSK)
- Primary: `#005EA5`
- Secondary: `#F47738`
- Text: `#0B0C0C`
- Background: `#FFFFFF`

## Prispôsobenie IDSK

Ak potrebujeme upraviť IDSK štýly:

```css
/* src/app/globals.css */

/* Import IDSK */
@import '@id-sk/frontend/dist/css/idsk-frontend.min.css';

/* Custom overrides */
.idsk-button {
  /* Custom button styles */
}

.idsk-input:focus {
  /* Custom focus style */
}
```

## Tailwind pre Admin sekciu

Admin sekcia používa Tailwind + shadcn/ui:

```tsx
// src/app/(admin)/dashboard/page.tsx
import { Button } from '@/components/ui/button';  // shadcn/ui
import { Card } from '@/components/ui/card';

export default function AdminDashboard() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button variant="default">Moderný Tailwind button</Button>
      </Card>
    </div>
  );
}
```

## Zhrnutie

✅ **IDSK:** Verejná časť, Login, Uchádzač
✅ **Tailwind:** Admin, Gestor, interné dashboardy
✅ **React wrappery:** Vlastné komponenty nad IDSK classes
✅ **Type-safe:** TypeScript interfaces pre všetky komponenty
