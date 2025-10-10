'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTest, useUpdateTest, useCloneTest, useDeleteTest } from '@/hooks/useTests'
import { useTestCategories } from '@/hooks/useTestCategories'
import { PageHeader } from '@/components/PageHeader'
import { ConfirmModal } from '@/components/ConfirmModal'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import {
  ArrowLeftIcon,
  ClipboardDocumentListIcon,
  QuestionMarkCircleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CogIcon,
  LockClosedIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

type Props = {
  params: {
    id: string
  }
}

const QUESTION_TYPE_OPTIONS = [
  { value: 'SINGLE_CHOICE', label: 'Jednovýberová' },
  { value: 'MULTIPLE_CHOICE', label: 'Viacvýberová' },
  { value: 'TRUE_FALSE', label: 'Pravda/Nepravda' },
  { value: 'OPEN_ENDED', label: 'Otvorená' },
]

type TabType = 'overview' | 'questions' | 'vks'

export default function TestDetailPage({ params }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const testId = params.id

  const { data, isLoading, error } = useTest(testId)
  const { data: categoriesData } = useTestCategories({ limit: 100 })
  const updateMutation = useUpdateTest()
  const cloneMutation = useCloneTest()
  const deleteMutation = useDeleteTest()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState(5)
  const [recommendedDuration, setRecommendedDuration] = useState(45)
  const [categoryId, setCategoryId] = useState('')
  const [approved, setApproved] = useState(false)
  const [practiceEnabled, setPracticeEnabled] = useState(false)
  const [allowedQuestionTypes, setAllowedQuestionTypes] = useState<string[]>(['SINGLE_CHOICE'])
  const [errors, setErrors] = useState<{ name?: string; categoryId?: string; allowedQuestionTypes?: string }>({})
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [editingQuestion, setEditingQuestion] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const test = data?.test
  const categories = categoriesData?.categories || []

  // Read active tab from URL
  useEffect(() => {
    const tab = searchParams?.get('tab') as TabType
    if (tab && ['overview', 'questions', 'vks'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Initialize form when data loads
  useEffect(() => {
    if (test) {
      setName(test.name)
      setDescription(test.description || '')
      setDifficulty(test.difficulty || 5)
      setRecommendedDuration(test.recommendedDuration || 45)
      setCategoryId(test.categoryId || '')
      setApproved(test.approved)
      setPracticeEnabled(test.practiceEnabled || false)
      setAllowedQuestionTypes(Array.isArray(test.allowedQuestionTypes) ? test.allowedQuestionTypes : ['SINGLE_CHOICE'])
    }
  }, [test])

  function changeTab(tab: TabType) {
    setActiveTab(tab)
    router.push(`/tests/${testId}?tab=${tab}`, { scroll: false })
  }

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
    const newErrors: { name?: string; categoryId?: string; allowedQuestionTypes?: string } = {}

    if (!name.trim()) {
      newErrors.name = 'Názov je povinný'
    }

    if (!categoryId) {
      newErrors.categoryId = 'Kategória je povinná'
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
        id: testId,
        name,
        description: description || null,
        difficulty,
        recommendedDuration,
        categoryId,
        approved,
        practiceEnabled,
        allowedQuestionTypes,
      })

      toast.dismiss(toastId)
      toast.success('Test bol úspešne aktualizovaný')
    } catch (error: any) {
      toast.dismiss(toastId)
      toast.error(error.message || 'Nepodarilo sa aktualizovať test')
    }
  }

  if (isLoading) {
    return (
      <div data-testid="test-detail-loading" className="flex justify-center items-center h-64">
        <div className="text-gray-500">Načítavam...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div data-testid="test-detail-error" className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Chyba pri načítaní testu</h3>
        <p className="mt-2 text-sm text-gray-500">{error.message}</p>
        <div className="mt-6">
          <Link
            href="/tests"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeftIcon className="mr-2 h-5 w-5" />
            Späť na zoznam
          </Link>
        </div>
      </div>
    )
  }

  if (!test) {
    return (
      <div data-testid="test-not-found" className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Test nenájdený</h3>
        <div className="mt-6">
          <Link
            href="/tests"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeftIcon className="mr-2 h-5 w-5" />
            Späť na zoznam
          </Link>
        </div>
      </div>
    )
  }

  const hasPermission = session?.user?.role === 'SUPERADMIN' || session?.user?.role === 'ADMIN' || (session?.user?.role === 'GESTOR' && test.author?.id === session?.user?.id)
  const isUsedInVK = test.usage.totalVKs > 0
  const canEdit = hasPermission && !isUsedInVK
  const canApprove = session?.user?.role === 'SUPERADMIN'
  const canDelete = hasPermission && !test.usage.hasActiveUsage

  const handleClone = async () => {
    const toastId = toast.loading('Vytváram kópiu testu...')
    try {
      const result = await cloneMutation.mutateAsync(testId)
      toast.dismiss(toastId)
      toast.success('Kópia testu bola vytvorená')
      router.push(`/tests/${result.test.id}`)
    } catch (error: any) {
      toast.dismiss(toastId)
      toast.error(error.message || 'Nepodarilo sa naklonovať test')
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false)

    const toastId = toast.loading('Mažem test...')
    try {
      await deleteMutation.mutateAsync(testId)
      toast.dismiss(toastId)
      toast.success('Test bol úspešne vymazaný')
      router.push('/tests')
    } catch (error: any) {
      toast.dismiss(toastId)
      toast.error(error.message || 'Nepodarilo sa vymazať test')
    }
  }

  return (
    <div data-testid="test-detail-page" className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/tests"
          data-testid="back-to-list-link"
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{test.name}</h1>
          <p className="mt-1 text-gray-600">Detail testu</p>
        </div>
        <StatusBadge approved={test.approved} />

        {/* Action Buttons */}
        {hasPermission && (
          <div className="flex gap-2">
            <button
              onClick={handleClone}
              data-testid="clone-test-button"
              disabled={cloneMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
              Vytvoriť kópiu
            </button>
            <button
              onClick={handleDeleteClick}
              data-testid="delete-test-button"
              disabled={deleteMutation.isPending || !canDelete}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={!canDelete ? 'Test nemožno vymazať, pretože sa používa v aktívnom VK' : ''}
            >
              <TrashIcon className="h-4 w-4" />
              Vymazať
            </button>
          </div>
        )}
      </div>

      {/* Usage Warning */}
      {isUsedInVK && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-md" data-testid="usage-warning">
          <p className="text-sm text-orange-800">
            🔒 Tento test bol použitý vo výberovom konaní a nemôže byť upravený. Pre zmeny vytvorte kópiu testu.
          </p>
          <p className="text-xs text-orange-600 mt-1">
            Použitie: {test.usage.totalVKs} VK{test.usage.hasActiveUsage && ` (${test.usage.activeVKs} aktívne)`}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => changeTab('overview')}
              data-testid="overview-tab"
              className={`
                py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <ClipboardDocumentListIcon className="h-5 w-5 inline-block mr-2" />
              Prehľad
            </button>
            <button
              onClick={() => changeTab('questions')}
              data-testid="questions-tab"
              className={`
                py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeTab === 'questions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <QuestionMarkCircleIcon className="h-5 w-5 inline-block mr-2" />
              Otázky ({test.questionCount})
            </button>
            <button
              onClick={() => changeTab('vks')}
              data-testid="vks-tab"
              className={`
                py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeTab === 'vks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <DocumentTextIcon className="h-5 w-5 inline-block mr-2" />
              VK ({test.usage.totalVKs})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <OverviewTab
              test={test}
              categories={categories}
              canEdit={canEdit}
              canApprove={canApprove}
              name={name}
              setName={setName}
              description={description}
              setDescription={setDescription}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              recommendedDuration={recommendedDuration}
              setRecommendedDuration={setRecommendedDuration}
              categoryId={categoryId}
              setCategoryId={setCategoryId}
              approved={approved}
              setApproved={setApproved}
              practiceEnabled={practiceEnabled}
              setPracticeEnabled={setPracticeEnabled}
              allowedQuestionTypes={allowedQuestionTypes}
              handleCheckboxChange={handleCheckboxChange}
              errors={errors}
              setErrors={setErrors}
              handleSubmit={handleSubmit}
              updateMutation={updateMutation}
            />
          )}
          {activeTab === 'questions' && (
            <QuestionsTab
              test={test}
              canEdit={canEdit}
              onEditQuestion={setEditingQuestion}
            />
          )}
          {activeTab === 'vks' && <VKsTab test={test} />}
        </div>
      </div>

      {/* Edit Question Modal */}
      {editingQuestion && (
        <EditQuestionModal
          question={editingQuestion}
          allowedQuestionTypes={test.allowedQuestionTypes || []}
          onClose={() => setEditingQuestion(null)}
          onSave={async (updatedQuestion) => {
            const toastId = toast.loading('Ukladám zmeny otázky...')
            try {
              // Update the questions array with the edited question
              const updatedQuestions = (test.questions || []).map((q: any) =>
                q.id === updatedQuestion.id ? updatedQuestion : q
              )

              await updateMutation.mutateAsync({
                id: testId,
                questions: updatedQuestions,
              })

              toast.dismiss(toastId)
              toast.success('Otázka bola úspešne aktualizovaná')
              setEditingQuestion(null)
            } catch (error: any) {
              toast.dismiss(toastId)
              toast.error(error.message || 'Nepodarilo sa aktualizovať otázku')
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Vymazať test"
        message={`Naozaj chcete vymazať test "${test?.name}"? Táto akcia je nevratná.`}
        confirmLabel="Vymazať"
        cancelLabel="Zrušiť"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}

function StatusBadge({ approved }: { approved: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
        approved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}
    >
      {approved ? '✅ Schválený' : 'Neschválený'}
    </span>
  )
}

// Overview Tab Component
function OverviewTab({
  test,
  categories,
  canEdit,
  canApprove,
  name,
  setName,
  description,
  setDescription,
  difficulty,
  setDifficulty,
  recommendedDuration,
  setRecommendedDuration,
  categoryId,
  setCategoryId,
  approved,
  setApproved,
  practiceEnabled,
  setPracticeEnabled,
  allowedQuestionTypes,
  handleCheckboxChange,
  errors,
  setErrors,
  handleSubmit,
  updateMutation,
}: any) {
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <ClipboardDocumentListIcon className="h-5 w-5 text-gray-600" />
          Základné informácie
        </h3>

        {/* Name */}
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Názov *
          </label>
          <input
            id="name"
            data-testid="test-name-input"
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
            <p className="mt-2 text-sm text-red-600" data-testid="test-name-error">
              {errors.name}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Popis
          </label>
          <textarea
            id="description"
            data-testid="test-description-input"
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

        {/* Category */}
        <div className="mb-4">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Kategória *
          </label>
          <select
            id="category"
            data-testid="test-category-select"
            data-error={!!errors.categoryId}
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value)
              if (errors.categoryId) {
                setErrors({ ...errors, categoryId: undefined })
              }
            }}
            disabled={!canEdit}
            className={`
              mt-1 block w-full border rounded-md shadow-sm py-2 px-3
              focus:outline-none focus:ring-1 sm:text-sm
              ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : ''}
              ${errors.categoryId
                ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
              }
            `}
          >
            <option value="">Vyberte kategóriu</option>
            {categories.map((category: any) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="mt-2 text-sm text-red-600" data-testid="test-category-error">
              {errors.categoryId}
            </p>
          )}
        </div>

        {/* Author */}
        {test.author && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700">Autor</p>
            <p className="mt-1 text-sm text-gray-900">
              {test.author.name} {test.author.surname}
            </p>
          </div>
        )}
      </div>

      {/* Recommended Settings */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <CogIcon className="h-5 w-5 text-gray-600" />
          Odporúčané nastavenia
        </h3>

        {/* Difficulty */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Náročnosť testu *
          </label>
          <div className="flex items-center gap-4">
            <input
              data-testid="test-difficulty-slider"
              type="range"
              min="1"
              max="10"
              value={difficulty}
              onChange={(e) => setDifficulty(parseInt(e.target.value))}
              disabled={!canEdit}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
            />
            <span className="text-lg font-semibold text-gray-900 w-8 text-center" data-testid="test-difficulty-value">
              {difficulty}
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Najľahší</span>
            <span>Najnáročnejší</span>
          </div>
        </div>

        {/* Recommended Duration */}
        <div className="mb-4">
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
            Odporúčaný čas (minúty) *
          </label>
          <input
            id="duration"
            data-testid="test-duration-input"
            type="number"
            min="1"
            value={recommendedDuration}
            onChange={(e) => setRecommendedDuration(parseInt(e.target.value))}
            disabled={!canEdit}
            className={`
              mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3
              focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm
              ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : ''}
            `}
          />
        </div>

        {/* Question Count */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700">Počet otázok</p>
          <p className="mt-1 text-sm text-gray-900" data-testid="test-question-count">
            {test.questionCount}
          </p>
        </div>

        {/* Allowed Question Types */}
        <div className="mb-4">
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
            Aspoň jeden typ musí byť vybraný. Tieto typy budú dostupné pre otázky v tomto teste.
          </p>
        </div>
      </div>

      {/* Approval Status */}
      {canApprove && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <LockClosedIcon className="h-5 w-5 text-gray-600" />
            Schválenie a precvičovanie
          </h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                id="approved"
                data-testid="test-approved-checkbox"
                type="checkbox"
                checked={approved}
                onChange={(e) => setApproved(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="approved" className="ml-2 block text-sm text-gray-900">
                Schválený (test môže byť použitý vo VK)
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="practiceEnabled"
                data-testid="test-practice-enabled-checkbox"
                type="checkbox"
                checked={practiceEnabled}
                onChange={(e) => setPracticeEnabled(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="practiceEnabled" className="ml-2 block text-sm text-gray-900">
                Povoliť precvičovanie (test bude dostupný na /tests/practice)
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <ChartBarIcon className="h-5 w-5 text-gray-600" />
          Štatistiky
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Použitie</p>
            <p className="mt-1 text-sm text-gray-900" data-testid="test-usage">
              {test.usage.totalVKs === 0 ? 'Nepoužíva sa' : `${test.usage.totalVKs} VK`}
              {test.usage.hasActiveUsage && ` (${test.usage.activeVKs} aktívne)`}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">Vytvorený</p>
            <p className="mt-1 text-sm text-gray-900">{new Date(test.createdAt).toLocaleDateString('sk-SK')}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {canEdit && (
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Link
            href="/tests"
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
  )
}

// Questions Tab Component
function QuestionsTab({ test, canEdit, onEditQuestion }: any) {
  const questions = test.questions || []

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <QuestionMarkCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Žiadne otázky</h3>
        <p className="mt-1 text-sm text-gray-500">Tento test zatiaľ neobsahuje žiadne otázky.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Otázky ({questions.length})</h3>
      </div>

      <div className="space-y-4" data-testid="questions-list">
        {questions.map((question: any, index: number) => {
          const questionTypeLabel = QUESTION_TYPE_OPTIONS.find(opt => opt.value === question.questionType)?.label || question.questionType

          return (
            <div
              key={question.id || index}
              data-testid={`question-item-${index}`}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              {/* Question Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <span
                    className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold text-sm"
                    data-testid={`question-number-${index}`}
                  >
                    {question.order || index + 1}
                  </span>
                  <div className="flex-1">
                    <p
                      className="text-sm text-gray-900 font-medium"
                      data-testid={`question-text-${index}`}
                    >
                      {question.text}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                    data-testid={`question-type-${index}`}
                  >
                    {questionTypeLabel}
                  </span>
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    data-testid={`question-points-${index}`}
                  >
                    {question.points || 1} {question.points === 1 ? 'bod' : 'body'}
                  </span>
                </div>
              </div>

              {/* Answers */}
              {question.answers && Array.isArray(question.answers) && question.answers.length > 0 && (
                <div className="ml-11 space-y-2 mb-3" data-testid={`question-answers-${index}`}>
                  {question.answers.map((answer: any, answerIndex: number) => (
                    <div
                      key={answerIndex}
                      data-testid={`answer-${index}-${answerIndex}`}
                      className={`
                        flex items-start gap-2 p-2 rounded text-sm
                        ${answer.isCorrect
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-white border border-gray-200'
                        }
                      `}
                    >
                      <span className="font-semibold text-gray-700 flex-shrink-0">
                        {answer.letter})
                      </span>
                      <span className={answer.isCorrect ? 'text-green-900 font-medium' : 'text-gray-700'}>
                        {answer.text}
                      </span>
                      {answer.isCorrect && (
                        <span
                          className="ml-auto text-green-600 font-semibold text-xs"
                          data-testid={`correct-answer-${index}`}
                        >
                          ✓ Správna
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Edit Button */}
              {canEdit && (
                <div className="flex justify-end mt-3 pt-3 border-t border-gray-200">
                  <button
                    data-testid={`edit-question-${index}-button`}
                    onClick={() => onEditQuestion(question)}
                    className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Upraviť
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// VKs Tab Component
function VKsTab({ test }: any) {
  // Placeholder for now - will be implemented later
  return (
    <div className="text-center py-12">
      <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">VK zoznam</h3>
      <p className="mt-1 text-sm text-gray-500">
        Test je priradený k {test.usage.totalVKs} výberovým konaniam.
      </p>
      <p className="mt-1 text-xs text-gray-400">
        (Táto sekcia bude implementovaná neskôr)
      </p>
    </div>
  )
}

// Edit Question Modal Component
function EditQuestionModal({
  question,
  allowedQuestionTypes,
  onClose,
  onSave,
}: {
  question: any
  allowedQuestionTypes: string[]
  onClose: () => void
  onSave: (question: any) => Promise<void>
}) {
  const [editedQuestion, setEditedQuestion] = useState({
    ...question,
    answers: [...question.answers],
  })
  const [errors, setErrors] = useState<{ text?: string; answers?: string }>({})
  const [isSaving, setIsSaving] = useState(false)
  const previousQuestionType = useRef(question.questionType)

  // Update editedQuestion when question prop changes
  useEffect(() => {
    if (question) {
      setEditedQuestion({
        ...question,
        answers: [...question.answers],
      })
      previousQuestionType.current = question.questionType
      setErrors({}) // Reset errors when opening a new question
    }
  }, [question])

  // Handle question type changes
  useEffect(() => {
    if (previousQuestionType.current !== editedQuestion.questionType) {
      const newType = editedQuestion.questionType

      // TRUE_FALSE: Always use exactly 2 answers (Pravda/Nepravda)
      if (newType === 'TRUE_FALSE') {
        setEditedQuestion(prev => ({
          ...prev,
          questionType: newType, // Keep the questionType
          answers: [
            { letter: 'A', text: 'Pravda', isCorrect: prev.answers[0]?.isCorrect || true },
            { letter: 'B', text: 'Nepravda', isCorrect: prev.answers[1]?.isCorrect || false },
          ],
        }))
      }
      // SINGLE_CHOICE or MULTIPLE_CHOICE: Keep existing answers if they're valid
      // Just ensure at least 2 answers
      else if (newType === 'SINGLE_CHOICE' || newType === 'MULTIPLE_CHOICE') {
        const currentAnswers = [...editedQuestion.answers]
        if (currentAnswers.length < 2) {
          const letters = ['A', 'B', 'C', 'D', 'E', 'F']
          while (currentAnswers.length < 2) {
            currentAnswers.push({
              letter: letters[currentAnswers.length],
              text: '',
              isCorrect: currentAnswers.length === 0,
            })
          }
          setEditedQuestion(prev => ({ ...prev, questionType: newType, answers: currentAnswers }))
        }
      }
      // OPEN_ENDED: Keep answers but user can remove them
      // No automatic changes needed

      previousQuestionType.current = newType
    }
  }, [editedQuestion.questionType])

  const handleAnswerChange = (index: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    const updatedAnswers = editedQuestion.answers.map((answer: any, i: number) => {
      if (i === index) {
        if (field === 'isCorrect' && value === true) {
          // If marking this answer as correct, unmark all others
          return { ...answer, isCorrect: true }
        }
        return { ...answer, [field]: value }
      } else if (field === 'isCorrect' && value === true) {
        // Unmark all other answers
        return { ...answer, isCorrect: false }
      }
      return answer
    })
    setEditedQuestion({ ...editedQuestion, answers: updatedAnswers })
    if (errors.answers) {
      setErrors({ ...errors, answers: undefined })
    }
  }

  const addAnswer = () => {
    if (editedQuestion.answers.length >= 6) return

    const letters = ['A', 'B', 'C', 'D', 'E', 'F']
    const newLetter = letters[editedQuestion.answers.length]

    setEditedQuestion({
      ...editedQuestion,
      answers: [
        ...editedQuestion.answers,
        { letter: newLetter, text: '', isCorrect: false },
      ],
    })
  }

  const removeAnswer = (index: number) => {
    if (editedQuestion.answers.length <= 2) return

    const updatedAnswers = editedQuestion.answers.filter((_: any, i: number) => i !== index)
    // Re-assign letters
    const letters = ['A', 'B', 'C', 'D', 'E', 'F']
    const reLettered = updatedAnswers.map((answer: any, i: number) => ({
      ...answer,
      letter: letters[i],
    }))

    setEditedQuestion({ ...editedQuestion, answers: reLettered })
  }

  const validate = () => {
    const newErrors: { text?: string; answers?: string } = {}

    if (!editedQuestion.text.trim()) {
      newErrors.text = 'Text otázky je povinný'
    }

    if (editedQuestion.answers.length < 2) {
      newErrors.answers = 'Otázka musí mať aspoň 2 odpovede'
    } else if (editedQuestion.answers.length > 6) {
      newErrors.answers = 'Otázka môže mať maximálne 6 odpovedí'
    }

    const correctAnswers = editedQuestion.answers.filter((a: any) => a.isCorrect)
    if (correctAnswers.length !== 1) {
      newErrors.answers = 'Otázka musí mať práve 1 správnu odpoveď'
    }

    const emptyAnswers = editedQuestion.answers.filter((a: any) => !a.text.trim())
    if (emptyAnswers.length > 0) {
      newErrors.answers = 'Všetky odpovede musia mať vyplnený text'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return

    setIsSaving(true)
    try {
      await onSave(editedQuestion)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-testid="edit-question-modal">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4" data-testid="modal-title">
          Upraviť otázku
        </h2>

        <div className="space-y-4">
          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Text otázky *
            </label>
            <textarea
              data-testid="edit-question-text"
              value={editedQuestion.text}
              onChange={(e) => {
                setEditedQuestion({ ...editedQuestion, text: e.target.value })
                if (errors.text) {
                  setErrors({ ...errors, text: undefined })
                }
              }}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.text ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.text && (
              <p className="mt-1 text-sm text-red-600" data-testid="question-text-error">
                {errors.text}
              </p>
            )}
          </div>

          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Typ otázky *
            </label>
            {allowedQuestionTypes.length > 1 ? (
              <select
                data-testid="edit-question-type"
                value={editedQuestion.questionType}
                onChange={(e) => setEditedQuestion({ ...editedQuestion, questionType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {allowedQuestionTypes.includes('SINGLE_CHOICE') && (
                  <option value="SINGLE_CHOICE">Jednovýberová</option>
                )}
                {allowedQuestionTypes.includes('MULTIPLE_CHOICE') && (
                  <option value="MULTIPLE_CHOICE">Viacvýberová</option>
                )}
                {allowedQuestionTypes.includes('TRUE_FALSE') && (
                  <option value="TRUE_FALSE">Pravda/Nepravda</option>
                )}
                {allowedQuestionTypes.includes('OPEN_ENDED') && (
                  <option value="OPEN_ENDED">Otvorená</option>
                )}
              </select>
            ) : (
              <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700" data-testid="edit-question-type-readonly">
                {QUESTION_TYPE_OPTIONS.find(opt => opt.value === editedQuestion.questionType)?.label || editedQuestion.questionType}
              </div>
            )}
          </div>

          {/* Points */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Body *
            </label>
            <input
              data-testid="edit-question-points"
              type="number"
              min="0.1"
              step="0.1"
              value={editedQuestion.points}
              onChange={(e) => setEditedQuestion({ ...editedQuestion, points: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Answers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Odpovede (2-6) *
            </label>
            <div className="space-y-2" data-testid="answers-list">
              {editedQuestion.answers.map((answer: any, index: number) => (
                <div key={index} className="flex items-center gap-2" data-testid={`answer-row-${index}`}>
                  <input
                    data-testid={`answer-correct-${index}`}
                    type="checkbox"
                    checked={answer.isCorrect}
                    onChange={(e) => handleAnswerChange(index, 'isCorrect', e.target.checked)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm font-medium w-8">{answer.letter})</span>
                  <input
                    data-testid={`answer-text-${index}`}
                    type="text"
                    value={answer.text}
                    onChange={(e) => handleAnswerChange(index, 'text', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Text odpovede"
                  />
                  {editedQuestion.answers.length > 2 && (
                    <button
                      data-testid={`remove-answer-${index}`}
                      onClick={() => removeAnswer(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      type="button"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {editedQuestion.answers.length < 6 && (
              <button
                data-testid="add-answer-button"
                onClick={addAnswer}
                className="mt-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-300"
                type="button"
              >
                + Pridať odpoveď
              </button>
            )}
            {errors.answers && (
              <p className="mt-1 text-sm text-red-600" data-testid="answers-error">
                {errors.answers}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            data-testid="cancel-edit-button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
            type="button"
          >
            Zrušiť
          </button>
          <button
            data-testid="save-edit-button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            type="button"
          >
            {isSaving ? 'Ukladám...' : 'Uložiť'}
          </button>
        </div>
      </div>
    </div>
  )
}
