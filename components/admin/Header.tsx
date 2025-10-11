'use client'

import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowRightOnRectangleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import type { Session } from 'next-auth'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

interface HeaderProps {
  session: Session
}

export default function Header({ session }: HeaderProps) {
  const router = useRouter()
  const [isSwitchingBack, setIsSwitchingBack] = useState(false)

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/admin/login')
  }

  const handleSwitchBack = async () => {
    try {
      setIsSwitchingBack(true)
      toast.loading('Vraciam späť...')

      const response = await fetch('/api/admin/switch-back', {
        method: 'POST',
      })

      toast.dismiss()

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || 'Chyba pri návrate')
        return
      }

      const data = await response.json()
      toast.success(data.message || 'Vrátený späť na admin účet')

      // Redirect to applicants list
      router.push(data.redirectTo || '/applicants')
      router.refresh()
    } catch (error) {
      console.error('Switch back error:', error)
      toast.dismiss()
      toast.error('Chyba pri návrate na admin účet')
    } finally {
      setIsSwitchingBack(false)
    }
  }

  // Check if in switched mode
  const isSwitched = !!session.user.switchedToUserId

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      {/* Temporary Login Banner */}
      {isSwitched && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 sm:px-6 lg:px-8 py-3" data-testid="temp-login-banner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <span className="text-yellow-800">
                Dočasne prihlásený ako <strong data-testid="switched-user-name">{session.user.switchedToName}</strong>
              </span>
            </div>
            <button
              onClick={handleSwitchBack}
              disabled={isSwitchingBack}
              data-testid="switch-back-button"
              className="inline-flex items-center gap-1 text-sm font-medium text-yellow-800 hover:text-yellow-900 underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSwitchingBack ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Vraciam...
                </>
              ) : (
                'Vrátiť sa späť'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / App Name */}
          <div className="flex items-center pl-12 md:pl-0">
            <h1 className="text-xl font-bold text-gray-900">VK Smart</h1>
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-4">
            <div className="text-sm text-right">
              <p className="font-medium text-gray-900">
                {session.user.name} {session.user.surname}
              </p>
              <p className="text-gray-500 text-xs">{session.user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              Odhlásiť sa
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
