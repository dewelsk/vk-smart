'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import {
    ShieldCheckIcon,
    ShieldExclamationIcon,
    KeyIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { BackupCodesDisplay } from '@/components/BackupCodesDisplay'

export default function SecuritySettingsPage() {
    const { data: session, update: updateSession } = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [showDisableConfirm, setShowDisableConfirm] = useState(false)
    const [showBackupCodes, setShowBackupCodes] = useState(false)
    const [backupCodes, setBackupCodes] = useState<string[]>([])
    const [regeneratingCodes, setRegeneratingCodes] = useState(false)

    const is2FAEnabled = session?.user?.twoFactorEnabled === true

    const handleEnable2FA = () => {
        router.push('/auth/setup-2fa?callbackUrl=/settings/security')
    }

    const handleDisable2FA = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/auth/2fa/disable', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Nepodarilo sa vypnúť 2FA')
            }

            await updateSession({
                twoFactorEnabled: false,
                twoFactorVerified: false,
            })

            toast.success('2FA bola úspešne vypnutá')
            setShowDisableConfirm(false)
        } catch (error: any) {
            console.error('Disable 2FA error:', error)
            toast.error(error.message || 'Nepodarilo sa vypnúť 2FA')
        } finally {
            setLoading(false)
        }
    }

    const handleRegenerateBackupCodes = async () => {
        setRegeneratingCodes(true)
        try {
            const response = await fetch('/api/auth/2fa/regenerate-backup-codes', {
                method: 'POST',
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Nepodarilo sa vygenerovať záložné kódy')
            }

            const data = await response.json()
            setBackupCodes(data.backupCodes)
            setShowBackupCodes(true)
            toast.success('Nové záložné kódy boli vygenerované')
        } catch (error: any) {
            console.error('Regenerate backup codes error:', error)
            toast.error(error.message || 'Nepodarilo sa vygenerovať záložné kódy')
        } finally {
            setRegeneratingCodes(false)
        }
    }

    const downloadBackupCodes = () => {
        const content = backupCodes.join('\n')
        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = '2fa-backup-codes.txt'
        a.click()
        URL.revokeObjectURL(url)
    }

    const printBackupCodes = () => {
        const printWindow = window.open('', '', 'width=600,height=400')
        if (printWindow) {
            printWindow.document.write('<html><head><title>2FA Backup Codes</title></head><body>')
            printWindow.document.write('<h1>2FA Backup Codes</h1>')
            printWindow.document.write('<ul>')
            backupCodes.forEach(code => {
                printWindow.document.write(`<li><code>${code}</code></li>`)
            })
            printWindow.document.write('</ul>')
            printWindow.document.write('</body></html>')
            printWindow.document.close()
            printWindow.print()
        }
    }

    return (
        <div className="space-y-6" data-testid="security-settings-page">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Bezpečnostné nastavenia</h1>
                <p className="mt-1 text-sm text-gray-600">
                    Spravujte dvojfaktorovú autentifikáciu a ďalšie bezpečnostné nastavenia vášho účtu.
                </p>
            </div>

            {/* 2FA Status Card */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Dvojfaktorová autentifikácia (2FA)</h2>
                </div>

                <div className="px-6 py-6">
                    {/* Status */}
                    <div className="flex items-center gap-4 mb-6">
                        {is2FAEnabled ? (
                            <>
                                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <ShieldCheckIcon className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-green-800">2FA je zapnutá</p>
                                    <p className="text-sm text-gray-600">
                                        Váš účet je chránený dvojfaktorovou autentifikáciou.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <ShieldExclamationIcon className="w-6 h-6 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-yellow-800">2FA nie je zapnutá</p>
                                    <p className="text-sm text-gray-600">
                                        Odporúčame zapnúť 2FA pre lepšiu ochranu vášho účtu.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                        {is2FAEnabled ? (
                            <>
                                <button
                                    onClick={handleRegenerateBackupCodes}
                                    disabled={regeneratingCodes}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    data-testid="regenerate-codes-button"
                                >
                                    <ArrowPathIcon className={`w-4 h-4 ${regeneratingCodes ? 'animate-spin' : ''}`} />
                                    {regeneratingCodes ? 'Generujem...' : 'Regenerovať záložné kódy'}
                                </button>

                                {!showDisableConfirm ? (
                                    <button
                                        onClick={() => setShowDisableConfirm(true)}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50"
                                        data-testid="disable-2fa-button"
                                    >
                                        Vypnúť 2FA
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600">Naozaj vypnúť?</span>
                                        <button
                                            onClick={handleDisable2FA}
                                            disabled={loading}
                                            className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                                            data-testid="confirm-disable-button"
                                        >
                                            {loading ? 'Vypínam...' : 'Áno, vypnúť'}
                                        </button>
                                        <button
                                            onClick={() => setShowDisableConfirm(false)}
                                            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                            data-testid="cancel-disable-button"
                                        >
                                            Zrušiť
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <button
                                onClick={handleEnable2FA}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                data-testid="enable-2fa-button"
                            >
                                <KeyIcon className="w-4 h-4" />
                                Zapnúť 2FA
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Backup Codes Modal */}
            {showBackupCodes && backupCodes.length > 0 && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Nové záložné kódy
                            </h3>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                                <p className="text-sm text-yellow-800">
                                    <strong>Dôležité:</strong> Tieto kódy sa zobrazia len raz.
                                    Uložte si ich na bezpečné miesto. Staré kódy boli zneplatnené.
                                </p>
                            </div>

                            <BackupCodesDisplay
                                codes={backupCodes}
                                onDownload={downloadBackupCodes}
                                onPrint={printBackupCodes}
                            />

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => {
                                        setShowBackupCodes(false)
                                        setBackupCodes([])
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                    data-testid="close-backup-codes-button"
                                >
                                    Rozumiem, zavrieť
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
