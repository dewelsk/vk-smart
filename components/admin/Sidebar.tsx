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
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline'
import type { Session } from 'next-auth'

interface SidebarProps {
  session: Session
}

type NavItem = {
  name: string
  href?: string
  icon: any
  roles: string[]
  children?: { name: string; href: string }[]
}

export default function Sidebar({ session }: SidebarProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon, roles: ['SUPERADMIN', 'ADMIN'] },
    { name: 'Výberové konania', href: '/vk', icon: ClipboardDocumentListIcon, roles: ['SUPERADMIN', 'ADMIN'] },
    { name: 'Používatelia', href: '/users', icon: UsersIcon, roles: ['SUPERADMIN', 'ADMIN'] },
    { name: 'Uchádzači', href: '/applicants', icon: AcademicCapIcon, roles: ['SUPERADMIN', 'ADMIN'] },
    {
      name: 'Testy',
      icon: DocumentTextIcon,
      roles: ['SUPERADMIN', 'ADMIN', 'GESTOR'],
      children: [
        { name: 'Zoznam testov', href: '/tests' },
        { name: 'Import testov', href: '/tests/import' },
        { name: 'Typy testov', href: '/tests/types' },
        { name: 'Bateria otázok', href: '/questions/battery' },
        { name: 'Precvičovanie', href: '/tests/practice' },
      ]
    },
    {
      name: 'Archív',
      icon: ArchiveBoxIcon,
      roles: ['SUPERADMIN', 'ADMIN'],
      children: [
        { name: 'Výberové konania', href: '/archive/vk' },
        { name: 'Uchádzači', href: '/archive/applicants' },
      ],
    },
    { name: 'Nastavenia', href: '/settings', icon: Cog6ToothIcon, roles: ['SUPERADMIN'] },
  ]

  // Filter navigation based on user roles
  const filteredNavigation = navigation.filter(item => {
    // Check if user has any of the required roles
    const userRoles = session.user.roles?.map(r => r.role) || []
    return item.roles.some(role => userRoles.includes(role))
  })

  // Auto-expand parent items if child is active
  const isChildActive = (children?: { name: string; href: string }[]) => {
    if (!children) return false
    return children.some(child => pathname === child.href || pathname.startsWith(child.href + '/'))
  }

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

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
            const hasChildren = item.children && item.children.length > 0
            const isExpanded = expandedItems.includes(item.name) || isChildActive(item.children)
            const isActive = item.href ? (pathname === item.href || pathname.startsWith(item.href + '/')) : false
            const Icon = item.icon

            if (hasChildren) {
              return (
                <div key={item.name} className="mb-1">
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className={`
                      w-full group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md
                      ${
                        isChildActive(item.children)
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </div>
                    {isExpanded ? (
                      <ChevronDownIcon className="h-4 w-4" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children?.map((child) => {
                        const isChildItemActive = pathname === child.href
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            prefetch={false}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`
                              block px-2 py-2 text-sm rounded-md
                              ${
                                isChildItemActive
                                  ? 'bg-gray-900 text-white font-medium'
                                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                              }
                            `}
                          >
                            {child.name}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.name}
                href={item.href!}
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
