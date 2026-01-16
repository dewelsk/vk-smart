'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator'

export default function PasswordResetTokenPage() {
    const router = useRouter()
    const params = useParams()
    const token = params.token as string

    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({})
    const [success, setSuccess] = useState(false)

    const newPasswordRef = useRef<HTMLInputElement>(null)
    const confirmPasswordRef = useRef<HTMLInputElement>(null)

    const validate = (): boolean => {
        const newErrors: typeof errors = {}

        if (!newPassword) {
            newErrors.newPassword = 'Nové heslo je povinné'
        } else if (newPassword.length < 8) {
            newErrors.newPassword = 'Heslo musí mať aspoň 8 znakov'
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Potvrdenie hesla je povinné'
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = 'Heslá sa nezhodujú'
        }

        setErrors(newErrors)

        // Focus first error
        if (newErrors.newPassword) {
            newPasswordRef.current?.focus()
            return false
        }
        if (newErrors.confirmPassword) {
            confirmPasswordRef.current?.focus()
            return false
        }

        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validate()) return

        setLoading(true)
        toast.loading('Resetujem heslo...')

        try {
            const response = await fetch('/api/auth/password-reset/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    newPassword,
                }),
            })

            toast.dismiss()

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to reset password')
            }

            toast.success('Heslo bolo úspešne zmenené!')
            setSuccess(true)

            // Redirect to login after 2 seconds
            setTimeout(() => {
                router.push('/admin/login')
            }, 2000)
        } catch (error: any) {
            console.error('Password reset error:', error)
            toast.error(error.message || 'Nepodarilo sa zmeniť heslo')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">
                            Heslo bolo zmenené
                        </h1>
                        <p className="text-gray-600 mb-6">
                            Vaše heslo bolo úspešne zmenené. Budete presmerovaní na prihlasovaciu stránku.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2" data-testid="page-title">
                            Nastavenie nového hesla
                        </h1>
                        <p className="text-gray-600">
                            Zadajte nové heslo pre váš účet
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* New Password */}
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Nové heslo
                            </label>
                            <input
                                ref={newPasswordRef}
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value)
                                    if (errors.newPassword) setErrors({ ...errors, newPassword: undefined })
                                }}
                                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${errors.newPassword
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                data-testid="new-password-input"
                                disabled={loading}
                            />
                            {errors.newPassword && (
                                <p className="mt-2 text-sm text-red-600" data-testid="new-password-error">
                                    {errors.newPassword}
                                </p>
                            )}
                        </div>

                        {/* Password Strength */}
                        {newPassword && (
                            <PasswordStrengthIndicator password={newPassword} />
                        )}

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Potvrdiť heslo
                            </label>
                            <input
                                ref={confirmPasswordRef}
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value)
                                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined })
                                }}
                                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${errors.confirmPassword
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                data-testid="confirm-password-input"
                                disabled={loading}
                            />
                            {errors.confirmPassword && (
                                <p className="mt-2 text-sm text-red-600" data-testid="confirm-password-error">
                                    {errors.confirmPassword}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            data-testid="submit-button"
                        >
                            {loading ? 'Ukladám...' : 'Zmeniť heslo'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
