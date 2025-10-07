import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

type PageHeaderProps = {
  title: string
  description?: string
  actions?: React.ReactNode
  backLink?: {
    href: string
    label: string
  }
}

/**
 * Jednotný header komponent pre všetky stránky
 *
 * Štandardný štýl:
 * - H1: text-3xl (30px) na všetkých zariadeniach
 * - Popis: mt-2 text-gray-600
 * - Back link: len na detail pages (nie na list pages)
 */
export function PageHeader({ title, description, actions, backLink }: PageHeaderProps) {
  return (
    <div className="mb-8">
      {backLink && (
        <Link
          href={backLink.href}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {backLink.label}
        </Link>
      )}

      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 data-testid="page-title" className="text-3xl font-bold text-gray-900">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-gray-600">{description}</p>
          )}
        </div>

        {actions && (
          <div className="mt-4 sm:mt-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
