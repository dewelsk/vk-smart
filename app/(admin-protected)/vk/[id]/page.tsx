'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  UserPlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { ValidationStatusCard } from '@/components/vk/ValidationStatusCard'
import { AddCommissionMemberModal } from '@/components/vk/AddCommissionMemberModal'
import { GestorSelectModal } from '@/components/vk/GestorSelectModal'
import { DataTable } from '@/components/table/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import type { ValidationIssue } from '@/lib/vk-validation'

type VK = {
  id: string
  identifier: string
  institutionId: string
  institution: {
    id: string
    code: string
    name: string
  }
  selectionType: string
  organizationalUnit: string
  serviceField: string
  position: string
  serviceType: string
  date: string
  numberOfPositions: number
  status: string
  gestorId: string | null
  gestor: {
    id: string
    name: string
    surname: string
    email: string | null
  } | null
  createdBy: {
    id: string
    name: string
    surname: string
  }
  createdAt: string
  updatedAt: string
  candidates: Array<{
    id: string
    cisIdentifier: string
    isArchived: boolean
  }>
  assignedTests: Array<{
    id: string
    level: number
    test: {
      id: string
      name: string
      type: string
    }
  }>
  commission: {
    id: string
    members: Array<{
      id: string
      userId: string
      isChairman: boolean
      user: {
        id: string
        name: string
        surname: string
        email: string | null
        active: boolean
      }
    }>
  } | null
}

type ValidationData = {
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
  checklist: Array<{
    label: string
    completed: boolean
    action?: string
    actionLink?: string
  }>
  isReady: boolean
}

type TabType = 'overview' | 'commission'

export default function VKDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const vkId = params.id as string

  const [loading, setLoading] = useState(true)
  const [vk, setVK] = useState<VK | null>(null)
  const [validation, setValidation] = useState<ValidationData | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  // Read active tab from URL
  useEffect(() => {
    const tab = searchParams.get('tab') as TabType
    if (tab && ['overview', 'commission'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  useEffect(() => {
    fetchVK()
    fetchValidation()
  }, [vkId])

  async function fetchVK() {
    try {
      const res = await fetch(`/api/admin/vk/${vkId}`)
      const data = await res.json()
      if (data.vk) {
        setVK(data.vk)
      }
    } catch (error) {
      console.error('Failed to fetch VK:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchValidation() {
    try {
      const res = await fetch(`/api/admin/vk/${vkId}/validation`)
      const data = await res.json()
      if (data.validation) {
        setValidation(data.validation)
      }
    } catch (error) {
      console.error('Failed to fetch validation:', error)
    }
  }

  function changeTab(tab: TabType) {
    setActiveTab(tab)
    router.push(`/vk/${vkId}?tab=${tab}`, { scroll: false })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Načítavam...</div>
      </div>
    )
  }

  if (!vk) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">VK nenájdené</p>
        <Link href="/vk" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          Späť na zoznam
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/vk"
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{vk.identifier}</h1>
          <p className="mt-1 text-gray-600">{vk.position}</p>
        </div>
        <StatusBadge status={vk.status} />
      </div>

      {/* Validation Status Card */}
      {validation && (
        <ValidationStatusCard
          vkId={vk.id}
          status={vk.status}
          errors={validation.errors}
          warnings={validation.warnings}
          checklist={validation.checklist}
        />
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => changeTab('overview')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <ClipboardDocumentListIcon className="h-5 w-5 inline-block mr-2" />
              Prehľad
            </button>
            <button
              onClick={() => changeTab('commission')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeTab === 'commission'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <UserGroupIcon className="h-5 w-5 inline-block mr-2" />
              Komisia
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab vk={vk} onRefresh={() => { fetchVK(); fetchValidation(); }} />}
          {activeTab === 'commission' && <CommissionTab vk={vk} onRefresh={() => { fetchVK(); fetchValidation(); }} />}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PRIPRAVA: 'bg-gray-100 text-gray-800',
    CAKA_NA_TESTY: 'bg-yellow-100 text-yellow-800',
    TESTOVANIE: 'bg-blue-100 text-blue-800',
    HODNOTENIE: 'bg-purple-100 text-purple-800',
    DOKONCENE: 'bg-green-100 text-green-800',
    ZRUSENE: 'bg-red-100 text-red-800',
  }

  const labels: Record<string, string> = {
    PRIPRAVA: 'Príprava',
    CAKA_NA_TESTY: 'Čaká na testy',
    TESTOVANIE: 'Testovanie',
    HODNOTENIE: 'Hodnotenie',
    DOKONCENE: 'Dokončené',
    ZRUSENE: 'Zrušené',
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  )
}

function OverviewTab({ vk, onRefresh }: { vk: VK, onRefresh: () => void }) {
  const [changingGestor, setChangingGestor] = useState(false)

  return (
    <div className="space-y-6">
      {/* Základné informácie */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Základné informácie</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Identifikátor</dt>
            <dd className="mt-1 text-sm text-gray-900">{vk.identifier}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Rezort</dt>
            <dd className="mt-1 text-sm text-gray-900">{vk.institution.code} - {vk.institution.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Druh konania</dt>
            <dd className="mt-1 text-sm text-gray-900">{vk.selectionType}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Organizačný útvar</dt>
            <dd className="mt-1 text-sm text-gray-900">{vk.organizationalUnit}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Odbor</dt>
            <dd className="mt-1 text-sm text-gray-900">{vk.serviceField}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Druh štátnej služby</dt>
            <dd className="mt-1 text-sm text-gray-900">{vk.serviceType}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Dátum</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(vk.date).toLocaleDateString('sk-SK')}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Počet miest</dt>
            <dd className="mt-1 text-sm text-gray-900">{vk.numberOfPositions}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Vytvoril</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {vk.createdBy.name} {vk.createdBy.surname}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Vytvorené</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(vk.createdAt).toLocaleDateString('sk-SK')}
            </dd>
          </div>
        </dl>
      </div>

      {/* Priradení ľudia */}
      <div className="grid grid-cols-2 gap-6">
        {/* Gestor */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Gestor</h3>
          {vk.gestor ? (
            <div>
              <p className="font-medium">{vk.gestor.name} {vk.gestor.surname}</p>
              {vk.gestor.email && (
                <p className="text-sm text-gray-600">{vk.gestor.email}</p>
              )}
              <button
                onClick={() => setChangingGestor(true)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Zmeniť gestora
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-2">Nepriradený</p>
              <button
                onClick={() => setChangingGestor(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Priradiť gestora
              </button>
            </div>
          )}
        </div>

        {/* Komisia */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Komisia</h3>
          {vk.commission && vk.commission.members.length > 0 ? (
            <div>
              <p className="font-medium">{vk.commission.members.length} členov</p>
              <p className="text-sm text-gray-600">
                Predseda: {vk.commission.members.find(m => m.isChairman)
                  ? `${vk.commission.members.find(m => m.isChairman)!.user.name} ${vk.commission.members.find(m => m.isChairman)!.user.surname}`
                  : 'Nie je nastavený'
                }
              </p>
              <Link
                href={`/vk/${vk.id}?tab=commission`}
                className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800"
              >
                → Prejsť na tab Komisia
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-2">Komisia nie je vytvorená</p>
              <Link
                href={`/vk/${vk.id}?tab=commission`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Vytvoriť komisiu
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Štatistiky */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Štatistiky</h3>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <dt className="text-sm text-gray-500">Uchádzači</dt>
            <dd className="mt-1 text-2xl font-semibold text-gray-900">{vk.candidates.length}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Testy</dt>
            <dd className="mt-1 text-2xl font-semibold text-gray-900">{vk.assignedTests.length}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Testovanie</dt>
            <dd className="mt-1 text-2xl font-semibold text-gray-900">-</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Hodnotenie</dt>
            <dd className="mt-1 text-2xl font-semibold text-gray-900">-</dd>
          </div>
        </dl>
      </div>

      {/* Gestor select modal */}
      {changingGestor && (
        <GestorSelectModal
          vkId={vk.id}
          currentGestorId={vk.gestorId}
          onClose={() => setChangingGestor(false)}
          onSuccess={onRefresh}
        />
      )}
    </div>
  )
}

type CommissionMember = VK['commission']['members'][0]

function CommissionTab({ vk, onRefresh }: { vk: VK, onRefresh: () => void }) {
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleRemoveMember(memberId: string) {
    if (!confirm('Naozaj chcete odstrániť člena z komisie?')) return

    setDeleting(memberId)
    try {
      const res = await fetch(`/api/admin/vk/${vk.id}/commission/members/${memberId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        onRefresh()
      } else {
        const data = await res.json()
        alert(data.error || 'Chyba pri odstraňovaní člena')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      alert('Chyba pri odstraňovaní člena')
    } finally {
      setDeleting(null)
    }
  }

  async function handleToggleChairman(memberId: string, currentIsChairman: boolean) {
    try {
      const res = await fetch(`/api/admin/vk/${vk.id}/commission/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isChairman: !currentIsChairman })
      })

      if (res.ok) {
        onRefresh()
      } else {
        const data = await res.json()
        alert(data.error || 'Chyba pri zmene predsedu')
      }
    } catch (error) {
      console.error('Error toggling chairman:', error)
      alert('Chyba pri zmene predsedu')
    }
  }

  const hasCommission = vk.commission && vk.commission.members.length > 0
  const memberCount = vk.commission?.members.length || 0
  const chairmen = vk.commission?.members.filter(m => m.isChairman) || []

  // Column definitions for DataTable
  const columns: ColumnDef<CommissionMember>[] = [
    {
      header: 'Meno',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-900">
            {row.original.user.name} {row.original.user.surname}
          </p>
          {!row.original.user.active && (
            <span className="text-xs text-red-600">(neaktívny)</span>
          )}
        </div>
      ),
    },
    {
      header: 'Email',
      accessorFn: (row) => row.user.email || '-',
    },
    {
      header: 'Predseda',
      cell: ({ row }) => row.original.isChairman ? <CheckIcon className="h-4 w-4 text-green-600" /> : null,
    },
    {
      id: 'actions',
      header: 'Akcie',
      cell: ({ row }) => (
        <div className="space-x-2">
          <button
            onClick={() => handleToggleChairman(row.original.id, row.original.isChairman)}
            className="text-blue-600 hover:text-blue-900 text-sm"
          >
            {row.original.isChairman ? 'Odobrať z predsedu' : 'Nastaviť ako predsedu'}
          </button>
          <button
            onClick={() => handleRemoveMember(row.original.id)}
            disabled={deleting === row.original.id}
            className="text-red-600 hover:text-red-900 text-sm disabled:opacity-50"
          >
            {deleting === row.original.id ? 'Odstraňujem...' : 'Odstrániť'}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Výberová komisia {memberCount > 0 && `(${memberCount} členov)`}
        </h2>
        <button
          onClick={() => setAdding(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          + Pridať člena
        </button>
      </div>

      {/* Validation warnings */}
      {hasCommission && (
        <div className="space-y-2">
          {memberCount % 2 === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
              <span>Nepárny počet členov (aktuálne: {memberCount}) - pridajte alebo odstráňte 1 člena</span>
            </div>
          )}
          {chairmen.length === 0 && memberCount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
              <span>Žiadny predseda - nastavte jedného člena ako predsedu</span>
            </div>
          )}
          {chairmen.length > 1 && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-center gap-2">
              <XMarkIcon className="h-5 w-5 flex-shrink-0" />
              <span>Komisia má viac ako jedného predsedu - opravte</span>
            </div>
          )}
          {memberCount > 0 && memberCount % 2 === 1 && chairmen.length === 1 && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
              ✅ Komisia je validná ({memberCount} členov, 1 predseda)
            </div>
          )}
        </div>
      )}

      {/* Commission members table */}
      {hasCommission ? (
        <DataTable
          columns={columns}
          data={vk.commission.members}
          pagination={memberCount > 10}
          pageSize={10}
        />
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">Komisia ešte nie je vytvorená</p>
          <button
            onClick={() => setAdding(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            + Pridať prvého člena
          </button>
        </div>
      )}

      {/* Add member modal */}
      {adding && (
        <AddCommissionMemberModal
          vkId={vk.id}
          onClose={() => setAdding(false)}
          onSuccess={onRefresh}
          existingMemberIds={vk.commission?.members.map(m => m.userId) || []}
        />
      )}
    </div>
  )
}
