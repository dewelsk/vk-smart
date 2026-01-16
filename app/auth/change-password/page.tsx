'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator'

export default function ChangePasswordPage() {
    const router = useRouter()
    const { data: session, update } = useSession()
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<{
        currentPassword?: string;
        newPassword?: string;
        confirmPassword?: string
    }>({})

    const validate = () => {
        const newErrors: typeof errors = {}

        if (!currentPassword) {
            newErrors.currentPassword = 'Pôvodné heslo je povinné'
        }

        if (!newPassword) {
            newErrors.newPassword = 'Nové heslo je povinné'
        } else if (newPassword.length < 8) {
            newErrors.newPassword = 'Heslo musí mať aspoň 8 znakov'
        }

        if (newPassword === currentPassword) {
            newErrors.newPassword = 'Nové heslo musí byť iné ako pôvodné'
        }

        if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = 'Heslá sa nezhodujú'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return

        setLoading(true)
        try {
            const response = await fetch('/api/auth/password/change', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Zlyhala zmena hesla')
            }

            toast.success('Heslo bolo úspešne zmenené')

            // Update session locally to clear mustChangePassword flag
            await update({
                ...session,
                user: {
                    ...session?.user,
                    mustChangePassword: false
                }
            })

            router.push('/dashboard')
            router.refresh()
        } catch (error: any) {
            console.error('Change password error:', error)
            toast.error(error.message || 'Nastala chyba pri zmene hesla')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Zmena hesla
                        </h1>
                        <p className="text-gray-600">
                            {session?.user?.mustChangePassword
                                ? 'Pred pokračovaním si musíte zmeniť heslo'
                                : 'Zadajte nové heslo pre váš účet'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Pôvodné heslo
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border ${errors.currentPassword ? 'border-red-500' : 'border-gray-200'
                                    } focus:ring-2 focus:ring-ds-purple-80/20 focus:border-ds-purple-80 outline-none transition-all`}
                                placeholder="************"
                            />
                            {errors.currentPassword && (
                                <p className="mt-1 text-xs text-red-500">{errors.currentPassword}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nové heslo
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border ${errors.newPassword ? 'border-red-500' : 'border-gray-200'
                                    } focus:ring-2 focus:ring-ds-purple-80/20 focus:border-ds-purple-80 outline-none transition-all`}
                                placeholder="************"
                            />
                            {errors.newPassword && (
                                <p className="mt-1 text-xs text-red-500">{errors.newPassword}</p>
                            )}
                        </div>

                        {newPassword && (
                            <PasswordStrengthIndicator password={newPassword} />
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Potvrdenie nového hesla
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200'
                                    } focus:ring-2 focus:ring-ds-purple-80/20 focus:border-ds-purple-80 outline-none transition-all`}
                                placeholder="************"
                            />
                            {errors.confirmPassword && (
                                <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-ds-purple-80 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
                        >
                            {loading ? 'Ukladám...' : 'Zmeniť heslo'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
