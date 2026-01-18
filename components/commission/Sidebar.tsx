'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  PlayIcon,
  CheckCircleIcon,
  ArchiveBoxIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

type NavItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  testId: string
  badge?: number | string
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/commission/dashboard', icon: HomeIcon, testId: 'commission-dashboard-nav' },
  { name: 'Aktívne VK', href: '/commission/vk', icon: PlayIcon, testId: 'commission-active-vk-nav' },
  { name: 'Ukončené VK', href: '/commission/vk/completed', icon: CheckCircleIcon, testId: 'commission-completed-vk-nav' },
  { name: 'Archív', href: '/commission/archive', icon: ArchiveBoxIcon, testId: 'commission-archive-nav' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  function isActive(href: string) {
    if (href === '/commission/dashboard') {
      return pathname === '/commission/dashboard'
    }
    if (href === '/commission/vk') {
      // Only match exactly /commission/vk, not /commission/vk/completed
      return pathname === '/commission/vk' || (pathname.startsWith('/commission/vk/') && !pathname.includes('/completed'))
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Hamburger Button - visible on mobile only */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-gray-800 text-white p-2 rounded-md"
        data-testid="commission-mobile-menu-button"
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
        data-testid="commission-sidebar"
      >
        {/* Logo/Brand */}
        <div className="h-16 flex items-center px-4 border-b border-gray-700">
          <span className="text-white font-semibold text-lg">Komisia</span>
        </div>

        <nav className="mt-5 px-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={false}
                onClick={() => setMobileMenuOpen(false)}
                data-testid={item.testId}
                className={`
                  group flex items-center px-2 py-2 text-sm font-medium rounded-md mb-1
                  ${
                    active
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }
                `}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
                {item.badge !== undefined && (
                  <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
