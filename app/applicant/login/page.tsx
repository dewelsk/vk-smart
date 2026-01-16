'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function ApplicantLoginPage() {
  const router = useRouter()
  const [vkIdentifier, setVkIdentifier] = useState('')
  const [cisIdentifier, setCisIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const vkIdentifierRef = useRef<HTMLInputElement>(null)
  const cisIdentifierRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!vkIdentifier.trim()) {
      newErrors.vkIdentifier = 'Identifikátor VK je povinný'
    } else if (!/^VK\/\d{4}\/\d+$/.test(vkIdentifier.trim())) {
      newErrors.vkIdentifier = 'Neplatný formát identifikátora (napr. VK/2025/1234)'
    }

    if (!cisIdentifier.trim()) {
      newErrors.cisIdentifier = 'Identifikátor uchádzača je povinný'
    }

    if (!password) {
      newErrors.password = 'Heslo je povinné'
    }

    setErrors(newErrors)

    // Auto-scroll to first error
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0]
      if (firstErrorField === 'vkIdentifier') vkIdentifierRef.current?.focus()
      else if (firstErrorField === 'cisIdentifier') cisIdentifierRef.current?.focus()
      else if (firstErrorField === 'password') passwordRef.current?.focus()
    }

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    toast.loading('Prihlasovanie...')

    try {
      const response = await fetch('/api/applicant/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vkIdentifier: vkIdentifier.trim(),
          cisIdentifier: cisIdentifier.trim(),
          password
        })
      })

      const data = await response.json()

      toast.dismiss()

      if (!response.ok) {
        toast.error(data.error || 'Chyba pri prihlásení')
        return
      }

      // Session is now stored in secure httpOnly cookie by the server
      // Store only display data in sessionStorage for UI purposes
      sessionStorage.setItem('applicant-user', JSON.stringify(data.user))
      sessionStorage.setItem('applicant-vk', JSON.stringify(data.vk))
      if (data.candidate) {
        sessionStorage.setItem('applicant-candidate', JSON.stringify(data.candidate))
      }

      toast.success('Úspešne prihlásený')

      // Redirect to dashboard
      router.push('/applicant/dashboard')
    } catch (error) {
      toast.dismiss()
      toast.error('Chyba pri prihlásení')
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" data-testid="applicant-login-page">
      <div className="max-w-md w-full">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
            Výberové konanie
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Prihlásenie uchádzača
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8" data-testid="login-card">
          <form onSubmit={handleSubmit}>
            {/* VK Identifier */}
            <div className="mb-6">
              <label htmlFor="vkIdentifier" className="block text-sm font-medium text-gray-700 mb-2">
                Identifikátor VK
              </label>
              <input
                ref={vkIdentifierRef}
                id="vkIdentifier"
                type="text"
                data-testid="vk-identifier-input"
                value={vkIdentifier}
                onChange={(e) => {
                  setVkIdentifier(e.target.value)
                  if (errors.vkIdentifier) {
                    const { vkIdentifier, ...rest } = errors
                    setErrors(rest)
                  }
                }}
                placeholder="napr. VK/2025/1234"
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.vkIdentifier
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-blue-200'
                }`}
                disabled={loading}
              />
              {errors.vkIdentifier && (
                <p className="mt-2 text-sm text-red-600" data-testid="vk-identifier-error">
                  {errors.vkIdentifier}
                </p>
              )}
            </div>

            {/* CIS Identifier */}
            <div className="mb-6">
              <label htmlFor="cisIdentifier" className="block text-sm font-medium text-gray-700 mb-2">
                Identifikátor uchádzača (CIS ŠŠ)
              </label>
              <input
                ref={cisIdentifierRef}
                id="cisIdentifier"
                type="text"
                data-testid="cis-identifier-input"
                value={cisIdentifier}
                onChange={(e) => {
                  setCisIdentifier(e.target.value)
                  if (errors.cisIdentifier) {
                    const { cisIdentifier, ...rest } = errors
                    setErrors(rest)
                  }
                }}
                placeholder="napr. VK-001"
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.cisIdentifier
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-blue-200'
                }`}
                disabled={loading}
              />
              {errors.cisIdentifier && (
                <p className="mt-2 text-sm text-red-600" data-testid="cis-identifier-error">
                  {errors.cisIdentifier}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Heslo
              </label>
              <div className="relative">
                <input
                  ref={passwordRef}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  data-testid="password-input"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) {
                      const { password, ...rest } = errors
                      setErrors(rest)
                    }
                  }}
                  className={`w-full px-4 py-2 pr-12 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.password
                      ? 'border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-blue-200'
                  }`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  data-testid="toggle-password-visibility"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600" data-testid="password-error">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              data-testid="login-button"
              disabled={loading}
              className="w-full bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Prihlasovanie...' : 'Prihlásiť sa'}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Prihlasovacie údaje ste dostali od administrátora výberového konania.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
