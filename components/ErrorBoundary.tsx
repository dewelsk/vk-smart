'use client'

import { Component, ReactNode } from 'react'
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-red-100 p-4">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-600" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 text-center mb-4">
              Aplikácia nefunguje
            </h1>

            <div className="space-y-3 text-gray-600 mb-6">
              <p>
                Nastala neočakávaná chyba pri načítaní aplikácie. Môže to byť spôsobené:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Problémom s internetovým pripojením</li>
                <li>Nedostupnosťou databázového servera</li>
                <li>Chybou v komunikácii s backendom</li>
              </ul>
              <p className="mt-4">
                Skontrolujte prosím vaše internetové pripojenie a skúste obnoviť stránku.
              </p>
            </div>

            <button
              onClick={this.handleReload}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              <ArrowPathIcon className="h-5 w-5" />
              Obnoviť stránku
            </button>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                  Technické detaily (iba v dev režime)
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-red-600 overflow-auto">
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
