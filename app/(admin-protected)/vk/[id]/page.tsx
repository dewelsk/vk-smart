'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeftIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  UserPlusIcon,
  TrashIcon,
  AcademicCapIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  ChatBubbleBottomCenterTextIcon,
} from '@heroicons/react/24/outline'
import { ValidationStatusCard } from '@/components/vk/ValidationStatusCard'
import { AddCommissionMemberModal } from '@/components/vk/AddCommissionMemberModal'
import { GestorSelectModal } from '@/components/vk/GestorSelectModal'
import { EditVKModal } from '@/components/vk/EditVKModal'
import { TestsTab } from '@/components/vk/TestsTab'
import { OralTab } from '@/components/vk/OralTab'
import { DataTable } from '@/components/table/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import type { ValidationIssue } from '@/lib/vk-validation'
import { useToast } from '@/components/Toast'
import { ConfirmModal } from '@/components/ConfirmModal'

type VK = {
  id: string
  identifier: string
  selectionType: string
  organizationalUnit: string
  serviceField: string
  position: string
  serviceType: string
  startDateTime: string
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
    deleted: boolean
    email: string | null
    registeredAt: string
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
  evaluationConfig: {
    id: string
    evaluatedTraits: string[]
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

type TabType = 'overview' | 'commission' | 'candidates' | 'tests' | 'oral'

export default function VKDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const vkId = params.id as string
  const { showSuccess, showError } = useToast()
  const queryClient = useQueryClient()

  const [loading, setLoading] = useState(true)
  const [vk, setVK] = useState<VK | null>(null)
  const [validation, setValidation] = useState<ValidationData | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)

  // Read active tab from URL
  useEffect(() => {
    const tab = searchParams.get('tab') as TabType
    if (tab && ['overview', 'commission', 'candidates', 'tests', 'oral'].includes(tab)) {
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

  async function handleDeleteVk() {
    if (!vk || isDeleting) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/admin/vk/${vkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'ZRUSENE' }),
      })

      const data = await response.json()

      if (!response.ok) {
        showError(data.error || 'Výberové konanie sa nepodarilo vymazať')
        return
      }

      setDeleteModalOpen(false)
      setLoading(true)
      await Promise.all([fetchVK(), fetchValidation()])
      showSuccess('Výberové konanie bolo presunuté do archívu')
    } catch (error) {
      console.error('Failed to delete VK:', error)
      showError('Výberové konanie sa nepodarilo vymazať')
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleExportZapisnica() {
    if (isExporting) {
      return
    }

    setIsExporting(true)

    try {
      const response = await fetch(`/api/admin/vk/${vkId}/export/zapisnica`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        showError(data.error || 'Nepodarilo sa vygenerovať zápisnicu')
        return
      }

      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank')
      }

      showSuccess('Zápisnica bola vygenerovaná')
    } catch (error) {
      console.error('Failed to export zapisnica:', error)
      showError('Nepodarilo sa vygenerovať zápisnicu')
    } finally {
      setIsExporting(false)
    }
  }

  function changeTab(tab: TabType) {
    setActiveTab(tab)
    router.push(`/vk/${vkId}?tab=${tab}`, { scroll: false })
  }

  async function handleVKUpdated() {
    setLoading(true)
    await Promise.all([fetchVK(), fetchValidation()])
    // Invalidate VK list cache to refresh the list with updated data
    queryClient.invalidateQueries({ queryKey: ['vks'] })
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

  const canDeleteVk = vk.status === 'PRIPRAVA' || vk.status === 'CAKA_NA_TESTY'
  const isArchived = vk.status === 'ZRUSENE'

  return (
    <div data-testid="vk-detail-page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 sm:flex-1">
          <Link
            href="/vk"
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 id="vk-detail-title" data-testid="vk-identifier" className="text-3xl font-bold text-gray-900">{vk.identifier}</h1>
            <p className="mt-1 text-gray-600">{vk.position}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {vk.status !== 'DOKONCENE' && !isArchived && (
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
              data-testid="edit-vk-button"
            >
              <PencilIcon className="h-4 w-4" />
              Upraviť
            </button>
          )}
          <button
            type="button"
            onClick={handleExportZapisnica}
            disabled={isExporting}
            className={`inline-flex items-center gap-2 rounded-md border border-blue-200 px-3 py-2 text-sm font-medium shadow-sm transition-colors ${
              isExporting
                ? 'bg-blue-100 text-blue-400 cursor-not-allowed'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
            data-testid="export-zapisnica-button"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            {isExporting ? 'Generujem...' : 'Exportovať zápisnicu'}
          </button>
          {canDeleteVk && !isArchived && (
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
              data-testid="delete-vk-button"
            >
              <TrashIcon className="h-4 w-4" />
              Vymazať VK
            </button>
          )}
          <StatusBadge status={vk.status} />
        </div>
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
              id="commission-tab"
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
              Komisia {vk && `(${vk.commission?.members.length ?? 0})`}
            </button>
            <button
              id="candidates-tab"
              onClick={() => changeTab('candidates')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeTab === 'candidates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <UserPlusIcon className="h-5 w-5 inline-block mr-2" />
              Uchádzači {vk && `(${vk.candidates.filter(c => !c.isArchived).length})`}
            </button>
            <button
              id="tests-tab"
              onClick={() => changeTab('tests')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeTab === 'tests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              data-testid="tests-tab"
            >
              <AcademicCapIcon className="h-5 w-5 inline-block mr-2" />
              Testy {vk && `(${vk.assignedTests.length})`}
            </button>
            <button
              id="oral-tab"
              onClick={() => changeTab('oral')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeTab === 'oral'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              data-testid="oral-tab"
            >
              <ChatBubbleBottomCenterTextIcon className="h-5 w-5 inline-block mr-2" />
              Ústna časť {vk?.evaluationConfig && `(${vk.evaluationConfig.evaluatedTraits.length})`}
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab vk={vk} onRefresh={() => { fetchVK(); fetchValidation(); queryClient.invalidateQueries({ queryKey: ['vks'] }); }} />}
          {activeTab === 'commission' && <CommissionTab vk={vk} onRefresh={() => { fetchVK(); fetchValidation(); queryClient.invalidateQueries({ queryKey: ['vks'] }); }} />}
          {activeTab === 'candidates' && <CandidatesTab vk={vk} onRefresh={() => { fetchVK(); fetchValidation(); queryClient.invalidateQueries({ queryKey: ['vks'] }); }} />}
          {activeTab === 'tests' && <TestsTab vk={vk} onRefresh={() => { fetchVK(); fetchValidation(); queryClient.invalidateQueries({ queryKey: ['vks'] }); }} />}
          {activeTab === 'oral' && <OralTab vk={vk} onRefresh={() => { fetchVK(); fetchValidation(); queryClient.invalidateQueries({ queryKey: ['vks'] }); }} />}
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Vymazať výberové konanie"
        message="Výberové konanie bude označené ako zrušené. Uchádzači prestanú byť viditeľní v zozname aktívnych uchádzačov, no všetky väzby zostanú zachované."
        confirmLabel={isDeleting ? 'Vymazávam...' : 'Vymazať'}
        cancelLabel="Zrušiť"
        variant="danger"
        onConfirm={() => {
          if (!isDeleting) {
            handleDeleteVk()
          }
        }}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteModalOpen(false)
          }
        }}
      />

      {/* Edit VK Modal */}
      {vk && (
        <EditVKModal
          open={isEditModalOpen}
          onClose={() => setEditModalOpen(false)}
          vk={vk}
          onUpdated={handleVKUpdated}
        />
      )}
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
            <dt className="text-sm font-medium text-gray-500">Dátum a čas začiatku</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(vk.startDateTime).toLocaleString('sk-SK', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
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
              <p className="font-medium">{getMemberCountText(vk.commission.members.length)}</p>
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

// Helper function for Slovak declension of "člen/členovia/členov"
function getMemberCountText(count: number): string {
  if (count === 1) return `${count} člen`
  if (count >= 2 && count <= 4) return `${count} členovia`
  return `${count} členov`
}

function CommissionTab({ vk, onRefresh }: { vk: VK, onRefresh: () => void }) {
  const { showSuccess, showError } = useToast()
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null)

  async function handleRemoveConfirm() {
    if (!memberToRemove) return

    const memberId = memberToRemove
    setMemberToRemove(null)
    setDeleting(memberId)

    try {
      const res = await fetch(`/api/admin/vk/${vk.id}/commission/members/${memberId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        showSuccess('Člen komisie bol úspešne odstránený')
        onRefresh()
      } else {
        const data = await res.json()
        showError(data.error || 'Chyba pri odstraňovaní člena')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      showError('Chyba pri odstraňovaní člena')
    } finally {
      setDeleting(null)
    }
  }

  async function handleToggleChairman(memberId: string, currentIsChairman: boolean) {
    try {
      console.log('Toggling chairman:', { memberId, currentIsChairman, newValue: !currentIsChairman })

      const res = await fetch(`/api/admin/vk/${vk.id}/commission/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isChairman: !currentIsChairman })
      })

      console.log('Response status:', res.status)

      if (res.ok) {
        const data = await res.json()
        console.log('Chairman toggled successfully:', data)
        showSuccess(currentIsChairman ? 'Používateľ už nie je predseda' : 'Používateľ bol nastavený ako predseda')
        onRefresh()
      } else {
        const data = await res.json()
        console.error('Failed to toggle chairman:', data)
        showError(data.error || 'Chyba pri zmene predsedu')
      }
    } catch (error) {
      console.error('Error toggling chairman:', error)
      showError('Chyba pri zmene predsedu: ' + (error instanceof Error ? error.message : String(error)))
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
      cell: ({ row }) => row.original.isChairman ? (
        <span data-testid={`chairman-badge-${row.original.userId}`} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <CheckIcon className="h-3 w-3" />
          Predseda
        </span>
      ) : null,
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
            {row.original.isChairman ? 'Odobrat predsedu' : 'Nastaviť ako predsedu'}
          </button>
          <button
            onClick={() => setMemberToRemove(row.original.id)}
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
        <h2 id="commission-title" className="text-lg font-semibold text-gray-900">
          Výberová komisia {memberCount > 0 && `(${getMemberCountText(memberCount)})`}
        </h2>
        <button
          id="add-commission-member-btn"
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
              <span>Párny počet členov (aktuálne: {memberCount}) - pridajte alebo odstráňte 1 člena</span>
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
            <div id="commission-valid-message" className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
              ✅ Komisia je validná ({getMemberCountText(memberCount)}, 1 predseda)
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
      {adding && (() => {
        const existingMembers = vk.commission?.members.map(m => ({
          userId: m.userId,
          isChairman: m.isChairman
        })) || []
        console.log('Opening commission modal with existingMembers:', existingMembers)
        return (
          <AddCommissionMemberModal
            vkId={vk.id}
            onClose={() => setAdding(false)}
            onSuccess={onRefresh}
            existingMembers={existingMembers}
          />
        )
      })()}

      {/* Remove Member Confirmation Modal */}
      <ConfirmModal
        isOpen={!!memberToRemove}
        title="Odstrániť člena komisie"
        message="Naozaj chcete odstrániť tohto člena z komisie? Táto akcia je nevratná."
        confirmLabel="Odstrániť"
        cancelLabel="Zrušiť"
        variant="danger"
        onConfirm={handleRemoveConfirm}
        onCancel={() => setMemberToRemove(null)}
      />
    </div>
  )
}

type Candidate = VK['candidates'][0]

function CandidatesTab({ vk, onRefresh }: { vk: VK, onRefresh: () => void }) {
  const { showSuccess, showError } = useToast()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [candidateToRemove, setCandidateToRemove] = useState<string | null>(null)

  async function handleRemoveConfirm() {
    if (!candidateToRemove) return

    const candidateId = candidateToRemove
    setCandidateToRemove(null)
    setDeleting(candidateId)
    try {
      const res = await fetch(`/api/admin/vk/${vk.id}/candidates/${candidateId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        showSuccess('Uchádzač bol úspešne odstránený')
        onRefresh()
      } else {
        const data = await res.json()
        showError(data.error || 'Chyba pri odstraňovaní uchádzača')
      }
    } catch (error) {
      console.error('Error removing candidate:', error)
      showError('Chyba pri odstraňovaní uchádzača')
    } finally {
      setDeleting(null)
    }
  }

  async function handleRestore(candidateId: string) {
    setRestoring(candidateId)
    try {
      const res = await fetch(`/api/admin/vk/${vk.id}/candidates/${candidateId}/restore`, {
        method: 'POST'
      })

      if (res.ok) {
        showSuccess('Uchádzač bol úspešne obnovený')
        onRefresh()
      } else {
        const data = await res.json()
        showError(data.error || 'Chyba pri obnovovaní uchádzača')
      }
    } catch (error) {
      console.error('Error restoring candidate:', error)
      showError('Chyba pri obnovovaní uchádzača')
    } finally {
      setRestoring(null)
    }
  }

  const activeCandidates = vk.candidates.filter(c => !c.deleted)
  const deletedCandidates = vk.candidates.filter(c => c.deleted)

  const activeColumns: ColumnDef<Candidate>[] = [
    {
      header: 'CIS identifikátor',
      accessorFn: (row) => row.cisIdentifier,
    },
    {
      header: 'Email',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-900">
            {row.original.email || '-'}
          </p>
        </div>
      ),
    },
    {
      header: 'Registrovaný',
      cell: ({ row }) => new Date(row.original.registeredAt).toLocaleDateString('sk-SK'),
    },
    {
      id: 'actions',
      header: 'Akcie',
      cell: ({ row }) => (
        <div className="space-x-2">
          <button
            onClick={() => setCandidateToRemove(row.original.id)}
            disabled={deleting === row.original.id}
            className="text-red-600 hover:text-red-900 text-sm disabled:opacity-50"
          >
            {deleting === row.original.id ? 'Odstraňujem...' : 'Odstrániť'}
          </button>
        </div>
      ),
    },
  ]

  const deletedColumns: ColumnDef<Candidate>[] = [
    {
      header: 'CIS identifikátor',
      accessorFn: (row) => row.cisIdentifier,
      cell: ({ row }) => (
        <span className="text-gray-500">{row.original.cisIdentifier}</span>
      ),
    },
    {
      header: 'Email',
      cell: ({ row }) => (
        <span className="text-gray-500">{row.original.email || '-'}</span>
      ),
    },
    {
      header: 'Registrovaný',
      cell: ({ row }) => (
        <span className="text-gray-500">
          {new Date(row.original.registeredAt).toLocaleDateString('sk-SK')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Akcie',
      cell: ({ row }) => (
        <div className="space-x-2">
          <button
            onClick={() => handleRestore(row.original.id)}
            disabled={restoring === row.original.id}
            className="text-blue-600 hover:text-blue-900 text-sm disabled:opacity-50"
          >
            {restoring === row.original.id ? 'Obnovujem...' : 'Obnoviť'}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Active candidates section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Uchádzači ({activeCandidates.length})
          </h2>
        </div>

        {activeCandidates.length > 0 ? (
          <DataTable
            columns={activeColumns}
            data={activeCandidates}
            pagination={activeCandidates.length > 10}
            pageSize={10}
          />
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Žiadni uchádzači</p>
          </div>
        )}
      </div>

      {/* Deleted candidates section */}
      {deletedCandidates.length > 0 && (
        <div className="mt-8">
          <h3 className="text-md font-semibold text-gray-500 mb-4">
            Odstránení uchádzači ({deletedCandidates.length})
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <DataTable
              columns={deletedColumns}
              data={deletedCandidates}
              pagination={deletedCandidates.length > 10}
              pageSize={10}
            />
          </div>
        </div>
      )}

      {/* Remove Candidate Confirmation Modal */}
      <ConfirmModal
        isOpen={!!candidateToRemove}
        title="Odstrániť uchádzača"
        message="Uchádzač bude označený ako odstránený a nebude sa zobrazovať komisii. Môžete ho neskôr obnoviť."
        confirmLabel="Odstrániť"
        cancelLabel="Zrušiť"
        variant="danger"
        onConfirm={handleRemoveConfirm}
        onCancel={() => setCandidateToRemove(null)}
      />
    </div>
  )
}
