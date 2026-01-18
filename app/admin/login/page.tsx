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
  const [showPassword, setShowPassword] = useState(false)
  const { data: session, status } = useSession()

  // Redirect if already authenticated - based on role
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Determine redirect URL based on role
      let targetUrl = callbackUrl

      // If no explicit callback or callback is to admin routes, redirect based on role
      if (!searchParams.get('callbackUrl') || callbackUrl === '/dashboard') {
        const userRole = session.user.role
        if (userRole === 'GESTOR') {
          targetUrl = '/gestor/dashboard'
        } else if (userRole === 'KOMISIA') {
          targetUrl = '/komisia/dashboard'
        } else {
          targetUrl = '/dashboard' // Admin, Superadmin go to admin dashboard
        }
      }

      router.push(targetUrl)
    }
  }, [status, session, router, callbackUrl, searchParams])

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
      const result = await signIn('admin-credentials', {
        redirect: false,
        login: data.login,
        password: data.password,
      })

      if (result?.error) {
        setError('Nesprávne prihlasovacie údaje')
        setLoading(false)
        return
      }

      // Successful login - let useEffect handle redirect based on role
      // We refresh to update the session, then useEffect will redirect
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
    <div className="min-h-screen bg-white flex flex-col font-sans text-ds-black-100 relative overflow-hidden">
      {/* Header Icons */}
      <div className="absolute top-8 left-8">
        <button className="p-2 border border-ds-grey-40 shadow-sm rounded-lg hover:bg-ds-grey-50 transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#2A222B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13" stroke="#2A222B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 17H12.01" stroke="#2A222B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="absolute top-8 right-8 flex gap-4">
        <button className="p-2 border border-ds-grey-40 shadow-sm rounded-lg hover:bg-ds-grey-50 transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#2A222B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 13H21" stroke="#2A222B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 21C14.2091 21 16 16.9706 16 12C16 7.02944 14.2091 3 12 3C9.79086 3 8 7.02944 8 12C8 16.9706 9.79086 21 12 21Z" stroke="#2A222B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button className="p-2 bg-ds-purple-80 text-white shadow-sm rounded-lg hover:opacity-90 transition-opacity">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 21V19C6 17.9391 6.42143 16.9217 7.17157 16.1716C7.92172 15.4214 8.93913 15 10 15H14C15.0609 15 16.0783 15.4214 16.8284 16.1716C17.5786 16.9217 18 17.9391 18 19V21" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-[440px] flex flex-col items-center">
          {/* Logo */}
          <div className="mb-16 flex items-center gap-2">
            <span className="text-2xl font-bold text-ds-purple-80 tracking-tight">Výberové konanie SMART</span>
          </div>

          <div className="text-center mb-10 overflow-visible">
            <h1 className="font-heading text-[40px] leading-[1.2] font-medium text-ds-black-100 flex flex-col items-center">
              <span>Prihláste sa</span>
              <span className="text-ds-black-100">do administrácie</span>
            </h1>
          </div>

          <div className="w-full">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-100 text-red-800 px-4 py-3 rounded-xl">
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="login-form">
              {/* Email/Username Field */}
              <div className="space-y-2">
                <label
                  htmlFor="login"
                  className="block text-sm font-medium text-ds-black-60"
                >
                  Emailová adresa
                </label>
                <div className="relative group">
                  <input
                    {...register('login')}
                    id="login"
                    type="text"
                    autoComplete="username"
                    data-testid="email-input"
                    className={`appearance-none block w-full pl-4 pr-12 py-3.5 bg-ds-grey-50 border-none rounded-xl text-ds-black-100 placeholder-ds-black-30 focus:outline-none focus:ring-2 focus:ring-ds-purple-80/20 transition-all sm:text-sm`}
                    placeholder="meno.priezvisko@gmail.com"
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17 18.5H7C4 18.5 2 17 2 13.5V8.5C2 5 4 3.5 7 3.5H17C20 3.5 22 5 22 8.5V13.5C22 17 20 18.5 17 18.5Z" stroke="#7F7A80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M17 9L13.87 11.5C12.84 12.32 11.15 12.32 10.12 11.5L7 9" stroke="#7F7A80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                {errors.login && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.login.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-ds-black-60"
                >
                  Heslo
                </label>
                <div className="relative group">
                  <input
                    {...register('password')}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    data-testid="password-input"
                    className={`appearance-none block w-full pl-4 pr-12 py-3.5 bg-ds-grey-50 border-none rounded-xl text-ds-black-100 placeholder-ds-black-30 focus:outline-none focus:ring-2 focus:ring-ds-purple-80/20 transition-all sm:text-sm`}
                    placeholder="************"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-4 flex items-center cursor-pointer hover:opacity-70 transition-opacity"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 12C22 12 19 18 12 18C5 18 2 12 2 12C2 12 5 6 12 6C19 6 22 12 22 12Z" stroke="#7F7A80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#7F7A80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      {!showPassword && (
                        <path d="M14.5 9L9.5 14" stroke="#7F7A80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      )}
                    </svg>
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex flex-col items-center gap-6">
                <button
                  type="submit"
                  disabled={loading}
                  data-testid="login-button"
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl shadow-lg bg-ds-purple-80 text-white font-medium hover:opacity-90 disabled:bg-ds-purple-80/50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Prihlasovanie...
                    </span>
                  ) : (
                    <>
                      <span>Prihlásiť sa</span>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14.43 5.92993L20.5 11.9999L14.43 18.0699" stroke="white" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M3.5 12H20.33" stroke="white" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </>
                  )}
                </button>

                <a
                  href="/auth/password-reset"
                  className="text-sm font-medium text-ds-purple-80 border-b border-ds-purple-80/30 pb-0.5 hover:border-ds-purple-80 transition-all"
                >
                  Zabudli ste heslo?
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Footer Links */}
      <div className="py-12 flex justify-center items-center gap-8 text-sm text-ds-black-60">
        <a href="#" className="hover:text-ds-black-100 transition-colors border-b border-ds-black-60/20 pb-0.5">Ochrana osobných údajov</a>
        <a href="#" className="hover:text-ds-black-100 transition-colors border-b border-ds-black-60/20 pb-0.5">Kontakt</a>
        <a href="#" className="hover:text-ds-black-100 transition-colors border-b border-ds-black-60/20 pb-0.5">GDPR</a>
      </div>

      {/* Development Credentials - Optional Tooltip/Toggle if needed, but keeping for dev productivity for now in a subtle way */}
      <div className="fixed bottom-4 right-4 opacity-5 hover:opacity-100 transition-opacity">
        <div className="bg-white border rounded shadow p-2 text-[10px]">
          S: superadmin@retry.sk / H25
        </div>
      </div>
    </div>
  )
}
