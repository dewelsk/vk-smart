'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { TOTPInput } from '@/components/TOTPInput'

export default function Verify2FAPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
    const { update: updateSession } = useSession()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string>('')
    const [useBackupCode, setUseBackupCode] = useState(false)

    const handleVerify = async (code: string) => {
        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/auth/2fa/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: code,
                    useBackupCode,
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Invalid code')
            }

            const data = await response.json()

            // 1. Update session to mark 2FA as verified
            await updateSession({ twoFactorVerified: true })

            // 2. Show warning if backup code was used
            if (data.usedBackupCode) {
                toast.success(`Prihlásenie úspešné. Zostáva ${data.remainingBackupCodes} záložných kódov.`, {
                    duration: 5000,
                })
            } else {
                toast.success('Prihlásenie úspešné!')
            }

            // 3. Redirect to callback URL (use window.location for hard navigation)
            window.location.href = callbackUrl
        } catch (error: any) {
            console.error('2FA verification error:', error)
            setError(error.message || 'Nesprávny overovací kód')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2" data-testid="page-title">
                            Dvojfaktorová autentifikácia
                        </h1>
                        <p className="text-gray-600">
                            {useBackupCode
                                ? 'Zadajte jeden zo záložných kódov'
                                : 'Zadajte 6-miestny kód z autentifikačnej aplikácie'
                            }
                        </p>
                    </div>

                    {/* TOTP Input */}
                    <div className="mb-6">
                        <TOTPInput
                            onComplete={handleVerify}
                            disabled={loading}
                            error={error}
                        />
                    </div>

                    {/* Toggle backup code */}
                    <div className="text-center">
                        <button
                            onClick={() => {
                                setUseBackupCode(!useBackupCode)
                                setError('')
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            data-testid="toggle-backup-code-button"
                        >
                            {useBackupCode
                                ? 'Použiť autentifikačnú aplikáciu'
                                : 'Použiť záložný kód'
                            }
                        </button>
                    </div>

                    {/* Help text */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <p className="text-sm text-gray-600 text-center">
                            Stratili ste prístup k autentifikačnej aplikácii?{' '}
                            <a href="/auth/password-reset" className="text-blue-600 hover:text-blue-700 font-medium">
                                Resetovať heslo
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
