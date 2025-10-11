import Link from 'next/link'
import { ClipboardDocumentListIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

type AssignmentStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED'

type Assignment = {
  id: string
  name: string
  description: string | null
  status: AssignmentStatus
  testType: {
    id: string
    name: string
  }
  testTypeCondition: {
    id: string
    name: string
    minQuestions: number | null
    maxQuestions: number | null
  }
  createdAt: string
  startedAt: string | null
}

async function getDashboardData() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5600'}/api/gestor/assignments`,
    {
      cache: 'no-store',
    }
  )

  if (!res.ok) {
    throw new Error('Failed to fetch dashboard data')
  }

  return res.json()
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('sk-SK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getStatusBadgeClass(status: AssignmentStatus) {
  switch (status) {
    case 'PENDING':
      return 'bg-orange-100 text-orange-800'
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800'
    case 'COMPLETED':
      return 'bg-green-100 text-green-800'
    case 'APPROVED':
      return 'bg-emerald-100 text-emerald-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getStatusLabel(status: AssignmentStatus) {
  switch (status) {
    case 'PENDING':
      return 'Pridelená'
    case 'IN_PROGRESS':
      return 'Rozpracovaná'
    case 'COMPLETED':
      return 'Dokončená'
    case 'APPROVED':
      return 'Schválená'
    default:
      return status
  }
}

export default async function GestorDashboardPage() {
  const data = await getDashboardData()
  const { stats, assignments } = data

  // Filter for TODO list (PENDING and IN_PROGRESS only)
  const todoAssignments = assignments.filter(
    (a: Assignment) =>
      a.status === 'PENDING' || a.status === 'IN_PROGRESS'
  ).slice(0, 10)

  return (
    <div className="max-w-7xl mx-auto" data-testid="gestor-dashboard-page">
      {/* Page Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-8" data-testid="page-title">
        Dashboard
      </h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6" data-testid="stat-pending">
          <p className="text-sm text-gray-500 mb-2">Pridelené úlohy</p>
          <p className="text-4xl font-bold text-gray-900 mb-2">{stats.pending}</p>
          <p className="text-xs text-gray-400">Status: PENDING</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6" data-testid="stat-in-progress">
          <p className="text-sm text-gray-500 mb-2">Rozpracované</p>
          <p className="text-4xl font-bold text-gray-900 mb-2">{stats.inProgress}</p>
          <p className="text-xs text-gray-400">IN_PROGRESS</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6" data-testid="stat-completed">
          <p className="text-sm text-gray-500 mb-2">Dokončené</p>
          <p className="text-4xl font-bold text-gray-900 mb-2">{stats.completed}</p>
          <p className="text-xs text-gray-400">COMPLETED</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6" data-testid="stat-approved">
          <p className="text-sm text-gray-500 mb-2">Schválené</p>
          <p className="text-4xl font-bold text-gray-900 mb-2">{stats.approved}</p>
          <p className="text-xs text-gray-400">APPROVED</p>
        </div>
      </div>

      {/* Notification Banner */}
      {stats.pending > 0 && (
        <div
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8"
          data-testid="notification-banner"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardDocumentListIcon className="h-5 w-5 text-blue-600" />
              <p className="text-blue-900">
                Máte {stats.pending} {stats.pending === 1 ? 'novú pridelenú úlohu' : 'nové priradené úlohy'}
              </p>
            </div>
            <Link
              href="/gestor/assignments"
              className="text-sm font-medium text-blue-700 hover:text-blue-800 underline"
              data-testid="show-assignments-link"
            >
              Zobraziť priradenia →
            </Link>
          </div>
        </div>
      )}

      {/* TODO List */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Moje úlohy</h2>

        {todoAssignments.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
            Nemáte žiadne aktívne úlohy
          </div>
        ) : (
          <div className="space-y-4">
            {todoAssignments.map((assignment: Assignment) => (
              <div
                key={assignment.id}
                className="bg-white border border-gray-200 rounded-lg p-6"
                data-testid={`assignment-card-${assignment.id}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{assignment.name}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                      assignment.status
                    )}`}
                  >
                    {getStatusLabel(assignment.status)}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-2">
                  {assignment.testType.name} | {assignment.testTypeCondition.name} |{' '}
                  {assignment.testTypeCondition.minQuestions}-{assignment.testTypeCondition.maxQuestions} otázok
                </p>

                <p className="text-xs text-gray-400 mb-4">
                  Priradené: {formatDate(assignment.createdAt)}
                  {assignment.startedAt && ` | Začaté: ${formatDate(assignment.startedAt)}`}
                </p>

                <Link
                  href={`/gestor/assignments/${assignment.id}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                  data-testid={`assignment-link-${assignment.id}`}
                >
                  {assignment.status === 'PENDING' ? 'Začať vytvárať test' : 'Pokračovať'}
                  <ChevronRightIcon className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        )}

        {todoAssignments.length > 0 && (
          <div className="mt-4">
            <Link
              href="/gestor/assignments"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              data-testid="show-all-assignments-link"
            >
              Zobraziť všetky úlohy
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
