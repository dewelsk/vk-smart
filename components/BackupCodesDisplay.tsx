'use client'

import { useState } from 'react'
import { DocumentDuplicateIcon, CheckIcon } from '@heroicons/react/24/outline'

interface BackupCodesDisplayProps {
    codes: string[]
    onDownload?: () => void
    onPrint?: () => void
}

export function BackupCodesDisplay({ codes, onDownload, onPrint }: BackupCodesDisplayProps) {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

    const copyCode = (code: string, index: number) => {
        navigator.clipboard.writeText(code)
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
    }

    const copyAllCodes = () => {
        const allCodes = codes.join('\n')
        navigator.clipboard.writeText(allCodes)
    }

    return (
        <div className="space-y-4" data-testid="backup-codes-display">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                        <h4 className="text-sm font-semibold text-yellow-900 mb-1">
                            Dôležité upozornenie
                        </h4>
                        <p className="text-sm text-yellow-800">
                            Uložte si tieto záložné kódy na bezpečné miesto. Každý kód môžete použiť raz na prihlásenie, ak stratíte prístup k autentifikačnej aplikácii.
                        </p>
                    </div>
                </div>
            </div>

            {/* Backup codes grid */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">
                    Záložné kódy ({codes.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {codes.map((code, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded border border-gray-200"
                            data-testid={`backup-code-${index}`}
                        >
                            <code className="text-sm font-mono text-gray-900">
                                {code}
                            </code>
                            <button
                                onClick={() => copyCode(code, index)}
                                className="ml-2 p-1 text-gray-500 hover:text-gray-700 transition-colors"
                                data-testid={`copy-code-${index}`}
                                title="Kopírovať kód"
                            >
                                {copiedIndex === index ? (
                                    <CheckIcon className="w-4 h-4 text-green-600" />
                                ) : (
                                    <DocumentDuplicateIcon className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
                <button
                    onClick={copyAllCodes}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    data-testid="copy-all-codes-button"
                >
                    <DocumentDuplicateIcon className="w-4 h-4" />
                    Kopírovať všetky
                </button>

                {onDownload && (
                    <button
                        onClick={onDownload}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        data-testid="download-codes-button"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Stiahnuť
                    </button>
                )}

                {onPrint && (
                    <button
                        onClick={onPrint}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        data-testid="print-codes-button"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Tlačiť
                    </button>
                )}
            </div>
        </div>
    )
}
