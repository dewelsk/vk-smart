'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'

const loginSchema = z.object({
  login: z.string().min(1, 'Email alebo užívateľské meno je povinné'),
  password: z.string().min(1, 'Heslo je povinné'),
  rememberMe: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [callbackUrl, setCallbackUrl] = useState('/dashboard')
  const { data: session, status } = useSession()

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push(callbackUrl)
    }
  }, [status, session, router, callbackUrl])

  useEffect(() => {
    const url = searchParams.get('callbackUrl')
    if (url) {
      setCallbackUrl(url)
    }
  }, [searchParams])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  })

  async function onSubmit(data: LoginFormData) {
    setLoading(true)
    setError(null)

    try {
      const result = await signIn('credentials', {
        redirect: false,
        login: data.login,
        password: data.password,
      })

      if (result?.error) {
        setError('Nesprávne prihlasovacie údaje')
        setLoading(false)
        return
      }

      // Successful login - redirect to callback URL or dashboard
      router.push(callbackUrl)
      router.refresh()
    } catch (err) {
      console.error('Login error:', err)
      setError('Nastala chyba pri prihlasovaní. Skúste neskôr.')
      setLoading(false)
    }
  }

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 text-blue-600 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-2 text-sm text-gray-600">Načítavam...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold text-gray-900">
          Výberové konanie Smart
        </h1>
        <h2 className="mt-2 text-center text-lg text-gray-600">
          Prihlásenie do systému
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="login-form">
            {/* Email/Username Field */}
            <div>
              <label
                htmlFor="login"
                className="block text-sm font-medium text-gray-700"
              >
                Email alebo užívateľské meno
              </label>
              <div className="mt-1">
                <input
                  {...register('login')}
                  id="login"
                  type="text"
                  autoComplete="username"
                  data-testid="email-input"
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.login
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none sm:text-sm`}
                  placeholder="admin@retry.sk"
                />
              </div>
              {errors.login && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.login.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Heslo
              </label>
              <div className="mt-1">
                <input
                  {...register('password')}
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  data-testid="password-input"
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.password
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none sm:text-sm`}
                />
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <input
                {...register('rememberMe')}
                id="rememberMe"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="rememberMe"
                className="ml-2 block text-sm text-gray-900"
              >
                Zapamätať si ma
              </label>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                data-testid="login-button"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Prihlasovanie...
                  </span>
                ) : (
                  'Prihlásiť sa'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <a
                href="#"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Zabudli ste heslo?
              </a>
            </div>
          </div>
        </div>

        {/* MVP - Test Credentials */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-blue-900 mb-2">
            MVP Testovacie účty:
          </p>
          <div className="text-xs text-blue-800 space-y-1">
            <p><strong>Superadmin:</strong> superadmin@retry.sk / Hackaton25</p>
            {/*<p><strong>Admin MV:</strong> admin.mv@retry.sk / Test1234</p>*/}
            {/*<p><strong>Gestor MV:</strong> gestor.mv@retry.sk / Test1234</p>*/}
            {/*<p><strong>Komisia MV:</strong> komisia.mv@retry.sk / Test1234</p>*/}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © 2025 VK Smart - Digitalizácia výberových konaní
          </p>
        </div>
      </div>
    </div>
  )
}
