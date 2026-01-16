'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

export default function PasswordResetRequestPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState('')
    const emailInputRef = useRef<HTMLInputElement>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        // Validate email
        if (!email.trim()) {
            setError('Email je povinný')
            emailInputRef.current?.focus()
            setLoading(false)
            return
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Zadajte platný email')
            emailInputRef.current?.focus()
            setLoading(false)
            return
        }

        try {
            const response = await fetch('/api/auth/password-reset/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            if (!response.ok) {
                throw new Error('Failed to request password reset')
            }

            setSubmitted(true)
        } catch (error) {
            console.error('Password reset request error:', error)
            toast.error('Nepodarilo sa odoslať žiadosť o reset hesla')
        } finally {
            setLoading(false)
        }
    }

    if (submitted) {
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
                            Email bol odoslaný
                        </h1>
                        <p className="text-gray-600 mb-6">
                            Ak účet s emailom <strong>{email}</strong> existuje, odoslali sme vám odkaz na reset hesla.
                        </p>
                        <p className="text-sm text-gray-500 mb-6">
                            Skontrolujte si emailovú schránku a kliknite na odkaz v emaili.
                        </p>
                        <a
                            href="/admin/login"
                            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Späť na prihlásenie
                        </a>
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
                            Reset hesla
                        </h1>
                        <p className="text-gray-600">
                            Zadajte email adresu pripojenú k vášmu účtu
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                ref={emailInputRef}
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value)
                                    if (error) setError('')
                                }}
                                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${error
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                placeholder="vas@email.com"
                                data-testid="email-input"
                                disabled={loading}
                            />
                            {error && (
                                <p className="mt-2 text-sm text-red-600" data-testid="email-error">
                                    {error}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            data-testid="submit-button"
                        >
                            {loading ? 'Odosielam...' : 'Odoslať reset link'}
                        </button>
                    </form>

                    {/* Back to login */}
                    <div className="mt-6 text-center">
                        <a
                            href="/admin/login"
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            ← Späť na prihlásenie
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
