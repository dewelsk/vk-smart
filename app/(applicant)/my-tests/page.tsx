'use client'

import { useState, useEffect, ChangeEvent, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  LockClosedIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline'

interface VKData {
  identifier: string
  selectionType: string
  organizationalUnit: string
  serviceField: string
  position: string
  serviceType: string
  date: string
}

interface TestData {
  vkTestId: string
  level: number
  test: {
    id: string
    name: string
    type: string
  }
  questionCount: number
  durationMinutes: number
  minScore: number
  locked: boolean
  lockedReason: string
  session: {
    id: string
    status: string
    startedAt?: string
    completedAt?: string
    serverStartTime?: string
    durationSeconds?: number
    score?: number
    maxScore?: number
    passed?: boolean
    answeredQuestions?: number
  } | null
}

type AttachmentDocumentType = 'cv' | 'motivation' | 'certificate' | 'other' | 'unknown'

type PendingFile = {
  file: File
  documentType: AttachmentDocumentType
}

interface AttachmentData {
  id: string
  documentType: AttachmentDocumentType
  fileName: string
  size: number
  uploadedAt: string
}

const DOCUMENT_TYPE_LABELS: Record<AttachmentDocumentType, string> = {
  cv: 'Životopis',
  motivation: 'Motivačný list',
  certificate: 'Certifikát',
  other: 'Iný dokument',
  unknown: 'Neznáma kategória',
}

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'cv', label: 'Životopis (CV)' },
  { value: 'motivation', label: 'Motivačný list' },
  { value: 'certificate', label: 'Certifikát' },
  { value: 'other', label: 'Iná príloha' },
]

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, exponent)

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

export default function ApplicantDashboardPage() {
  const router = useRouter()
  const [vk, setVk] = useState<VKData | null>(null)
  const [tests, setTests] = useState<TestData[]>([])
  const [loading, setLoading] = useState(true)
  const [candidateId, setCandidateId] = useState('')
  const [userName, setUserName] = useState('')
  const [vkId, setVkId] = useState('')
  const [activeTab, setActiveTab] = useState<'tests' | 'attachments'>('tests')
  const [attachmentsLoading, setAttachmentsLoading] = useState(false)
  const [attachments, setAttachments] = useState<AttachmentData[]>([])
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [documentType, setDocumentType] = useState<AttachmentDocumentType>('cv')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    // Load session data
    const sessionData = sessionStorage.getItem('applicant-session')
    const userData = sessionStorage.getItem('applicant-user')

    if (!sessionData || !userData) {
      toast.error('Nie ste prihlásený')
      router.push('/applicant/login')
      return
    }

    const session = JSON.parse(sessionData)
    const user = JSON.parse(userData)
    setCandidateId(session.candidateId)
    setVkId(session.vkId || '')
    setUserName(`${user.name} ${user.surname}`)

    loadDashboard(session.candidateId)
    if (session.vkId) {
      loadAttachments(session.candidateId, session.vkId, { silent: true })
    }

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      loadDashboard(session.candidateId)
    }, 10000)

    return () => clearInterval(interval)
  }, [router, loadAttachments])

  useEffect(() => {
    if (activeTab !== 'attachments' || !candidateId || !vkId) {
      return
    }

    loadAttachments(candidateId, vkId)
  }, [activeTab, candidateId, vkId, loadAttachments])

  const loadDashboard = async (candidateId: string) => {
    try {
      const response = await fetch('/api/applicant/dashboard', {
        headers: {
          'x-candidate-id': candidateId
        }
      })

      if (!response.ok) {
        throw new Error('Chyba pri načítaní dashboardu')
      }

      const data = await response.json()
      setVk(data.vk)
      setTests(data.tests)
    } catch (error) {
      console.error('Dashboard load error:', error)
      toast.error('Chyba pri načítaní dát')
    } finally {
      setLoading(false)
    }
  }

  const loadAttachments = useCallback(async (
    candidate: string,
    vkIdParam: string,
    { silent = false }: { silent?: boolean } = {}
  ) => {
    if (!candidate || !vkIdParam) {
      return
    }

    if (!silent) {
      setAttachmentsLoading(true)
    }

    try {
      const response = await fetch('/api/applicant/attachments', {
        headers: {
          'x-candidate-id': candidate,
          'x-vk-id': vkIdParam,
        }
      })

      if (!response.ok) {
        throw new Error('Chyba pri načítaní príloh')
      }

      const data = await response.json()
      const mapped: AttachmentData[] = (data.files || []).map((item: any) => ({
        id: item.id,
        documentType: (item.documentType || 'unknown') as AttachmentDocumentType,
        fileName: item.fileName,
        size: item.size,
        uploadedAt: item.uploadedAt,
      }))

      setAttachments(mapped)
    } catch (error) {
      console.error('Attachments load error:', error)
      if (!silent) {
        toast.error('Chyba pri načítaní príloh')
      }
    } finally {
      setAttachmentsLoading(false)
    }
  }, [])

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) {
      return
    }

    const incomingFiles = Array.from(files).map(file => ({
      file,
      documentType,
    }))

    setPendingFiles(prev => [...prev, ...incomingFiles])
    event.target.value = ''
  }

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handlePendingFileTypeChange = (index: number, nextType: AttachmentDocumentType) => {
    setPendingFiles(prev =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              documentType: nextType,
            }
          : item
      )
    )
  }

  const handleUpload = async () => {
    if (!candidateId) {
      toast.error('Chýba identifikátor uchádzača')
      return
    }

    if (!vkId) {
      toast.error('Nie je dostupné ID výberového konania')
      return
    }

    if (pendingFiles.length === 0) {
      toast.error('Vyberte súbory na nahratie')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      pendingFiles.forEach(({ file, documentType: itemType }) => {
        formData.append('files', file)
        formData.append('documentTypes', itemType)
      })

      const response = await fetch('/api/applicant/attachments', {
        method: 'POST',
        headers: {
          'x-candidate-id': candidateId,
          'x-vk-id': vkId,
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Nahrávanie zlyhalo')
      }

      toast.success('Prílohy boli úspešne nahraté')
      setPendingFiles([])
      await loadAttachments(candidateId, vkId)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Nepodarilo sa nahrať prílohy')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!candidateId) {
      toast.error('Chýba identifikátor uchádzača')
      return
    }

    if (!vkId) {
      toast.error('Nie je dostupné ID výberového konania')
      return
    }

    try {
      const response = await fetch(`/api/applicant/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: {
          'x-candidate-id': candidateId,
          'x-vk-id': vkId,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Chyba pri mazaní prílohy')
      }

      toast.success('Príloha bola odstránená')
      setAttachments(prev => prev.filter(item => item.id !== attachmentId))
    } catch (error) {
      console.error('Delete attachment error:', error)
      toast.error(error instanceof Error ? error.message : 'Nepodarilo sa odstrániť prílohu')
    }
  }

  const handleDownloadAttachment = async (attachment: AttachmentData) => {
    if (!candidateId) {
      toast.error('Chýba identifikátor uchádzača')
      return
    }

    if (!vkId) {
      toast.error('Nie je dostupné ID výberového konania')
      return
    }

    try {
      const response = await fetch(`/api/applicant/attachments/${attachment.id}`, {
        headers: {
          'x-candidate-id': candidateId,
          'x-vk-id': vkId,
        },
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error((data as any).error || 'Chyba pri sťahovaní prílohy')
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = attachment.fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Download attachment error:', error)
      toast.error(error instanceof Error ? error.message : 'Nepodarilo sa stiahnuť prílohu')
    }
  }

  const handleStartTest = async (vkTestId: string) => {
    try {
      toast.loading('Spúšťam test...')

      const response = await fetch('/api/applicant/test/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-candidate-id': candidateId
        },
        body: JSON.stringify({ vkTestId })
      })

      const data = await response.json()
      toast.dismiss()

      if (!response.ok) {
        toast.error(data.error || 'Chyba pri spustení testu')
        return
      }

      router.push(data.redirectUrl)
    } catch (error) {
      toast.dismiss()
      toast.error('Chyba pri spustení testu')
      console.error('Start test error:', error)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('applicant-session')
    sessionStorage.removeItem('applicant-user')
    sessionStorage.removeItem('applicant-vk')
    router.push('/applicant/login')
  }

  const getStatusBadge = (test: TestData) => {
    if (test.locked) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-500" data-testid={`status-badge-${test.level}`}>
          <LockClosedIcon className="h-4 w-4" />
          Uzamknutý
        </span>
      )
    }

    if (!test.session) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800" data-testid={`status-badge-${test.level}`}>
          <DocumentTextIcon className="h-4 w-4" />
          Nespustený
        </span>
      )
    }

    if (test.session.status === 'IN_PROGRESS') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800" data-testid={`status-badge-${test.level}`}>
          <ClockIcon className="h-4 w-4" />
          Prebieha
        </span>
      )
    }

    if (test.session.status === 'COMPLETED') {
      if (test.session.passed) {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800" data-testid={`status-badge-${test.level}`}>
            <CheckCircleIcon className="h-4 w-4" />
            Dokončený - Prešiel
          </span>
        )
      } else {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800" data-testid={`status-badge-${test.level}`}>
            <XCircleIcon className="h-4 w-4" />
            Dokončený - Neprešiel
          </span>
        )
      }
    }

    return null
  }

  const getRemainingTime = (test: TestData) => {
    if (!test.session || !test.session.serverStartTime || !test.session.durationSeconds) {
      return null
    }

    const startTime = new Date(test.session.serverStartTime).getTime()
    const now = Date.now()
    const elapsed = (now - startTime) / 1000
    const remaining = Math.max(0, test.session.durationSeconds - elapsed)

    const minutes = Math.floor(remaining / 60)
    const seconds = Math.floor(remaining % 60)

    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Načítavam...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="applicant-dashboard-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Výberové konanie</h1>
            <p className="text-sm text-gray-600">{userName}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-gray-700 hover:text-gray-900"
            data-testid="logout-button"
          >
            Odhlásiť
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* VK Header */}
        {vk && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8" data-testid="vk-header">
            <h2 className="text-lg font-semibold text-gray-900 mb-4" data-testid="page-title">
              {vk.identifier}
            </h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-medium text-gray-700">Druh VK:</dt>
                <dd className="text-gray-900">{vk.selectionType}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700">Organizačný útvar:</dt>
                <dd className="text-gray-900">{vk.organizationalUnit}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700">Odbor štátnej služby:</dt>
                <dd className="text-gray-900">{vk.serviceField}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700">Obsadzovaná funkcia:</dt>
                <dd className="text-gray-900">{vk.position}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700">Druh štátnej služby:</dt>
                <dd className="text-gray-900">{vk.serviceType}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700">Dátum VK:</dt>
                <dd className="text-gray-900">{new Date(vk.date).toLocaleDateString('sk-SK')}</dd>
              </div>
            </dl>
          </div>
        )}

        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex gap-6 text-sm font-medium" aria-label="Sekcie pre uchádzača">
            <button
              type="button"
              onClick={() => setActiveTab('tests')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'tests'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              data-testid="tab-tests"
            >
              Testy
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('attachments')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'attachments'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              data-testid="tab-attachments"
            >
              Prílohy
            </button>
          </nav>
        </div>

        {activeTab === 'tests' && (
          <div className="space-y-4" data-testid="tests-panel">
            <h2 className="text-lg font-semibold text-gray-900">Testy</h2>

            {tests.map((test) => (
            <div
              key={test.vkTestId}
              className={`bg-white rounded-lg border p-6 ${
                test.locked ? 'bg-gray-50 border-gray-200' : 'border-gray-200'
              }`}
              data-testid={`test-card-${test.level}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Level {test.level}: {test.test.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {test.questionCount} otázok · {test.durationMinutes} minút · Min. {test.minScore} bodov
                  </p>
                </div>
                {getStatusBadge(test)}
              </div>

              {/* Session Details */}
              {test.session && test.session.status === 'IN_PROGRESS' && (
                <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-blue-900 font-medium" data-testid={`test-time-remaining-${test.level}`}>
                      Zostávajúci čas: {getRemainingTime(test)}
                    </span>
                    <span className="text-blue-700" data-testid={`test-progress-${test.level}`}>
                      Zodpovedané: {test.session.answeredQuestions || 0}/{test.questionCount}
                    </span>
                  </div>
                </div>
              )}

              {test.session && test.session.status === 'COMPLETED' && (
                <div className={`mb-4 p-3 rounded border ${
                  test.session.passed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="text-sm" data-testid={`test-score-${test.level}`}>
                    <span className={test.session.passed ? 'text-green-900 font-medium' : 'text-red-900 font-medium'}>
                      Výsledok: {test.session.score}/{test.session.maxScore} bodov
                      ({Math.round((test.session.score! / test.session.maxScore!) * 100)}%)
                    </span>
                    <div className="mt-1 text-sm">
                      {test.session.passed ? (
                        <span className="text-green-700">✓ Prešiel</span>
                      ) : (
                        <span className="text-red-700">✗ Neprešiel</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Locked Message */}
              {test.locked && (
                <p className="text-sm text-gray-600 mb-4" data-testid={`locked-message-${test.level}`}>
                  Tento test sa sprístupní po úspešnom dokončení: {test.lockedReason}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {!test.session && !test.locked && (
                  <button
                    onClick={() => handleStartTest(test.vkTestId)}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700"
                    data-testid={`start-test-button-${test.level}`}
                  >
                    Začať test
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                )}

                {test.session && test.session.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => router.push(`/applicant/test/${test.session!.id}`)}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700"
                    data-testid={`continue-test-button-${test.level}`}
                  >
                    Pokračovať v teste
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                )}

                {test.session && test.session.status === 'COMPLETED' && (
                  <button
                    onClick={() => router.push(`/applicant/test/${test.session!.id}/result`)}
                    className="border border-gray-300 text-gray-700 bg-white text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-50"
                    data-testid={`view-result-button-${test.level}`}
                  >
                    Zobraziť výsledok
                  </button>
                )}
              </div>
            </div>
          ))}
          </div>
        )}

        {activeTab === 'attachments' && (
          <div
            className="bg-white rounded-lg border border-gray-200 p-6 space-y-6"
            data-testid="attachments-panel"
          >
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <PaperClipIcon className="h-5 w-5 text-gray-500" />
                Prílohy k žiadosti
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Nahrajte dokumenty vyžadované pre výberové konanie (napríklad životopis, motivačný list alebo
                certifikáty). Podporované formáty: PDF, DOCX, DOC, ZIP.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-[220px_1fr_auto] md:items-end">
              <label className="flex flex-col gap-1 text-sm text-gray-700">
                Typ dokumentu (predvolený pre nové súbory)
                <select
                  value={documentType}
                  onChange={(event) => setDocumentType(event.target.value as AttachmentDocumentType)}
                  className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {DOCUMENT_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm text-gray-700">
                Súbory na nahratie
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelection}
                  accept=".pdf,.doc,.docx,.docm,.txt,.zip"
                  className="block w-full text-sm text-gray-900 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  data-testid="file-input"
                />
              </label>
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading || pendingFiles.length === 0}
                className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white ${
                  uploading || pendingFiles.length === 0
                    ? 'bg-blue-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                data-testid="upload-button"
              >
                {uploading ? 'Nahrávam...' : 'Nahrať prílohy'}
              </button>
            </div>

            {pendingFiles.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4" data-testid="pending-files">
                <h3 className="text-sm font-semibold text-blue-900">Vybrané súbory (pred nahratím)</h3>
                <ul className="mt-3 divide-y divide-blue-100 text-sm">
                  {pendingFiles.map(({ file, documentType: fileType }, index) => (
                    <li key={`${file.name}-${index}`} className="flex flex-col gap-2 py-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-600">{formatBytes(file.size)}</p>
                      </div>
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                        <label className="flex items-center gap-2 text-xs text-gray-700">
                          Typ:
                          <select
                            value={fileType}
                            onChange={event =>
                              handlePendingFileTypeChange(index, event.target.value as AttachmentDocumentType)
                            }
                            className="rounded-md border-gray-300 text-xs focus:border-blue-500 focus:ring-blue-500"
                          >
                            {DOCUMENT_TYPE_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemovePendingFile(index)}
                          className="text-xs font-medium text-blue-700 hover:text-blue-900"
                        >
                          Odstrániť
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Nahrané prílohy</h3>

              {attachmentsLoading ? (
                <div className="text-sm text-gray-600">Načítavam prílohy...</div>
              ) : attachments.length === 0 ? (
                <p className="text-sm text-gray-600" data-testid="attachments-empty">
                  Zatiaľ nemáte nahrané žiadne prílohy.
                </p>
              ) : (
                <div className="overflow-hidden rounded-md border border-gray-200" data-testid="attachments-table">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">Názov súboru</th>
                        <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">Typ</th>
                        <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">Veľkosť</th>
                        <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">Dátum nahratia</th>
                        <th scope="col" className="px-4 py-3 text-right font-medium text-gray-700">Akcie</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {attachments.map(attachment => (
                        <tr key={attachment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900">{attachment.fileName}</td>
                          <td className="px-4 py-3 text-gray-600">{DOCUMENT_TYPE_LABELS[attachment.documentType] || DOCUMENT_TYPE_LABELS.unknown}</td>
                          <td className="px-4 py-3 text-gray-600">{formatBytes(attachment.size)}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {attachment.uploadedAt ? new Date(attachment.uploadedAt).toLocaleString('sk-SK') : '–'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleDownloadAttachment(attachment)}
                                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                data-testid={`download-attachment-${attachment.id}`}
                              >
                                <ArrowDownTrayIcon className="h-4 w-4" />
                                Stiahnuť
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAttachment(attachment.id)}
                                className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                                data-testid={`delete-attachment-${attachment.id}`}
                              >
                                <TrashIcon className="h-4 w-4" />
                                Odstrániť
                              </button>
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
      </div>
    </div>
  )
}
