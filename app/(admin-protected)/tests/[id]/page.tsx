'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTest, useUpdateTest, useCloneTest, useDeleteTest } from '@/hooks/useTests'
import { useTestTypes, useTestType } from '@/hooks/useTestTypes'
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
  const { data: testTypesData } = useTestTypes({ limit: 100 })
  const updateMutation = useUpdateTest()
  const cloneMutation = useCloneTest()
  const deleteMutation = useDeleteTest()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [recommendedDuration, setRecommendedDuration] = useState(45)
  const [approved, setApproved] = useState(false)
  const [practiceEnabled, setPracticeEnabled] = useState(false)
  const [selectedTestTypeId, setSelectedTestTypeId] = useState('')
  const [selectedConditionId, setSelectedConditionId] = useState('')
  const [errors, setErrors] = useState<{ name?: string; testType?: string }>({})
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [editingQuestion, setEditingQuestion] = useState<any>(null)
  const [addingQuestion, setAddingQuestion] = useState(false)
  const [deletingQuestion, setDeletingQuestion] = useState<{ question: any; index: number } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const test = data?.test
  const testTypes = testTypesData?.testTypes || []
  const { data: selectedTypeDetail } = useTestType(selectedTestTypeId, Boolean(selectedTestTypeId))
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
      setRecommendedDuration(test.recommendedDuration || 45)
      setApproved(test.approved)
      setPracticeEnabled(test.practiceEnabled || false)
    }
  }, [test])

  useEffect(() => {
    if (!test) return

    setSelectedTestTypeId(test.testTypeId)
    setSelectedConditionId(test.testTypeConditionId || '')
  }, [test])

  useEffect(() => {
    const conditions = selectedTypeDetail?.conditions ?? []

    if (conditions.length === 0) {
      if (selectedConditionId) {
        setSelectedConditionId('')
      }
      return
    }

    const existing = conditions.some((condition) => condition.id === selectedConditionId)
    if (!existing) {
      setSelectedConditionId(conditions[0].id)
    }
  }, [selectedTypeDetail, selectedConditionId])

  function changeTab(tab: TabType) {
    setActiveTab(tab)
    router.push(`/tests/${testId}?tab=${tab}`, { scroll: false })
  }

  const handleTestTypeSelectChange = (typeId: string) => {
    if (!typeId) {
      setSelectedTestTypeId('')
      setSelectedConditionId('')
      return
    }

    setSelectedTestTypeId(typeId)
    setSelectedConditionId('')
  }

  const handleConditionSelectChange = (conditionId: string) => {
    setSelectedConditionId(conditionId)
  }

  const validate = () => {
    const newErrors: { name?: string; testType?: string } = {}

    if (!name.trim()) {
      newErrors.name = 'Názov je povinný'
    }

    if (!selectedTestTypeId) {
      newErrors.testType = 'Typ testu je povinný'
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
        recommendedDuration,
        approved,
        practiceEnabled,
        testTypeId: selectedTestTypeId,
        testTypeConditionId: selectedConditionId ? selectedConditionId : null,
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
  const canEdit = hasPermission // Removed !isUsedInVK restriction - tests can now be edited even if used in VK
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

  const handleAddQuestion = () => {
    // Create new empty question with default values
    const newQuestion = {
      id: `new-${Date.now()}`,
      text: '',
      questionType: 'SINGLE_CHOICE',
      points: 1,
      order: (test.questions || []).length + 1,
      answers: [
        { letter: 'A', text: '', isCorrect: false },
        { letter: 'B', text: '', isCorrect: false },
        { letter: 'C', text: '', isCorrect: false },
      ],
    }
    setEditingQuestion(newQuestion)
    setAddingQuestion(true)
  }

  const handleDeleteQuestionClick = (question: any, index: number) => {
    setDeletingQuestion({ question, index })
  }

  const handleConfirmDeleteQuestion = async () => {
    if (!deletingQuestion) return

    const toastId = toast.loading('Mažem otázku...')
    try {
      // Remove the question from the questions array
      const updatedQuestions = (test.questions || []).filter(
        (_: any, idx: number) => idx !== deletingQuestion.index
      )

      // Update test with new questions array
      await updateMutation.mutateAsync({
        id: testId,
        questions: updatedQuestions,
      })

      toast.dismiss(toastId)
      toast.success('Otázka bola úspešne vymazaná')
      setDeletingQuestion(null)
    } catch (error: any) {
      toast.dismiss(toastId)
      toast.error(error.message || 'Nepodarilo sa vymazať otázku')
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
            canEdit={canEdit}
            canApprove={canApprove}
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            recommendedDuration={recommendedDuration}
            setRecommendedDuration={setRecommendedDuration}
            approved={approved}
            setApproved={setApproved}
            practiceEnabled={practiceEnabled}
            setPracticeEnabled={setPracticeEnabled}
            testTypes={testTypes}
            selectedTestTypeId={selectedTestTypeId}
            onTestTypeChange={handleTestTypeSelectChange}
            selectedTypeDetail={selectedTypeDetail}
            selectedConditionId={selectedConditionId}
            onConditionChange={handleConditionSelectChange}
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
              onAddQuestion={handleAddQuestion}
              onDeleteQuestion={handleDeleteQuestionClick}
            />
          )}
          {activeTab === 'vks' && <VKsTab test={test} />}
        </div>
      </div>

      {/* Edit/Add Question Modal */}
      {editingQuestion && (
        <EditQuestionModal
          question={editingQuestion}
          allowedQuestionTypes={addingQuestion ? ['SINGLE_CHOICE'] : (test.allowedQuestionTypes || [])}
          isNew={addingQuestion}
          onClose={() => {
            setEditingQuestion(null)
            setAddingQuestion(false)
          }}
          onSave={async (updatedQuestion) => {
            const toastId = toast.loading(addingQuestion ? 'Pridávam otázku...' : 'Ukladám zmeny otázky...')
            try {
              let updatedQuestions
              if (addingQuestion) {
                // Add new question to the array
                updatedQuestions = [...(test.questions || []), updatedQuestion]
              } else {
                // Update existing question in the array
                updatedQuestions = (test.questions || []).map((q: any) =>
                  q.id === updatedQuestion.id ? updatedQuestion : q
                )
              }

              await updateMutation.mutateAsync({
                id: testId,
                questions: updatedQuestions,
              })

              toast.dismiss(toastId)
              toast.success(addingQuestion ? 'Otázka bola úspešne pridaná' : 'Otázka bola úspešne aktualizovaná')
              setEditingQuestion(null)
              setAddingQuestion(false)
            } catch (error: any) {
              toast.dismiss(toastId)
              toast.error(error.message || (addingQuestion ? 'Nepodarilo sa pridať otázku' : 'Nepodarilo sa aktualizovať otázku'))
            }
          }}
        />
      )}

      {/* Delete Test Confirmation Modal */}
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

      {/* Delete Question Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingQuestion}
        title="Vymazať otázku"
        message={`Naozaj chcete vymazať otázku "${deletingQuestion?.question?.text || 'túto otázku'}"? Táto akcia je nevratná.`}
        confirmLabel="Vymazať"
        cancelLabel="Zrušiť"
        variant="danger"
        onConfirm={handleConfirmDeleteQuestion}
        onCancel={() => setDeletingQuestion(null)}
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
  canEdit,
  canApprove,
  name,
  setName,
  description,
  setDescription,
  recommendedDuration,
  setRecommendedDuration,
  approved,
  setApproved,
  practiceEnabled,
  setPracticeEnabled,
  testTypes,
  selectedTestTypeId,
  onTestTypeChange,
  selectedTypeDetail,
  selectedConditionId,
  onConditionChange,
  errors,
  setErrors,
  handleSubmit,
  updateMutation,
}: any) {
  const typeConditions = selectedTypeDetail?.conditions ?? []
  const selectedCondition = typeConditions.find((condition: any) => condition.id === selectedConditionId)

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

      {/* Settings */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <CogIcon className="h-5 w-5 text-gray-600" />
          Nastavenie
        </h3>

        {/* Test Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700" htmlFor="test-type-select">
            Typ testu *
          </label>
          <select
            id="test-type-select"
            data-testid="test-type-select"
            value={selectedTestTypeId}
            onChange={(e) => {
              onTestTypeChange(e.target.value)
              if (errors.testType) {
                setErrors({ ...errors, testType: undefined })
              }
            }}
            disabled={!canEdit || testTypes.length === 0}
            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 sm:text-sm ${
              !canEdit || testTypes.length === 0
                ? 'bg-gray-100 cursor-not-allowed border-gray-300'
                : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
            }`}
          >
            <option value="">Vyberte typ testu</option>
            {testTypes.map((type: any) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          {errors.testType && (
            <p className="mt-2 text-sm text-red-600">{errors.testType}</p>
          )}
        </div>

        {/* Test Type Condition */}
        {typeConditions.length ? (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700" htmlFor="test-type-condition-select">
              Podmienka
            </label>
            <select
              id="test-type-condition-select"
              data-testid="test-type-condition-select"
              value={selectedConditionId || (typeConditions[0]?.id ?? '')}
              onChange={(e) => onConditionChange(e.target.value)}
              disabled={!canEdit}
              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 sm:text-sm ${
                !canEdit ? 'bg-gray-100 cursor-not-allowed border-gray-300' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
              }`}
            >
              {typeConditions.map((condition: any) => (
                <option key={condition.id} value={condition.id}>
                  {condition.name}
                </option>
              ))}
            </select>
            {selectedCondition?.description && (
              <p className="mt-2 text-xs text-gray-500">{selectedCondition.description}</p>
            )}
          </div>
        ) : null}

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

        {/* Allowed Question Types removed as requested */}
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
function QuestionsTab({ test, canEdit, onEditQuestion, onAddQuestion, onDeleteQuestion }: any) {
  const questions = test.questions || []

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <QuestionMarkCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Žiadne otázky</h3>
        <p className="mt-1 text-sm text-gray-500">Tento test zatiaľ neobsahuje žiadne otázky.</p>
        {canEdit && (
          <button
            onClick={onAddQuestion}
            data-testid="add-first-question-button"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <QuestionMarkCircleIcon className="h-5 w-5" />
            Pridať prvú otázku
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Otázky ({questions.length})</h3>
        {canEdit && (
          <button
            onClick={onAddQuestion}
            data-testid="add-question-button"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <QuestionMarkCircleIcon className="h-5 w-5" />
            Pridať otázku
          </button>
        )}
      </div>

      <div className="space-y-4" data-testid="questions-list">
        {questions.map((question: any, index: number) => {
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

              {/* Edit and Delete Buttons */}
              {canEdit && (
                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-200">
                  <button
                    data-testid={`delete-question-${index}-button`}
                    onClick={() => onDeleteQuestion(question, index)}
                    className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Vymazať
                  </button>
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
  isNew = false,
  onClose,
  onSave,
}: {
  question: any
  allowedQuestionTypes: string[]
  isNew?: boolean
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

    if (editedQuestion.answers.length !== 3) {
      newErrors.answers = 'Otázka musí mať presne 3 odpovede'
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
          {isNew ? 'Pridať otázku' : 'Upraviť otázku'}
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

          {/* Answers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Odpovede *
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
            disabled={
              isSaving ||
              editedQuestion.answers.length !== 3 ||
              editedQuestion.answers.some((a: any) => !a.text.trim())
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            {isSaving ? (isNew ? 'Pridávam...' : 'Ukladám...') : (isNew ? 'Pridať' : 'Uložiť')}
          </button>
        </div>
      </div>
    </div>
  )
}
