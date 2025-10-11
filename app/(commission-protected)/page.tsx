'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'

interface VKItem {
  id: string
  identifier: string
  selectionType: string
  organizationalUnit: string
  serviceField: string
  position: string
  serviceType: string
  startDateTime: string
  status: string
  gestor: {
    id: string
    name: string
    surname: string
  } | null
  candidatesCount: number
  myEvaluationsCount: number
  totalEvaluationsNeeded: number
  completedEvaluationsCount: number
  isChairman: boolean
  evaluationConfig: {
    id: string
    evaluatedTraits: string[]
  } | null
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const day = date.getDate()
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${day}.${month}.${year} ${hours}:${minutes}`
}

function getStatusText(status: string) {
  switch (status) {
    case 'PRIPRAVA':
      return 'Príprava'
    case 'CAKA_NA_TESTY':
      return 'Čaká na testy'
    case 'TESTOVANIE':
      return 'Testovanie'
    case 'HODNOTENIE':
      return 'Hodnotenie'
    case 'DOKONCENE':
      return 'Dokončené'
    case 'ZRUSENE':
      return 'Zrušené'
    default:
      return status
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'PRIPRAVA':
      return 'bg-gray-100 text-gray-800'
    case 'CAKA_NA_TESTY':
      return 'bg-yellow-100 text-yellow-800'
    case 'TESTOVANIE':
      return 'bg-blue-100 text-blue-800'
    case 'HODNOTENIE':
      return 'bg-purple-100 text-purple-800'
    case 'DOKONCENE':
      return 'bg-green-100 text-green-800'
    case 'ZRUSENE':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function VKCard({ vk }: { vk: VKItem }) {
  const router = useRouter()

  const myProgress = vk.candidatesCount > 0
    ? Math.round((vk.myEvaluationsCount / vk.candidatesCount) * 100)
    : 0

  const totalProgress = vk.totalEvaluationsNeeded > 0
    ? Math.round((vk.completedEvaluationsCount / vk.totalEvaluationsNeeded) * 100)
    : 0

  const handleClick = () => {
    router.push(`/commission/vk/${vk.id}`)
  }

  return (
    <div
      onClick={handleClick}
      data-testid={`vk-card-${vk.identifier}`}
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-grow">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900" data-testid="vk-identifier">
              {vk.identifier}
            </h3>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vk.status)}`}
              data-testid="vk-status"
            >
              {getStatusText(vk.status)}
            </span>
            {vk.isChairman && (
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                data-testid="chairman-badge"
              >
                Predseda
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-1" data-testid="vk-position">
            {vk.position}
          </p>
          <p className="text-sm text-gray-500" data-testid="vk-org-unit">
            {vk.organizationalUnit}
          </p>
        </div>
        <ChevronRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p className="text-gray-500">Dátum VK</p>
          <p className="text-gray-900 font-medium" data-testid="vk-date">
            {formatDate(vk.startDateTime)}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Uchádzači</p>
          <p className="text-gray-900 font-medium" data-testid="candidates-count">
            {vk.candidatesCount}
          </p>
        </div>
      </div>

      {/* Evaluation progress */}
      <div className="space-y-3">
        {/* My progress */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Moje hodnotenia</span>
            <span className="font-medium text-gray-900" data-testid="my-evaluations">
              {vk.myEvaluationsCount}/{vk.candidatesCount}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${myProgress}%` }}
              data-testid="my-progress-bar"
            />
          </div>
        </div>

        {/* Total progress */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Celkový postup</span>
            <span className="font-medium text-gray-900" data-testid="total-evaluations">
              {vk.completedEvaluationsCount}/{vk.totalEvaluationsNeeded}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${totalProgress}%` }}
              data-testid="total-progress-bar"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CommissionDashboard() {
  const [vkList, setVkList] = useState<VKItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchVK = async () => {
    try {
      const response = await fetch('/api/commission/vk')

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Chyba pri načítaní VK')
      }

      const data = await response.json()
      setVkList(data.vkList)
    } catch (error: any) {
      console.error('Fetch VK error:', error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVK()
  }, [])

  const activeVK = vkList.filter(vk => vk.status === 'HODNOTENIE')
  const otherVK = vkList.filter(vk => vk.status !== 'HODNOTENIE')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Načítavam...</p>
        </div>
      </div>
    )
  }

  if (vkList.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-900 font-medium mb-2">Žiadne výberové konania</p>
          <p className="text-gray-600">Momentálne nie ste členom žiadnej komisie.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="commission-dashboard">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">
          Dashboard komisie
        </h1>
        <p className="text-gray-600 mt-1">
          Prehľad výberových konaní kde ste členom komisie
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6" data-testid="stat-total">
          <div className="flex items-center gap-3">
            <ClipboardDocumentListIcon className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Celkovo VK</p>
              <p className="text-2xl font-bold text-gray-900">{vkList.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6" data-testid="stat-active">
          <div className="flex items-center gap-3">
            <ClockIcon className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Aktívne hodnotenie</p>
              <p className="text-2xl font-bold text-gray-900">{activeVK.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6" data-testid="stat-completed">
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Dokončené</p>
              <p className="text-2xl font-bold text-gray-900">
                {vkList.filter(vk => vk.status === 'DOKONCENE').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active VK */}
      {activeVK.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Aktívne hodnotenie
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeVK.map((vk) => (
              <VKCard key={vk.id} vk={vk} />
            ))}
          </div>
        </div>
      )}

      {/* Other VK */}
      {otherVK.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Ostatné výberové konania
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {otherVK.map((vk) => (
              <VKCard key={vk.id} vk={vk} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
