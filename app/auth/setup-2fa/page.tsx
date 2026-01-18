'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { QRCodeDisplay } from '@/components/QRCodeDisplay'
import { TOTPInput } from '@/components/TOTPInput'
import { BackupCodesDisplay } from '@/components/BackupCodesDisplay'

export default function Setup2FAPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { data: session, update: updateSession } = useSession()
    const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup')
    const [loading, setLoading] = useState(false)
    const [qrCode, setQrCode] = useState<string>('')
    const [secret, setSecret] = useState<string>('')
    const [backupCodes, setBackupCodes] = useState<string[]>([])
    const [verificationError, setVerificationError] = useState<string>('')

    // Step 1: Initialize 2FA setup
    const handleSetupStart = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/auth/2fa/setup', {
                method: 'POST',
            })

            if (!response.ok) {
                throw new Error('Failed to initialize 2FA setup')
            }

            const data = await response.json()
            setQrCode(data.qrCode)
            setSecret(data.secret)
            setBackupCodes(data.backupCodes)
            setStep('verify')
        } catch (error) {
            console.error('2FA setup error:', error)
            toast.error('Nepodarilo sa inicializovať 2FA')
        } finally {
            setLoading(false)
        }
    }

    // Step 2: Verify TOTP token and activate 2FA
    const handleVerifyToken = async (token: string) => {
        setLoading(true)
        setVerificationError('')

        try {
            const response = await fetch('/api/auth/2fa/verify-setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    secret,
                    token,
                    backupCodes,
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Invalid verification code')
            }

            // Update session to reflect 2FA is now enabled and verified
            await updateSession({
                twoFactorEnabled: true,
                twoFactorVerified: true,
            })

            toast.success('2FA bola úspešne aktivovaná!')
            setStep('backup')
        } catch (error: any) {
            console.error('2FA verification error:', error)
            setVerificationError(error.message || 'Nesprávny overovací kód')
        } finally {
            setLoading(false)
        }
    }

    // Step 3: Finish setup
    const handleFinish = () => {
        const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
        router.push(callbackUrl)
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">
                            Nastavenie dvojfaktorovej autentifikácie
                        </h1>
                    </div>

                    {/* Step 1: Setup */}
                    {step === 'setup' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <p className="text-gray-700 mb-6">
                                    Dvojfaktorová autentifikácia pridáva ďalšiu vrstvu zabezpečenia k vášmu účtu.
                                    Budete potrebovať autentifikačnú aplikáciu ako Google Authenticator alebo Authy.
                                </p>
                                <button
                                    onClick={handleSetupStart}
                                    disabled={loading}
                                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    data-testid="start-setup-button"
                                >
                                    {loading ? 'Načítavam...' : 'Začať nastavenie'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Verify */}
                    {step === 'verify' && (
                        <div className="space-y-6">
                            <QRCodeDisplay
                                qrCodeDataURL={qrCode}
                                secret={secret}
                                userEmail={session?.user?.email || session?.user?.username || ''}
                            />

                            <div className="border-t pt-6">
                                <h3 className="text-lg font-semibold mb-4 text-center">
                                    Zadajte overovací kód
                                </h3>
                                <TOTPInput
                                    onComplete={handleVerifyToken}
                                    disabled={loading}
                                    error={verificationError}
                                />
                                {loading && (
                                    <p className="text-sm text-gray-600 text-center mt-4">
                                        Overujem kód...
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Backup codes */}
                    {step === 'backup' && (
                        <div className="space-y-6">
                            <BackupCodesDisplay
                                codes={backupCodes}
                                onDownload={downloadBackupCodes}
                                onPrint={printBackupCodes}
                            />

                            <div className="flex justify-center pt-4">
                                <button
                                    onClick={handleFinish}
                                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                                    data-testid="finish-button"
                                >
                                    Dokončiť nastavenie
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
