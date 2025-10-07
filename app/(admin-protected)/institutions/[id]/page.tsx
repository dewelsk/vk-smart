'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useInstitution, useUpdateInstitution } from '@/hooks/useInstitutions'
import { PageHeader } from '@/components/PageHeader'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

type Props = {
  params: Promise<{
    id: string
  }>
}

const QUESTION_TYPE_OPTIONS = [
  { value: 'SINGLE_CHOICE', label: 'Jednovýberová' },
  { value: 'MULTIPLE_CHOICE', label: 'Viacvýberová' },
  { value: 'TRUE_FALSE', label: 'Pravda/Nepravda' },
  { value: 'OPEN_ENDED', label: 'Otvorená' },
]

export default function InstitutionDetailPage({ params }: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const resolvedParams = use(params)
  const institutionId = resolvedParams.id

  const { data, isLoading, error } = useInstitution(institutionId)
  const updateMutation = useUpdateInstitution()

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [active, setActive] = useState(true)
  const [allowedQuestionTypes, setAllowedQuestionTypes] = useState<string[]>(['SINGLE_CHOICE'])
  const [errors, setErrors] = useState<{ name?: string; code?: string; allowedQuestionTypes?: string }>({})

  const institution = data?.institution

  // Initialize form when data loads
  useEffect(() => {
    if (institution) {
      setName(institution.name)
      setCode(institution.code)
      setDescription(institution.description || '')
      setActive(institution.active)
      setAllowedQuestionTypes(Array.isArray(institution.allowedQuestionTypes) ? institution.allowedQuestionTypes : ['SINGLE_CHOICE'])
    }
  }, [institution])

  const handleCheckboxChange = (value: string) => {
    setAllowedQuestionTypes(prev => {
      if (prev.includes(value)) {
        // Don't allow unchecking if it's the last one
        if (prev.length === 1) {
          return prev
        }
        return prev.filter(t => t !== value)
      } else {
        return [...prev, value]
      }
    })
    if (errors.allowedQuestionTypes) {
      setErrors({ ...errors, allowedQuestionTypes: undefined })
    }
  }

  const validate = () => {
    const newErrors: { name?: string; code?: string; allowedQuestionTypes?: string } = {}

    if (!name.trim()) {
      newErrors.name = 'Názov je povinný'
    }

    if (!code.trim()) {
      newErrors.code = 'Kód je povinný'
    }

    if (allowedQuestionTypes.length === 0) {
      newErrors.allowedQuestionTypes = 'Aspoň jeden typ otázky musí byť vybraný'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      // Scroll to first error
      const firstErrorField = document.querySelector('[data-error="true"]')
      firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    const toastId = toast.loading('Ukladám zmeny...')

    try {
      await updateMutation.mutateAsync({
        id: institutionId,
        name,
        code,
        description: description || null,
        active,
        allowedQuestionTypes,
      })

      toast.dismiss(toastId)
      toast.success('Inštitúcia bola úspešne aktualizovaná')
    } catch (error: any) {
      toast.dismiss(toastId)
      toast.error(error.message || 'Nepodarilo sa aktualizovať inštitúciu')
    }
  }

  if (isLoading) {
    return (
      <div data-testid="institution-detail-loading" className="flex justify-center items-center h-64">
        <div className="text-gray-500">Načítavam...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div data-testid="institution-detail-error" className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Chyba pri načítaní inštitúcie</h3>
        <p className="mt-2 text-sm text-gray-500">{error.message}</p>
        <div className="mt-6">
          <Link
            href="/institutions"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeftIcon className="mr-2 h-5 w-5" />
            Späť na zoznam
          </Link>
        </div>
      </div>
    )
  }

  if (!institution) {
    return (
      <div data-testid="institution-not-found" className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Inštitúcia nenájdená</h3>
        <div className="mt-6">
          <Link
            href="/institutions"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeftIcon className="mr-2 h-5 w-5" />
            Späť na zoznam
          </Link>
        </div>
      </div>
    )
  }

  const canEdit = session?.user?.role === 'SUPERADMIN' || session?.user?.role === 'ADMIN'

  return (
    <div data-testid="institution-detail-page" className="space-y-6">
      <PageHeader
        title={institution.name}
        description={`Detail inštitúcie ${institution.code}`}
      />

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="mb-6">
            <Link
              href="/institutions"
              data-testid="back-to-list-link"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Späť na zoznam inštitúcií
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Názov *
              </label>
              <input
                id="name"
                data-testid="institution-name-input"
                data-error={!!errors.name}
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) {
                    setErrors({ ...errors, name: undefined })
                  }
                }}
                disabled={!canEdit}
                className={`
                  mt-1 block w-full border rounded-md shadow-sm py-2 px-3
                  focus:outline-none focus:ring-1 sm:text-sm
                  ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : ''}
                  ${errors.name
                    ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                  }
                `}
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-600" data-testid="institution-name-error">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Code */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Kód *
              </label>
              <input
                id="code"
                data-testid="institution-code-input"
                data-error={!!errors.code}
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value)
                  if (errors.code) {
                    setErrors({ ...errors, code: undefined })
                  }
                }}
                disabled={!canEdit}
                className={`
                  mt-1 block w-full border rounded-md shadow-sm py-2 px-3
                  focus:outline-none focus:ring-1 sm:text-sm
                  ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : ''}
                  ${errors.code
                    ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                  }
                `}
              />
              {errors.code && (
                <p className="mt-2 text-sm text-red-600" data-testid="institution-code-error">
                  {errors.code}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Popis
              </label>
              <textarea
                id="description"
                data-testid="institution-description-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!canEdit}
                rows={3}
                className={`
                  mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3
                  focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm
                  ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : ''}
                `}
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                id="active"
                data-testid="institution-active-checkbox"
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                disabled={!canEdit}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                Aktívna
              </label>
            </div>

            {/* Allowed Question Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Povolené typy otázok *
              </label>
              <div
                data-testid="question-types-group"
                data-error={!!errors.allowedQuestionTypes}
                className={`
                  border rounded-md p-4 space-y-3
                  ${errors.allowedQuestionTypes ? 'border-red-500' : 'border-gray-300'}
                `}
              >
                {QUESTION_TYPE_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center">
                    <input
                      id={`type-${option.value}`}
                      data-testid={`question-type-${option.value.toLowerCase()}`}
                      type="checkbox"
                      checked={allowedQuestionTypes.includes(option.value)}
                      onChange={() => handleCheckboxChange(option.value)}
                      disabled={!canEdit || (allowedQuestionTypes.includes(option.value) && allowedQuestionTypes.length === 1)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                    />
                    <label htmlFor={`type-${option.value}`} className="ml-2 block text-sm text-gray-900">
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
              {errors.allowedQuestionTypes && (
                <p className="mt-2 text-sm text-red-600" data-testid="question-types-error">
                  {errors.allowedQuestionTypes}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Aspoň jeden typ musí byť vybraný. Tieto typy budú dostupné pre všetky testy tejto inštitúcie.
              </p>
            </div>

            {/* Action Buttons */}
            {canEdit && (
              <div className="flex justify-end gap-4 pt-4 border-t">
                <Link
                  href="/institutions"
                  data-testid="cancel-button"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Zrušiť
                </Link>
                <button
                  type="submit"
                  data-testid="save-button"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateMutation.isPending ? 'Ukladám...' : 'Uložiť zmeny'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
