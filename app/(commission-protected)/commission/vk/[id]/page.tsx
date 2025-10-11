'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'

interface VKDetail {
  vk: {
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
    gestor: {
      id: string
      name: string
      surname: string
    } | null
    evaluationConfig: {
      id: string
      evaluatedTraits: string[]
      questionBattery: any
    } | null
  }
  commission: {
    id: string
    chairmanId: string | null
    members: Array<{
      id: string
      userId: string
      isChairman: boolean
      user: {
        id: string
        name: string
        surname: string
        email: string
      }
    }>
  }
  myMembership: {
    id: string
    isChairman: boolean
  }
  candidates: Array<{
    id: string
    cisIdentifier: string
    email: string
    name: string | null
    surname: string | null
    phone: string | null
    registeredAt: string
    totalTestScore: number
    passedAllTests: boolean
    myEvaluation: {
      id: string
      evaluation: any
      totalScore: number
      finalized: boolean
      finalizedAt: string | null
    } | null
    allEvaluations: Array<{
      id: string
      memberId: string
      memberName: string
      totalScore: number
      finalized: boolean
    }>
    hasConflict: boolean
  }>
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const day = date.getDate()
  const months = [
    'januára', 'februára', 'marca', 'apríla', 'mája', 'júna',
    'júla', 'augusta', 'septembra', 'októbra', 'novembra', 'decembra'
  ]
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  return `${day}. ${month} ${year}`
}

const TRAIT_NAMES: Record<string, string> = {
  sebadovera: 'Sebadôvera',
  svedomitost: 'Svedomitosť a spoľahlivosť',
  samostatnost: 'Samostatnosť',
  motivacia: 'Motivácia',
  adaptabilita: 'Adaptabilita a flexibilita',
  tlak: 'Schopnosť pracovať pod tlakom',
  rozhodovanie: 'Rozhodovacia schopnosť',
  komunikacia: 'Komunikačné zručnosti',
  analyticke: 'Analytické, koncepčné a strategické myslenie',
  riadiace: 'Riadiace schopnosti',
}

export default function CommissionVKDetail() {
  const router = useRouter()
  const params = useParams()
  const vkId = params.id as string

  const [data, setData] = useState<VKDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'evaluated' | 'ranking'>('all')

  const fetchVKDetail = async () => {
    try {
      const response = await fetch(`/api/commission/vk/${vkId}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Chyba pri načítaní VK')
      }

      const vkData = await response.json()
      setData(vkData)
    } catch (error: any) {
      console.error('Fetch VK detail error:', error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVKDetail()
  }, [vkId])

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

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-900 font-medium mb-2">VK nenájdené</p>
        </div>
      </div>
    )
  }

  const { vk, commission, myMembership, candidates } = data

  // Filter candidates based on active tab
  const filteredCandidates = candidates.filter((candidate) => {
    if (activeTab === 'all') return true
    if (activeTab === 'pending') return !candidate.myEvaluation?.finalized
    if (activeTab === 'evaluated') return candidate.myEvaluation?.finalized
    if (activeTab === 'ranking') return candidate.passedAllTests
    return true
  })

  // Sort candidates by ranking (if ranking tab)
  const sortedCandidates = activeTab === 'ranking'
    ? [...filteredCandidates].sort((a, b) => {
        const aAvgScore = a.allEvaluations.length > 0
          ? a.allEvaluations.reduce((sum, e) => sum + e.totalScore, 0) / a.allEvaluations.length
          : 0
        const bAvgScore = b.allEvaluations.length > 0
          ? b.allEvaluations.reduce((sum, e) => sum + e.totalScore, 0) / b.allEvaluations.length
          : 0
        return bAvgScore - aAvgScore
      })
    : filteredCandidates

  const pendingCount = candidates.filter((c) => !c.myEvaluation?.finalized).length
  const evaluatedCount = candidates.filter((c) => c.myEvaluation?.finalized).length

  return (
    <div className="space-y-6" data-testid="commission-vk-detail">
      {/* Back button */}
      <div>
        <Link
          href="/commission"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          data-testid="back-link"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Späť na zoznam VK
        </Link>
      </div>

      {/* VK Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6" data-testid="vk-header">
        <h1 className="text-2xl font-bold text-gray-900 mb-4" data-testid="vk-identifier">
          VÝBEROVÉ KONANIE {vk.identifier}
        </h1>

        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="font-medium text-gray-500">Identifikátor</dt>
            <dd className="text-gray-900">{vk.identifier}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Druh VK</dt>
            <dd className="text-gray-900">{vk.selectionType}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Organizačný útvar</dt>
            <dd className="text-gray-900">{vk.organizationalUnit}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Odbor štátnej služby</dt>
            <dd className="text-gray-900">{vk.serviceField}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Obsadzovaná funkcia</dt>
            <dd className="text-gray-900">{vk.position}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Druh štátnej služby</dt>
            <dd className="text-gray-900">{vk.serviceType}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Dátum VK</dt>
            <dd className="text-gray-900">{formatDate(vk.startDateTime)}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Počet obsadzovaných miest</dt>
            <dd className="text-gray-900">{vk.numberOfPositions}</dd>
          </div>
        </dl>
      </div>

      {/* Commission info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6" data-testid="commission-info">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Komisia</h2>
        <ul className="space-y-2 text-sm">
          {commission.members.map((member) => (
            <li key={member.id} className="flex items-center gap-2">
              <UserGroupIcon className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">
                {member.isChairman && '⭐ Predseda: '}
                {!member.isChairman && 'Člen: '}
                {member.user.name} {member.user.surname}
                {member.userId === myMembership.id && ' (vy)'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Evaluated traits */}
      {vk.evaluationConfig && vk.evaluationConfig.evaluatedTraits.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6" data-testid="evaluated-traits">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Hodnotené schopnosti ({vk.evaluationConfig.evaluatedTraits.length})
          </h2>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
            {vk.evaluationConfig.evaluatedTraits.map((trait) => (
              <li key={trait}>{TRAIT_NAMES[trait] || trait}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Candidates */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4" data-testid="candidates-title">
          UCHÁDZAČI ({candidates.length})
        </h2>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex gap-6" data-testid="candidates-tabs">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              data-testid="tab-all"
            >
              Všetci ({candidates.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              data-testid="tab-pending"
            >
              Na hodnotenie ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('evaluated')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'evaluated'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              data-testid="tab-evaluated"
            >
              Ohodnotení ({evaluatedCount})
            </button>
            <button
              onClick={() => setActiveTab('ranking')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ranking'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              data-testid="tab-ranking"
            >
              Poradie
            </button>
          </nav>
        </div>

        {/* Candidates table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" data-testid="candidates-table">
            <thead>
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Meno a priezvisko
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CIS ID
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Testy
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hodnotenie
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akcie
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedCandidates.map((candidate, index) => {
                const candidateName = candidate.name && candidate.surname
                  ? `${candidate.name} ${candidate.surname}`
                  : candidate.email

                const evaluationStatus = candidate.myEvaluation?.finalized
                  ? 'evaluated'
                  : 'pending'

                return (
                  <tr key={candidate.id} data-testid={`candidate-row-${candidate.id}`}>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/commission/vk/${vkId}/candidate/${candidate.id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {candidateName}
                      </Link>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">
                      {candidate.cisIdentifier}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      {candidate.passedAllTests ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircleIcon className="h-4 w-4" />
                          {candidate.totalTestScore}b
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      {evaluationStatus === 'evaluated' ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircleIcon className="h-4 w-4" />
                          Hotovo
                        </span>
                      ) : candidate.hasConflict ? (
                        <span className="flex items-center gap-1 text-red-600">
                          <ExclamationTriangleIcon className="h-4 w-4" />
                          Rozpor
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-500">
                          <ClockIcon className="h-4 w-4" />
                          Čaká
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-right text-sm">
                      <Link
                        href={`/commission/vk/${vkId}/candidate/${candidate.id}`}
                        className="inline-flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                        data-testid={`evaluate-button-${candidate.id}`}
                      >
                        {evaluationStatus === 'evaluated' ? 'Zobraziť' : 'Hodnotiť'}
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {sortedCandidates.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Žiadni uchádzači v tejto kategórii
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
