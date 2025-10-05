'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

type User = {
  id: string
  name: string
  surname: string
  email: string | null
  username: string
  active: boolean
  lastLoginAt: string | null
}

type VK = {
  id: string
  identifier: string
  position: string
  selectionType: string
  organizationalUnit: string
  status: string
  date: string
  institution: {
    id: string
    code: string
    name: string
  }
}

type TestResult = {
  id: string
  testId: string
  testName: string
  score: number
  maxScore: number
  passed: boolean
  completedAt: string
}

type Document = {
  id: string
  type: string
  filename: string
  uploadedAt: string
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
  createdAt: string
}

type Applicant = {
  id: string
  cisIdentifier: string
  email: string | null
  isArchived: boolean
  registeredAt: string
  user: User
  vk: VK
  testResults: TestResult[]
  documents: Document[]
  evaluations: Evaluation[]
}

export default function ApplicantDetailPage() {
  const router = useRouter()
  const params = useParams()
  const applicantId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [applicant, setApplicant] = useState<Applicant | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    isArchived: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchApplicant()
  }, [applicantId])

  async function fetchApplicant() {
    try {
      const res = await fetch(`/api/admin/applicants/${applicantId}`)
      const data = await res.json()

      if (data.applicant) {
        setApplicant(data.applicant)
        setFormData({
          email: data.applicant.email || '',
          isArchived: data.applicant.isArchived,
        })
      }
    } catch (error) {
      console.error('Failed to fetch applicant:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setSaving(true)
    setErrors({})

    try {
      const res = await fetch(`/api/admin/applicants/${applicantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email || null,
          isArchived: formData.isArchived,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrors({ general: data.error || 'Chyba pri aktualizácii uchádzača' })
        return
      }

      // Success - refresh data
      await fetchApplicant()
    } catch (error) {
      console.error('Failed to update applicant:', error)
      setErrors({ general: 'Chyba pri aktualizácii uchádzača' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Naozaj chcete odstrániť tohto uchádzača?')) return

    try {
      const res = await fetch(`/api/admin/applicants/${applicantId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Chyba pri odstraňovaní uchádzača')
        return
      }

      // Success - redirect to list
      router.push('/applicants')
    } catch (error) {
      console.error('Failed to delete applicant:', error)
      alert('Chyba pri odstraňovaní uchádzača')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Načítavam...</div>
      </div>
    )
  }

  if (!applicant) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Uchádzač nenájdený</p>
        <Link href="/applicants" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          Späť na zoznam
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/applicants"
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {applicant.user.name} {applicant.user.surname}
            </h1>
            <p className="mt-2 text-gray-600">
              CIS: {applicant.cisIdentifier} • {applicant.user.username}
            </p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          <TrashIcon className="h-5 w-5" />
          Odstrániť
        </button>
      </div>

      {/* VK Info */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Výberové konanie</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Identifikátor</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <Link href={`/vk/${applicant.vk.id}`} className="text-blue-600 hover:text-blue-800">
                {applicant.vk.identifier}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Pozícia</dt>
            <dd className="mt-1 text-sm text-gray-900">{applicant.vk.position}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Rezort</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {applicant.vk.institution.code} - {applicant.vk.institution.name}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Stav VK</dt>
            <dd className="mt-1 text-sm text-gray-900">{applicant.vk.status}</dd>
          </div>
        </dl>
      </div>

      {/* Applicant Info */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informácie o uchádzačovi</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Registrácia</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(applicant.registeredAt).toLocaleDateString('sk-SK')}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Posledné prihlásenie</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {applicant.user.lastLoginAt
                ? new Date(applicant.user.lastLoginAt).toLocaleDateString('sk-SK')
                : 'Nikdy'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Stav účtu</dt>
            <dd className="mt-1">
              {applicant.user.active ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Aktívny
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Neaktívny
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Stav uchádzača</dt>
            <dd className="mt-1">
              {applicant.isArchived ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Archivovaný
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Aktívny
                </span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      {/* Test Results */}
      {applicant.testResults && applicant.testResults.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Výsledky testov ({applicant.testResults.length})
          </h2>
          <div className="space-y-3">
            {applicant.testResults.map((result) => (
              <div key={result.id} className="flex items-center justify-between border-b pb-3">
                <div>
                  <div className="font-medium">{result.testName}</div>
                  <div className="text-sm text-gray-500">
                    Dokončené: {new Date(result.completedAt).toLocaleDateString('sk-SK')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {result.score} / {result.maxScore}
                  </div>
                  {result.passed ? (
                    <span className="text-xs text-green-600">Úspech</span>
                  ) : (
                    <span className="text-xs text-red-600">Neúspech</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evaluations */}
      {applicant.evaluations && applicant.evaluations.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Hodnotenia ({applicant.evaluations.length})
          </h2>
          <div className="space-y-3">
            {applicant.evaluations.map((evaluation) => (
              <div key={evaluation.id} className="border-b pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{evaluation.phase}</div>
                  {evaluation.score !== null && (
                    <div className="font-semibold">{evaluation.score} bodov</div>
                  )}
                </div>
                {evaluation.notes && (
                  <div className="text-sm text-gray-600 mb-2">{evaluation.notes}</div>
                )}
                <div className="text-xs text-gray-500">
                  Hodnotil: {evaluation.evaluator.name} {evaluation.evaluator.surname} •{' '}
                  {new Date(evaluation.evaluatedAt).toLocaleDateString('sk-SK')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Upraviť uchádzača</h2>

        <div className="space-y-6">
          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.general}
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Archived */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isArchived"
              checked={formData.isArchived}
              onChange={(e) => setFormData({ ...formData, isArchived: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isArchived" className="ml-2 block text-sm text-gray-700">
              Archivovať uchádzača
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Ukladám...' : 'Uložiť zmeny'}
            </button>
            <Link
              href="/applicants"
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Zrušiť
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
