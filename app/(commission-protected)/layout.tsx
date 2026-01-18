'use client'

import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import Sidebar from '@/components/commission/Sidebar'

export default function CommissionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await signOut({ redirect: false })
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Chyba pri odhlásení')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main area with left margin for sidebar */}
      <div className="md:ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-gray-900">Komisia - Výberové konania</h1>
              </div>

              <div className="flex items-center gap-4">
                {/* User info */}
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <UserCircleIcon className="h-5 w-5 text-gray-400" />
                  <span data-testid="user-name">
                    {session?.user?.name} {session?.user?.surname}
                  </span>
                </div>

                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  data-testid="logout-button"
                  className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  {isLoggingOut ? 'Odhlasovanie...' : 'Odhlásiť'}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
