'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
} from '@heroicons/react/24/outline'

interface CandidateDetail {
  vk: {
    id: string
    identifier: string
    selectionType: string
    startDateTime: string
  }
  candidate: {
    id: string
    cisIdentifier: string
    email: string
    name: string | null
    surname: string | null
    phone: string | null
    registeredAt: string
    totalTestScore: number
    passedAllTests: boolean
    testSessions: Array<{
      id: string
      testName: string
      level: number
      score: number
      maxScore: number
      passed: boolean
      completedAt: string | null
    }>
  }
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
  questionBattery: Array<{
    id: string
    name: string
    description: string
    questions: Array<{
      id: string
      question: string
      order: number
    }>
  }> | null
  evaluatedTraits: string[]
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
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${day}. ${month} ${year} ${hours}:${minutes}`
}

type TabType = 'overview' | 'tests' | 'evaluation'

export default function CommissionCandidateDetail() {
  const router = useRouter()
  const params = useParams()
  const vkId = params.id as string
  const candidateId = params.candidateId as string

  const [data, setData] = useState<CandidateDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  useEffect(() => {
    const fetchCandidateDetail = async () => {
      try {
        const response = await fetch(`/api/commission/vk/${vkId}/candidate/${candidateId}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Chyba pri načítaní detailu kandidáta')
        }

        const candidateData = await response.json()
        setData(candidateData)
      } catch (err: any) {
        console.error('Candidate detail fetch error:', err)
        toast.error(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCandidateDetail()
  }, [vkId, candidateId])

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
          <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 font-medium mb-2">Chyba pri načítaní</p>
          <Link
            href={`/commission/vk/${vkId}`}
            className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Späť na VK
          </Link>
        </div>
      </div>
    )
  }

  const { vk, candidate, myEvaluation, allEvaluations, questionBattery } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/commission/vk/${vkId}`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Späť na VK {vk.identifier}
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {candidate.name} {candidate.surname}
            </h1>
            <p className="text-gray-600 mt-1">CIS: {candidate.cisIdentifier}</p>
          </div>

          <div className="flex items-center gap-2">
            {candidate.passedAllTests ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <CheckCircleIcon className="h-4 w-4" />
                Prešiel testami
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                <XCircleIcon className="h-4 w-4" />
                Neprešiel testami
              </span>
            )}

            {myEvaluation?.finalized && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <CheckCircleIcon className="h-4 w-4" />
                Hodnotenie dokončené
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Prehľad
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`${
              activeTab === 'tests'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Výsledky testov
          </button>
          <button
            onClick={() => setActiveTab('evaluation')}
            className={`${
              activeTab === 'evaluation'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Hodnotenie
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Základné informácie</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="font-medium text-gray-500">Email</dt>
                <dd className="text-gray-900">{candidate.email}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Telefón</dt>
                <dd className="text-gray-900">{candidate.phone || '-'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">CIS identifikátor</dt>
                <dd className="text-gray-900">{candidate.cisIdentifier}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Registrovaný</dt>
                <dd className="text-gray-900">{formatDate(candidate.registeredAt)}</dd>
              </div>
            </dl>
          </div>

          {/* Test Score Summary */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Výsledky testov</h2>
            <div className="flex items-center gap-8">
              <div>
                <p className="text-sm text-gray-500">Celkové skóre</p>
                <p className="text-3xl font-bold text-gray-900">{candidate.totalTestScore}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Počet testov</p>
                <p className="text-3xl font-bold text-gray-900">{candidate.testSessions.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Stav</p>
                <p className={`text-xl font-semibold ${candidate.passedAllTests ? 'text-green-600' : 'text-red-600'}`}>
                  {candidate.passedAllTests ? 'Prešiel' : 'Neprešiel'}
                </p>
              </div>
            </div>
          </div>

          {/* All Evaluations */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Hodnotenia komisie</h2>
            {allEvaluations.length === 0 ? (
              <p className="text-gray-500 text-sm">Zatiaľ žiadne hodnotenia</p>
            ) : (
              <div className="space-y-2">
                {allEvaluations.map((evaluation) => (
                  <div key={evaluation.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-900">{evaluation.memberName}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-900">
                        {evaluation.totalScore} bodov
                      </span>
                      {evaluation.finalized ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      ) : (
                        <ClockIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'tests' && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Výsledky testov</h2>
          {candidate.testSessions.length === 0 ? (
            <p className="text-gray-500 text-sm">Žiadne dokončené testy</p>
          ) : (
            <div className="space-y-4">
              {candidate.testSessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">
                      Level {session.level}: {session.testName}
                    </h3>
                    {session.passed ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="h-4 w-4" />
                        Prešiel
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircleIcon className="h-4 w-4" />
                        Neprešiel
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <span>
                      Skóre: <strong className="text-gray-900">{session.score}/{session.maxScore}</strong>
                    </span>
                    <span>
                      {Math.round((session.score / session.maxScore) * 100)}%
                    </span>
                    {session.completedAt && (
                      <span className="text-gray-500">
                        Dokončené: {formatDate(session.completedAt)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'evaluation' && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hodnotenie</h2>
          <p className="text-gray-600">
            Hodnotenie bude implementované v nasledujúcej fáze s batériou otázok.
          </p>
        </div>
      )}
    </div>
  )
}
