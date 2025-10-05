'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChartBarIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import type { Session } from 'next-auth'

interface SidebarProps {
  session: Session
}

export default function Sidebar({ session }: SidebarProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon, roles: ['SUPERADMIN', 'ADMIN'] },
    { name: 'Rezorty', href: '/institutions', icon: BuildingOfficeIcon, roles: ['SUPERADMIN'] },
    { name: 'Výberové konania', href: '/vk', icon: ClipboardDocumentListIcon, roles: ['SUPERADMIN', 'ADMIN'] },
    { name: 'Používatelia', href: '/users', icon: UsersIcon, roles: ['SUPERADMIN', 'ADMIN'] },
    { name: 'Uchádzači', href: '/applicants', icon: AcademicCapIcon, roles: ['SUPERADMIN', 'ADMIN'] },
    { name: 'Testy', href: '/tests', icon: DocumentTextIcon, roles: ['SUPERADMIN', 'ADMIN'] },
  ]

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(item =>
    item.roles.includes(session.user.role)
  )

  return (
    <>
      {/* Hamburger Button - visible on mobile only */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-gray-800 text-white p-2 rounded-md"
      >
        {mobileMenuOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <Bars3Icon className="h-6 w-6" />
        )}
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-64 bg-gray-800 z-40
          transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <nav className="mt-16 md:mt-5 px-2">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={false}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  group flex items-center px-2 py-2 text-sm font-medium rounded-md mb-1
                  ${
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }
                `}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
