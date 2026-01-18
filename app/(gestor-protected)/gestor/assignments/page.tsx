import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronRightIcon } from '@heroicons/react/24/outline'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { AssignmentStatus } from '@prisma/client'

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
  createdAt: Date
  startedAt: Date | null
  completedAt: Date | null
}

async function getAssignments(userId: string) {
  const assignments = await prisma.testAssignment.findMany({
    where: {
      assignedToUserId: userId,
    },
    orderBy: { createdAt: 'desc' },
    include: {
      testType: {
        select: {
          id: true,
          name: true,
        },
      },
      testTypeCondition: {
        select: {
          id: true,
          name: true,
          minQuestions: true,
          maxQuestions: true,
        },
      },
    },
  })

  return assignments
}

function formatDate(date: Date) {
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

export default async function GestorAssignmentsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/admin/login')
  }

  const assignments = await getAssignments(session.user.id)

  // Group by status
  const pending = assignments.filter((a: Assignment) => a.status === 'PENDING')
  const inProgress = assignments.filter((a: Assignment) => a.status === 'IN_PROGRESS')
  const completed = assignments.filter(
    (a: Assignment) => a.status === 'COMPLETED' || a.status === 'APPROVED'
  )

  return (
    <div className="max-w-7xl mx-auto" data-testid="gestor-assignments-page">
      <h1 className="text-3xl font-bold text-gray-900 mb-8" data-testid="page-title">
        Moje úlohy
      </h1>

      {/* Active Assignments - PENDING and IN_PROGRESS */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Aktívne úlohy ({pending.length + inProgress.length})
        </h2>

        {pending.length === 0 && inProgress.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
            Nemáte žiadne aktívne úlohy
          </div>
        ) : (
          <div className="space-y-4">
            {[...inProgress, ...pending].map((assignment: Assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))}
          </div>
        )}
      </div>

      {/* Completed Assignments */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Dokončené úlohy ({completed.length})
          </h2>

          <div className="space-y-4">
            {completed.map((assignment: Assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const isActive = assignment.status === 'PENDING' || assignment.status === 'IN_PROGRESS'

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-6"
      data-testid={`assignment-card-${assignment.id}`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-bold text-gray-900">{assignment.name}</h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
            assignment.status
          )}`}
          data-testid={`assignment-status-${assignment.id}`}
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
        {assignment.completedAt && ` | Dokončené: ${formatDate(assignment.completedAt)}`}
      </p>

      <Link
        href={`/gestor/assignments/${assignment.id}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        data-testid={`assignment-link-${assignment.id}`}
      >
        {isActive
          ? assignment.status === 'PENDING'
            ? 'Začať vytvárať test'
            : 'Pokračovať'
          : 'Zobraziť detail'}
        <ChevronRightIcon className="h-4 w-4" />
      </Link>
    </div>
  )
}
