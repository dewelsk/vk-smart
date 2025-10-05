'use client'

import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import type { Session } from 'next-auth'

interface HeaderProps {
  session: Session
}

export default function Header({ session }: HeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/admin/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
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
