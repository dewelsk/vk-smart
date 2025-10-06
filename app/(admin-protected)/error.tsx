'use client'

import { useEffect } from 'react'
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error caught by error boundary:', error)
  }, [error])

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-yellow-100 p-4">
            <ExclamationTriangleIcon className="h-12 w-12 text-yellow-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-4">
          Nastala chyba
        </h1>

        <div className="space-y-3 text-gray-600 mb-6">
          <p className="text-center">
            Stránka sa nemohla načítať správne. Toto sa môže stať po reštarte servera alebo pri aktualizácii kódu.
          </p>
          <p className="text-center font-medium">
            Obnovte prosím stránku.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleRefresh}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            <ArrowPathIcon className="h-5 w-5" />
            Obnoviť stránku
          </button>

          {process.env.NODE_ENV === 'development' && error.message && (
            <details className="mt-4 p-3 bg-gray-100 rounded-md text-sm">
              <summary className="cursor-pointer font-medium text-gray-700">
                Technické detaily (dev mode)
              </summary>
              <pre className="mt-2 text-xs text-gray-600 overflow-auto">
                {error.message}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}
