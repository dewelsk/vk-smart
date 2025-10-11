'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline'
import UploadAttachmentsModal from '@/components/applicants/UploadAttachmentsModal'
import EditApplicantModal from '@/components/applicants/EditApplicantModal'

type VK = {
  id: string
  identifier: string
  position: string
  status: string
}

type CandidateAttachment = {
  id: string
  documentType: string
  originalFileName: string
  fileSize: number
  createdAt: string
}

type CandidateAttachmentRow = CandidateAttachment & {
  candidateId: string
  vkIdentifier: string
}

type TestResult = {
  id: string
  score: number
  maxScore: number
  passed: boolean
  completedAt: string | null
  test: {
    id: string
    name: string
    testType: {
      id: string
      name: string
      description: string | null
    } | null
    testTypeCondition: {
      id: string
      name: string
      description: string | null
    } | null
  }
}

type AssignedTest = {
  vkTestId: string
  level: number
  test: {
    id: string
    name: string
    testType: {
      id: string
      name: string
      description: string | null
    } | null
    testTypeCondition: {
      id: string
      name: string
      description: string | null
    } | null
  }
  questionCount: number | null
  durationMinutes: number | null
  minScore: number | null
  session: {
    id: string
    status: string
    score: number | null
    maxScore: number | null
    passed: boolean | null
    startedAt: string | null
    completedAt: string | null
  } | null
}

type Evaluation = {
  id: string
  totalScore: number
  maxScore: number
  successRate: number
  finalized: boolean
  finalizedAt: string | null
  user: {
    id: string
    name: string
    surname: string
  }
}

type Applicant = {
  id: string
  name: string
  surname: string
  cisIdentifier: string
  email: string | null
  phone: string | null
  birthDate: string | null
  active: boolean
  isArchived: boolean
  registeredAt: string
  lastLoginAt: string | null
  vk: VK
  assignedTests: AssignedTest[]
  testSessions: Array<{
    id: string
    testId: string
    testName: string
    status: string
    score: number | null
    maxScore: number | null
    passed: boolean | null
    startedAt: string | null
    completedAt: string | null
  }>
  testResults: TestResult[]
  evaluations: Evaluation[]
  attachments: CandidateAttachment[]
}

type TabType = 'overview' | 'tests' | 'evaluations' | 'files'

const ATTACHMENT_TYPE_LABELS: Record<string, string> = {
  CV: 'Životopis',
  MOTIVATION: 'Motivačný list',
  CERTIFICATE: 'Certifikát',
  OTHER: 'Iný dokument',
  UNKNOWN: 'Neznámy typ',
}

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, exponent)

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

const formatDateTime = (value: string) => {
  const date = new Date(value)
  return date.toLocaleString('sk-SK')
}

export default function ApplicantDetailPage() {
  const params = useParams()
  const [applicant, setApplicant] = useState<Applicant | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [isUploadModalOpen, setUploadModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)

  const fetchApplicant = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/applicants/${params.id}`)
      if (!res.ok) throw new Error('Failed to fetch applicant')
      const data = await res.json()
      setApplicant(data.applicant)
    } catch (error) {
      console.error('Error fetching applicant:', error)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchApplicant()
  }, [fetchApplicant])

  // Calculate attachments - must be before conditional returns (Rules of Hooks)
  const attachments: CandidateAttachmentRow[] = useMemo(() => {
    if (!applicant) return []
    return (applicant.attachments ?? []).map(attachment => ({
      ...attachment,
      candidateId: applicant.id,
      vkIdentifier: applicant.vk.identifier,
    }))
  }, [applicant])

  const totalAttachmentCount = attachments.length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Načítavam...</div>
      </div>
    )
  }

  if (!applicant) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-gray-500 mb-4">Uchádzač nebol nájdený</div>
        <Link
          href="/applicants"
          className="text-blue-600 hover:text-blue-800"
        >
          Späť na zoznam
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="applicant-detail-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/applicants"
            data-testid="back-button"
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 data-testid="applicant-name" className="text-3xl font-bold text-gray-900">
              {applicant.name} {applicant.surname}
            </h1>
            <p data-testid="applicant-email" className="text-gray-600">{applicant.email || applicant.cisIdentifier}</p>
            <Link
              href={`/vk/${applicant.vk.id}`}
              data-testid="vk-link"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {applicant.vk.identifier} - {applicant.vk.position}
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditModalOpen(true)}
            data-testid="edit-button"
            className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <PencilIcon className="h-4 w-4" />
            Upraviť
          </button>
          {applicant.active ? (
            <span data-testid="status-badge" className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              Aktívny
            </span>
          ) : (
            <span data-testid="status-badge" className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
              Neaktívny
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200" data-testid="tabs-container">
        <nav className="-mb-px flex space-x-8">
          <button
            data-testid="overview-tab"
            onClick={() => setActiveTab('overview')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Prehľad
          </button>
          <button
            data-testid="tests-tab"
            onClick={() => setActiveTab('tests')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'tests'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Testy
          </button>
          <button
            data-testid="evaluations-tab"
            onClick={() => setActiveTab('evaluations')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'evaluations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Hodnotenia
          </button>
          <button
            data-testid="files-tab"
            onClick={() => setActiveTab('files')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'files'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Súbory ({totalAttachmentCount})
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div data-testid="overview-content" className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 data-testid="overview-title" className="text-lg font-medium text-gray-900">Základné informácie</h2>
          </div>
          <div className="px-6 py-4">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div data-testid="field-name">
                <dt className="text-sm font-medium text-gray-500">Meno</dt>
                <dd className="mt-1 text-sm text-gray-900">{applicant.name}</dd>
              </div>
              <div data-testid="field-surname">
                <dt className="text-sm font-medium text-gray-500">Priezvisko</dt>
                <dd className="mt-1 text-sm text-gray-900">{applicant.surname}</dd>
              </div>
              <div data-testid="field-cis-identifier">
                <dt className="text-sm font-medium text-gray-500">CIS Identifikátor</dt>
                <dd className="mt-1 text-sm text-gray-900">{applicant.cisIdentifier}</dd>
              </div>
              <div data-testid="field-email">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{applicant.email || '-'}</dd>
              </div>
              <div data-testid="field-phone">
                <dt className="text-sm font-medium text-gray-500">Telefón</dt>
                <dd className="mt-1 text-sm text-gray-900">{applicant.phone || '-'}</dd>
              </div>
              <div data-testid="field-status">
                <dt className="text-sm font-medium text-gray-500">Stav</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {applicant.active ? 'Aktívny' : 'Neaktívny'}
                </dd>
              </div>
              <div data-testid="field-registered">
                <dt className="text-sm font-medium text-gray-500">Registrovaný</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(applicant.registeredAt).toLocaleDateString('sk-SK')}
                </dd>
              </div>
              <div data-testid="field-last-login">
                <dt className="text-sm font-medium text-gray-500">Posledné prihlásenie</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {applicant.lastLoginAt ? new Date(applicant.lastLoginAt).toLocaleDateString('sk-SK') : '-'}
                </dd>
              </div>
            </dl>
          </div>

          {/* VK Information Section */}
          <div className="px-6 py-4 border-t border-gray-200">
            <h3 className="text-base font-medium text-gray-900 mb-4">Výberové konanie</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div data-testid="field-vk-identifier">
                <dt className="text-sm font-medium text-gray-500">Identifikátor VK</dt>
                <dd className="mt-1 text-sm">
                  <Link
                    href={`/vk/${applicant.vk.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {applicant.vk.identifier}
                  </Link>
                </dd>
              </div>
              <div data-testid="field-vk-position">
                <dt className="text-sm font-medium text-gray-500">Pozícia</dt>
                <dd className="mt-1 text-sm text-gray-900">{applicant.vk.position}</dd>
              </div>
              <div data-testid="field-vk-status">
                <dt className="text-sm font-medium text-gray-500">Stav VK</dt>
                <dd className="mt-1 text-sm text-gray-900">{applicant.vk.status}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {activeTab === 'tests' && (
        <div data-testid="tests-content" className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Pridelené testy</h2>
            <p className="mt-1 text-sm text-gray-600">
              Prehľad testov priradených k výberovému konaniu a ich aktuálny stav.
            </p>
          </div>
          <div className="p-6">
            {applicant.assignedTests.length === 0 ? (
              <div data-testid="tests-empty" className="text-gray-500">
                Žiadne testy nie sú priradené k tomuto výberovému konaniu.
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200" data-testid="tests-table">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">Level</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">Názov testu</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">Typ testu</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">Podmienka</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">Skóre</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">Výsledok</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {applicant.assignedTests.map(assignedTest => {
                      const session = assignedTest.session
                      let statusBadge = (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Nespustený
                        </span>
                      )

                      if (session) {
                        if (session.status === 'IN_PROGRESS') {
                          statusBadge = (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Prebieha
                            </span>
                          )
                        } else if (session.status === 'COMPLETED') {
                          statusBadge = (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Dokončený
                            </span>
                          )
                        }
                      }

                      return (
                        <tr key={assignedTest.vkTestId}>
                          <td className="px-4 py-3 text-gray-900 font-medium">
                            Level {assignedTest.level}
                          </td>
                          <td className="px-4 py-3 text-gray-900">{assignedTest.test.name}</td>
                          <td className="px-4 py-3 text-gray-600">{assignedTest.test.testType?.name || '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{assignedTest.test.testTypeCondition?.name || '—'}</td>
                          <td className="px-4 py-3">
                            {statusBadge}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {session && session.status === 'COMPLETED' && session.score !== null && session.maxScore !== null
                              ? `${session.score} / ${session.maxScore}`
                              : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {session && session.status === 'COMPLETED' && session.passed !== null ? (
                              session.passed ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Úspešný
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Neúspešný
                                </span>
                              )
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'evaluations' && (
        <div data-testid="evaluations-content" className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Hodnotenia komisie</h2>
            <p className="mt-1 text-sm text-gray-600">
              Hodnotenia od členov výberovej komisie.
            </p>
          </div>
          <div className="p-6">
            {applicant.evaluations.length === 0 ? (
              <div data-testid="evaluations-empty" className="text-gray-500">
                Zatiaľ neexistujú žiadne hodnotenia.
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200" data-testid="evaluations-table">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">Hodnotiteľ</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">Skóre</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">Úspešnosť</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">Stav</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">Finalizované</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {applicant.evaluations.map(evaluation => (
                      <tr key={evaluation.id}>
                        <td className="px-4 py-3 text-gray-900">
                          {evaluation.user.name} {evaluation.user.surname}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {evaluation.totalScore} / {evaluation.maxScore}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {(evaluation.successRate * 100).toFixed(1)}%
                        </td>
                        <td className="px-4 py-3">
                          {evaluation.finalized ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Finalizované
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Rozpracované
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {evaluation.finalizedAt
                            ? new Date(evaluation.finalizedAt).toLocaleDateString('sk-SK')
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'files' && (
        <div data-testid="files-content" className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Prílohy</h2>
            <p className="mt-1 text-sm text-gray-600">
              Zoznam dokumentov, ktoré uchádzač nahral pre svoje výberové konania.
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setUploadModalOpen(true)}
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                data-testid="upload-files-button"
              >
                Nahrať súbory
              </button>
            </div>
          </div>
          <div className="p-6">
            {attachments.length === 0 ? (
              <div data-testid="files-empty" className="text-gray-500">Zatiaľ neboli nahrané žiadne dokumenty.</div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200" data-testid="files-table">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">Názov súboru</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">Typ</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">Veľkosť</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">Výberové konanie</th>
                      <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">Nahrané</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium text-gray-700">Akcie</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {attachments.map(attachment => (
                      <tr key={attachment.id}>
                        <td className="px-4 py-3 text-gray-900">{attachment.originalFileName}</td>
                        <td className="px-4 py-3 text-gray-600">{ATTACHMENT_TYPE_LABELS[attachment.documentType] ?? ATTACHMENT_TYPE_LABELS.UNKNOWN}</td>
                        <td className="px-4 py-3 text-gray-600">{formatBytes(attachment.fileSize)}</td>
                        <td className="px-4 py-3 text-gray-600">{attachment.vkIdentifier}</td>
                        <td className="px-4 py-3 text-gray-600">{formatDateTime(attachment.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <a
                              href={`/api/admin/candidates/${attachment.candidateId}/attachments/${attachment.id}`}
                              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                              data-testid={`download-attachment-${attachment.id}`}
                            >
                              Stiahnuť
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <UploadAttachmentsModal
        open={isUploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        candidates={[applicant]}
        onUploaded={async () => {
          setUploadModalOpen(false)
          setLoading(true)
          await fetchApplicant()
        }}
      />

      <EditApplicantModal
        open={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        applicant={{
          id: applicant.id,
          name: applicant.name,
          surname: applicant.surname,
          cisIdentifier: applicant.cisIdentifier,
          email: applicant.email || '',
          phone: applicant.phone || '',
          active: applicant.active,
        }}
        onUpdated={async () => {
          setEditModalOpen(false)
          setLoading(true)
          await fetchApplicant()
        }}
      />
    </div>
  )
}
