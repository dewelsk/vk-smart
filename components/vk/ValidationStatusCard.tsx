'use client'

import Link from 'next/link'
import {
  WrenchScrewdriverIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  Square2StackIcon
} from '@heroicons/react/24/outline'
import type { ValidationIssue } from '@/lib/vk-validation'

type ValidationStatusCardProps = {
  vkId: string
  status: string
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
  checklist?: Array<{
    label: string
    completed: boolean
    action?: string
    actionLink?: string
  }>
}

export function ValidationStatusCard({
  vkId,
  status,
  errors,
  warnings,
  checklist
}: ValidationStatusCardProps) {
  // Different card styles based on status
  const isReady = errors.length === 0
  const hasIssues = errors.length > 0 || warnings.length > 0

  // STATUS: PRIPRAVA
  if (status === 'PRIPRAVA') {
    if (isReady) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                VK pripravené
              </h3>
              <p className="text-green-700 mb-4">
                Všetky potrebné kroky sú dokončené. Môžete prejsť na stav "Čaká na testy".
              </p>
              <Link
                href={`/vk/${vkId}?action=changeStatus&target=CAKA_NA_TESTY`}
                className="inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                → Prejsť na "Čaká na testy"
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <WrenchScrewdriverIcon className="h-6 w-6" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              VK v príprave
            </h3>
            <p className="text-blue-700 mb-4">
              Dokončite nastavenie pred spustením testovania.
            </p>

            {checklist && checklist.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="font-medium text-blue-900">Chýbajúce kroky:</p>
                {checklist.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {item.completed ? (
                        <CheckIcon className="h-4 w-4 text-green-600" />
                      ) : (
                        <Square2StackIcon className="h-4 w-4 text-gray-400" />
                      )}
                      <span className={item.completed ? 'text-green-700' : 'text-gray-700'}>
                        {item.label}
                      </span>
                    </div>
                    {!item.completed && item.actionLink && (
                      <Link
                        href={item.actionLink}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {item.action || 'Pridať'}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}

            {errors.length > 0 && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="font-medium text-red-900 mb-2">Blokujúce problémy ({errors.length}):</p>
                <ul className="space-y-1">
                  {errors.map((error, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-red-600">❌</span>
                      <span className="flex-1 text-red-700">{error.message}</span>
                      {error.actionLink && (
                        <Link
                          href={error.actionLink}
                          className="text-blue-600 hover:text-blue-800 whitespace-nowrap"
                        >
                          {error.action || 'Opraviť'}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="font-medium text-orange-900 mb-2">Varovania ({warnings.length}):</p>
                <ul className="space-y-1">
                  {warnings.map((warning, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <ExclamationTriangleIcon className="h-4 w-4 text-orange-600" />
                      <span className="flex-1 text-orange-700">{warning.message}</span>
                      {warning.actionLink && (
                        <Link
                          href={warning.actionLink}
                          className="text-blue-600 hover:text-blue-800 whitespace-nowrap"
                        >
                          {warning.action || 'Opraviť'}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // STATUS: CAKA_NA_TESTY
  if (status === 'CAKA_NA_TESTY') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl">✅</span>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Pripravené na testovanie
            </h3>
            <p className="text-green-700 mb-4">
              VK je pripravené. Môžete spustiť testovanie.
            </p>
            <Link
              href={`/vk/${vkId}?action=changeStatus&target=TESTOVANIE`}
              className="inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              → Spustiť testovanie
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // STATUS: TESTOVANIE
  if (status === 'TESTOVANIE') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🧪</span>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Prebieha testovanie
            </h3>
            <p className="text-blue-700">
              Uchádzači práve vykonávajú testy.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // STATUS: HODNOTENIE
  if (status === 'HODNOTENIE') {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⭐</span>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">
              Prebieha hodnotenie komisiou
            </h3>
            <p className="text-purple-700">
              Komisia hodnotí uchádzačov.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // STATUS: DOKONCENE
  if (status === 'DOKONCENE') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl">✅</span>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              VK dokončené
            </h3>
            <p className="text-green-700">
              Výberové konanie bolo úspešne ukončené.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // STATUS: ZRUSENE
  if (status === 'ZRUSENE') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl">❌</span>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              VK zrušené
            </h3>
            <p className="text-red-700">
              Toto výberové konanie bolo zrušené.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Default - show issues if any
  if (hasIssues) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="h-6 w-6" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              VK má problémy
            </h3>

            {errors.length > 0 && (
              <div className="mb-4">
                <p className="font-medium text-red-900 mb-2">Blokujúce problémy ({errors.length}):</p>
                <ul className="space-y-1">
                  {errors.map((error, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-red-600">❌</span>
                      <span className="flex-1 text-red-700">{error.message}</span>
                      {error.actionLink && (
                        <Link
                          href={error.actionLink}
                          className="text-blue-600 hover:text-blue-800 whitespace-nowrap"
                        >
                          {error.action || 'Opraviť'}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {warnings.length > 0 && (
              <div>
                <p className="font-medium text-orange-900 mb-2">Varovania ({warnings.length}):</p>
                <ul className="space-y-1">
                  {warnings.map((warning, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <ExclamationTriangleIcon className="h-4 w-4 text-orange-600" />
                      <span className="flex-1 text-orange-700">{warning.message}</span>
                      {warning.actionLink && (
                        <Link
                          href={warning.actionLink}
                          className="text-blue-600 hover:text-blue-800 whitespace-nowrap"
                        >
                          {warning.action || 'Opraviť'}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}
