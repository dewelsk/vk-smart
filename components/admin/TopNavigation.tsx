'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  ChartBarIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ArchiveBoxIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import type { Session } from 'next-auth'
import { toast } from 'react-hot-toast'

interface TopNavigationProps {
  session: Session
}

type NavItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
}

export default function TopNavigation({ session }: TopNavigationProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isSwitchingBack, setIsSwitchingBack] = useState(false)

  // Main navigation items (flat, no dropdowns)
  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon, roles: ['SUPERADMIN', 'ADMIN'] },
    { name: 'Výberové konania', href: '/vk', icon: ClipboardDocumentListIcon, roles: ['SUPERADMIN', 'ADMIN'] },
    { name: 'Používatelia', href: '/users', icon: UsersIcon, roles: ['SUPERADMIN', 'ADMIN'] },
    { name: 'Uchádzači', href: '/applicants', icon: AcademicCapIcon, roles: ['SUPERADMIN', 'ADMIN'] },
    { name: 'Testy', href: '/tests', icon: DocumentTextIcon, roles: ['SUPERADMIN', 'ADMIN', 'GESTOR'] },
    { name: 'Archív', href: '/archive/vk', icon: ArchiveBoxIcon, roles: ['SUPERADMIN', 'ADMIN'] },
    { name: 'Nastavenia', href: '/settings', icon: Cog6ToothIcon, roles: ['SUPERADMIN'] },
  ]

  // System menu items (right side) - currently empty, can be extended later
  const systemMenu: NavItem[] = []

  // Filter navigation based on user roles
  const userRoles = session.user.roles?.map(r => r.role) || []
  const filteredNavigation = navigation.filter(item =>
    item.roles.some(role => userRoles.includes(role))
  )
  const filteredSystemMenu = systemMenu.filter(item =>
    item.roles.some(role => userRoles.includes(role))
  )

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

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

  // Get user initials for avatar
  const getInitials = () => {
    const name = session.user.name || ''
    const surname = session.user.surname || ''
    return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase()
  }

  // Get role display name
  const getRoleBadge = () => {
    const role = session.user.role
    const roleNames: Record<string, string> = {
      SUPERADMIN: 'Superadmin',
      ADMIN: 'Administrátor',
      GESTOR: 'Gestor',
      KOMISIA: 'Komisia',
    }
    return roleNames[role] || role
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
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

      {/* Main Navigation Bar */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: User info */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              data-testid="mobile-menu-button"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>

            {/* User Avatar */}
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                {getInitials()}
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {session.user.name} {session.user.surname}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {getRoleBadge()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Main Navigation (hidden on mobile) */}
          <nav className="hidden lg:flex items-center gap-1" data-testid="main-navigation">
            {filteredNavigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={false}
                  className={`
                    inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${active
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                  data-testid={`nav-${item.href.replace(/\//g, '-').slice(1)}`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Right: System Menu + Logout */}
          <div className="flex items-center gap-4">
            {/* System menu links (hidden on mobile) */}
            <div className="hidden md:flex items-center gap-4 text-sm">
              {filteredSystemMenu.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    prefetch={false}
                    className="inline-flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                    data-testid={`system-${item.href.replace(/\//g, '-').slice(1)}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden lg:inline">{item.name}</span>
                  </Link>
                )
              })}
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              data-testid="logout-button"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Odhlásiť sa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50 lg:hidden">
            <nav className="px-4 py-4 space-y-1" data-testid="mobile-navigation">
              {filteredNavigation.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    prefetch={false}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${active
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}

              {/* Divider */}
              <div className="border-t border-gray-200 my-2" />

              {/* System menu on mobile */}
              {filteredSystemMenu.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    prefetch={false}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </>
      )}
    </header>
  )
}
