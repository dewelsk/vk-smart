'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { PageHeader } from '@/components/PageHeader'

interface CandidateMonitoring {
  id: string
  name: string
  surname: string
  cisIdentifier: string
  status: 'TESTING' | 'COMPLETED' | 'FAILED' | 'WAITING'
  currentSession?: {
    id: string
    test: {
      level: number
      name: string
      type: string
    }
    serverStartTime: string
    durationSeconds: number
    totalQuestions: number
    answeredQuestions: number
    correctAnswers: number
    incorrectAnswers: number
    unansweredQuestions: number
  }
}

interface Summary {
  totalCandidates: number
  currentlyTesting: number
  completed: number
  failed: number
  waiting: number
}

export default function MonitoringPage() {
  const params = useParams()
  const router = useRouter()
  const vkId = params.id as string

  const [vk, setVk] = useState<any>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [candidates, setCandidates] = useState<CandidateMonitoring[]>([])
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateMonitoring[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadMonitoring()

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      loadMonitoring()
    }, 5000)

    return () => clearInterval(interval)
  }, [vkId])

  useEffect(() => {
    filterCandidates()
  }, [candidates, searchQuery, statusFilter])

  const loadMonitoring = async () => {
    try {
      const response = await fetch(`/api/admin/vk/${vkId}/monitoring`)

      if (!response.ok) {
        throw new Error('Chyba pri načítaní monitoring dát')
      }

      const data = await response.json()
      setVk(data.vk)
      setSummary(data.summary)
      setCandidates(data.candidates)
    } catch (error) {
      console.error('Monitoring load error:', error)
      toast.error('Chyba pri načítaní dát')
    } finally {
      setLoading(false)
    }
  }

  const filterCandidates = () => {
    let filtered = candidates

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.surname.toLowerCase().includes(query) ||
        c.cisIdentifier.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter)
    }

    setFilteredCandidates(filtered)
  }

  const getRemainingTime = (session: CandidateMonitoring['currentSession']) => {
    if (!session) return null

    const startTime = new Date(session.serverStartTime).getTime()
    const now = Date.now()
    const elapsed = (now - startTime) / 1000
    const remaining = Math.max(0, session.durationSeconds - elapsed)

    const minutes = Math.floor(remaining / 60)
    const seconds = Math.floor(remaining % 60)

    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getTimerColor = (session: CandidateMonitoring['currentSession']) => {
    if (!session) return ''

    const startTime = new Date(session.serverStartTime).getTime()
    const now = Date.now()
    const elapsed = (now - startTime) / 1000
    const remaining = Math.max(0, session.durationSeconds - elapsed)

    if (remaining <= 60) return 'text-red-600'
    if (remaining <= 300) return 'text-orange-600'
    return 'text-gray-900'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'TESTING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <ClockIcon className="h-4 w-4" />
            Testuje
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-4 w-4" />
            Dokončil
          </span>
        )
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-4 w-4" />
            Neúspešný
          </span>
        )
      case 'WAITING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <UserIcon className="h-4 w-4" />
            Čaká
          </span>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Načítavam monitoring...</div>
      </div>
    )
  }

  return (
    <div data-testid="monitoring-page">
      <PageHeader
        title={`Monitoring - ${vk?.identifier || ''}`}
        description="Real-time sledovanie priebehu testov"
        backLink={`/vk/${vkId}`}
        backLinkText="Späť na VK"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-4" data-testid="summary-total">
              <div className="text-2xl font-bold text-gray-900">{summary.totalCandidates}</div>
              <div className="text-sm text-gray-600">Celkovo uchádzačov</div>
            </div>
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4" data-testid="summary-testing">
              <div className="text-2xl font-bold text-blue-900">{summary.currentlyTesting}</div>
              <div className="text-sm text-blue-700">Testujú</div>
            </div>
            <div className="bg-green-50 rounded-lg border border-green-200 p-4" data-testid="summary-completed">
              <div className="text-2xl font-bold text-green-900">{summary.completed}</div>
              <div className="text-sm text-green-700">Dokončili</div>
            </div>
            <div className="bg-red-50 rounded-lg border border-red-200 p-4" data-testid="summary-failed">
              <div className="text-2xl font-bold text-red-900">{summary.failed}</div>
              <div className="text-sm text-red-700">Neúspešní</div>
            </div>
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4" data-testid="summary-waiting">
              <div className="text-2xl font-bold text-gray-900">{summary.waiting}</div>
              <div className="text-sm text-gray-600">Čakajú</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex gap-4 items-center">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Hľadať uchádzača..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                  data-testid="search-input"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
              data-testid="status-filter"
            >
              <option value="all">Všetky statusy</option>
              <option value="TESTING">Testujú</option>
              <option value="COMPLETED">Dokončili</option>
              <option value="FAILED">Neúspešní</option>
              <option value="WAITING">Čakajú</option>
            </select>
          </div>
        </div>

        {/* Candidates Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200" data-testid="candidates-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uchádzač
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktuálny test
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zostávajúci čas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Správne/Nesprávne
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    Žiadni uchádzači
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => (
                  <tr key={candidate.id} data-testid={`candidate-row-${candidate.cisIdentifier}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {candidate.name} {candidate.surname}
                      </div>
                      <div className="text-sm text-gray-500">{candidate.cisIdentifier}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(candidate.status)}
                    </td>
                    <td className="px-6 py-4">
                      {candidate.currentSession ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            Level {candidate.currentSession.test.level}: {candidate.currentSession.test.name}
                          </div>
                          <div className="text-gray-500">{candidate.currentSession.test.type}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {candidate.currentSession ? (
                        <div className={`text-sm font-mono font-semibold ${getTimerColor(candidate.currentSession)}`}>
                          {getRemainingTime(candidate.currentSession)}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {candidate.currentSession ? (
                        <div className="text-sm">
                          <div className="text-gray-900">
                            {candidate.currentSession.answeredQuestions}/{candidate.currentSession.totalQuestions} otázok
                          </div>
                          <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{
                                width: `${(candidate.currentSession.answeredQuestions / candidate.currentSession.totalQuestions) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {candidate.currentSession ? (
                        <div className="text-sm">
                          <span className="text-green-600 font-medium">
                            {candidate.currentSession.correctAnswers}
                          </span>
                          {' / '}
                          <span className="text-red-600 font-medium">
                            {candidate.currentSession.incorrectAnswers}
                          </span>
                          {candidate.currentSession.unansweredQuestions > 0 && (
                            <>
                              {' / '}
                              <span className="text-gray-500">
                                {candidate.currentSession.unansweredQuestions}
                              </span>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Auto-refresh indicator */}
        <div className="mt-4 text-center text-sm text-gray-500">
          Auto-refresh každých 5 sekúnd
        </div>
      </div>
    </div>
  )
}
