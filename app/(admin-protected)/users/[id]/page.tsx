'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { ArrowLeftIcon, PlusIcon, TrashIcon, UserCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import { UserRole } from '@prisma/client'
import { RoleBadge } from '@/components/RoleBadge'
import { RoleAssignmentModal } from '@/components/RoleAssignmentModal'
import { ConfirmModal } from '@/components/ConfirmModal'

type RoleAssignment = {
  id: string
  role: UserRole
  assignedAt: string
  assignedBy: string | null
}

type VK = {
  id: string
  identifier: string
  status: string
}

type User = {
  id: string
  name: string
  surname: string
  email: string | null
  username: string
  role: UserRole
  active: boolean
  note: string | null
  otpEnabled: boolean
  temporaryAccount: boolean
  passwordSetToken: string | null
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
  roles: RoleAssignment[]
  vkCount: number
  recentVKs: VK[]
}

type TabType = 'overview' | 'roles'

export default function UserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const userId = params.id as string

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<RoleAssignment | null>(null)

  // Read active tab from URL
  useEffect(() => {
    const tab = searchParams?.get('tab') as TabType
    if (tab && ['overview', 'roles'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  useEffect(() => {
    fetchUser()
  }, [userId])

  async function fetchUser() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`)
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Chyba pri načítaní používateľa')
        return
      }

      setUser(data.user)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      toast.error('Chyba pri načítaní používateľa')
    } finally {
      setLoading(false)
    }
  }

  function changeTab(tab: TabType) {
    setActiveTab(tab)
    router.push(`/users/${userId}?tab=${tab}`, { scroll: false })
  }

  async function handleDeleteRole(roleAssignment: RoleAssignment) {
    const toastId = toast.loading('Odstraňujem rolu...')
    try {
      const res = await fetch(`/api/admin/users/${userId}/roles/${roleAssignment.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        toast.dismiss(toastId)
        toast.error(data.error || 'Nepodarilo sa odstrániť rolu')
        return
      }

      toast.dismiss(toastId)
      toast.success('Rola bola úspešne odstránená')
      setRoleToDelete(null)
      fetchUser() // Refresh data
    } catch (error) {
      console.error('Failed to delete role:', error)
      toast.dismiss(toastId)
      toast.error('Nepodarilo sa odstrániť rolu')
    }
  }

  if (loading) {
    return (
      <div data-testid="user-detail-loading" className="flex justify-center items-center h-64">
        <div className="text-gray-500">Načítavam...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div data-testid="user-not-found" className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Používateľ nenájdený</h3>
        <div className="mt-6">
          <Link
            href="/users"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Späť na zoznam
          </Link>
        </div>
      </div>
    )
  }

  const canManageRoles = session?.user?.role === 'SUPERADMIN' || session?.user?.role === 'ADMIN'

  return (
    <div data-testid="user-detail-page" className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/users"
          data-testid="back-to-list-link"
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 data-testid="page-title" className="text-3xl font-bold text-gray-900">
            {user.name} {user.surname}
          </h1>
          <p className="mt-1 text-gray-600" data-testid="user-username">
            {user.username}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user.active ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800" data-testid="status-badge">
              Aktívny
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800" data-testid="status-badge">
              Neaktívny
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => changeTab('overview')}
              data-testid="overview-tab"
              className={`
                py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap inline-flex items-center gap-2
                ${activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <UserCircleIcon className="h-5 w-5" />
              Prehľad
            </button>
            <button
              onClick={() => changeTab('roles')}
              data-testid="roles-tab"
              className={`
                py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap inline-flex items-center gap-2
                ${activeTab === 'roles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <ShieldCheckIcon className="h-5 w-5" />
              Role ({user.roles.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <OverviewTab user={user} />
          )}
          {activeTab === 'roles' && (
            <RolesTab
              user={user}
              canManageRoles={canManageRoles}
              onAddRole={() => setShowRoleModal(true)}
              onDeleteRole={(role) => setRoleToDelete(role)}
            />
          )}
        </div>
      </div>

      {/* Role Assignment Modal */}
      {canManageRoles && (
        <RoleAssignmentModal
          userId={userId}
          currentUserRole={session?.user?.role as UserRole}
          isOpen={showRoleModal}
          onClose={() => setShowRoleModal(false)}
          onSuccess={() => {
            fetchUser()
            setShowRoleModal(false)
          }}
        />
      )}

      {/* Delete Role Confirmation Modal */}
      {roleToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Odstrániť rolu"
          message={`Naozaj chcete odstrániť rolu "${roleToDelete.role}"?`}
          confirmLabel="Odstrániť"
          cancelLabel="Zrušiť"
          variant="danger"
          onConfirm={() => handleDeleteRole(roleToDelete)}
          onCancel={() => setRoleToDelete(null)}
        />
      )}
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ user }: { user: User }) {
  return (
    <div className="space-y-6" data-testid="overview-content">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Základné informácie</h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div data-testid="field-name">
            <dt className="text-sm font-medium text-gray-500">Meno</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.name}</dd>
          </div>
          <div data-testid="field-surname">
            <dt className="text-sm font-medium text-gray-500">Priezvisko</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.surname}</dd>
          </div>
          <div data-testid="field-email">
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.email || '-'}</dd>
          </div>
          <div data-testid="field-phone">
            <dt className="text-sm font-medium text-gray-500">Telefón</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.phone || '-'}</dd>
          </div>
          <div data-testid="field-username">
            <dt className="text-sm font-medium text-gray-500">Používateľské meno</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.username}</dd>
          </div>
          <div data-testid="field-primary-role">
            <dt className="text-sm font-medium text-gray-500">Primárna rola</dt>
            <dd className="mt-1">
              <RoleBadge role={user.role} size="sm" />
            </dd>
          </div>
          <div data-testid="field-active">
            <dt className="text-sm font-medium text-gray-500">Stav</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {user.active ? 'Aktívny' : 'Neaktívny'}
            </dd>
          </div>
          <div data-testid="field-created">
            <dt className="text-sm font-medium text-gray-500">Vytvorený</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(user.createdAt).toLocaleDateString('sk-SK')}
            </dd>
          </div>
          <div data-testid="field-last-login">
            <dt className="text-sm font-medium text-gray-500">Posledné prihlásenie</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {user.lastLoginAt
                ? new Date(user.lastLoginAt).toLocaleDateString('sk-SK')
                : 'Nikdy'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Recent VKs */}
      {user.recentVKs && user.recentVKs.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Najnovšie VK ({user.vkCount})
          </h3>
          <div className="space-y-2" data-testid="vks-list">
            {user.recentVKs.map((vk) => (
              <div key={vk.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                <Link
                  href={`/vk/${vk.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  {vk.identifier}
                </Link>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {vk.status}
                </span>
              </div>
            ))}
          </div>
          {user.vkCount > user.recentVKs.length && (
            <p className="mt-2 text-xs text-gray-500">
              + ďalších {user.vkCount - user.recentVKs.length} VK
            </p>
          )}
        </div>
      )}

      {/* Note */}
      {user.note && (
        <div data-testid="field-note">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Poznámka</h3>
          <p className="text-sm text-gray-700 p-4 bg-gray-50 rounded-md border border-gray-200">
            {user.note}
          </p>
        </div>
      )}
    </div>
  )
}

// Roles Tab Component
function RolesTab({
  user,
  canManageRoles,
  onAddRole,
  onDeleteRole,
}: {
  user: User
  canManageRoles: boolean
  onAddRole: () => void
  onDeleteRole: (role: RoleAssignment) => void
}) {
  return (
    <div className="space-y-6" data-testid="roles-content">
      {/* Header with Add Button */}
      {canManageRoles && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Priradené role</h3>
          <button
            onClick={onAddRole}
            data-testid="add-role-button"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Pridať rolu
          </button>
        </div>
      )}

      {/* Roles List */}
      {user.roles.length === 0 ? (
        <div className="text-center py-12 text-gray-500" data-testid="no-roles-message">
          Používateľ nemá priradené žiadne role
        </div>
      ) : (
        <div className="space-y-3" data-testid="roles-list">
          {user.roles.map((roleAssignment) => (
            <div
              key={roleAssignment.id}
              data-testid={`role-item-${roleAssignment.id}`}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <RoleBadge
                  role={roleAssignment.role}
                  size="md"
                />
                <div className="text-sm text-gray-500">
                  Priradené: {new Date(roleAssignment.assignedAt).toLocaleDateString('sk-SK')}
                </div>
              </div>
              {canManageRoles && (
                <button
                  onClick={() => onDeleteRole(roleAssignment)}
                  data-testid={`delete-role-${roleAssignment.id}`}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Odstrániť rolu"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info Note */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          ℹ️ Používateľ môže mať priradenú jednu alebo viac rolí.
        </p>
      </div>
    </div>
  )
}
