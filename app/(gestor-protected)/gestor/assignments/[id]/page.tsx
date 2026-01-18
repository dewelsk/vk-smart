'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { ConfirmModal } from '@/components/ConfirmModal'

type Question = {
  question: string
  options: string[]
  correctAnswer: number
}

type Assignment = {
  id: string
  name: string
  description: string | null
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED'
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
  test: {
    id: string
    name: string
    questions: Question[]
  } | null
  availableTests: Array<{
    id: string
    name: string
    questionCount: number
  }>
}

function getQuestionWord(count: number) {
  if (count === 1) return 'otázka'
  if (count >= 2 && count <= 4) return 'otázky'
  return 'otázok'
}

export default function GestorAssignmentDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    fetchAssignment()
  }, [params.id])

  async function fetchAssignment() {
    try {
      const response = await fetch(`/api/gestor/assignments/${params.id}`)
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Úloha nebola nájdená')
          router.push('/gestor/dashboard')
          return
        }
        throw new Error('Failed to fetch assignment')
      }
      const data = await response.json()
      // API returns test separately, merge it into assignment for component state
      setAssignment({
        ...data.assignment,
        test: data.test,
        availableTests: data.availableTests || [],
      })
      setQuestions(data.test?.questions || [])
    } catch (error) {
      console.error('Error fetching assignment:', error)
      toast.error('Chyba pri načítaní úlohy')
    } finally {
      setLoading(false)
    }
  }

  async function saveDraft() {
    if (!assignment) return

    setSaving(true)
    try {
      const response = await fetch(`/api/gestor/assignments/${params.id}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Chyba pri ukladaní')
      }

      toast.success('Koncept uložený')
      setHasUnsavedChanges(false)
      fetchAssignment() // Refresh to get updated status
    } catch (error: any) {
      console.error('Error saving draft:', error)
      toast.error(error.message || 'Chyba pri ukladaní konceptu')
    } finally {
      setSaving(false)
    }
  }

  async function submitForApproval() {
    if (!assignment) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/gestor/assignments/${params.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Chyba pri odosielaní')
      }

      toast.success('Test odoslaný na schválenie')
      router.push('/gestor/dashboard')
    } catch (error: any) {
      console.error('Error submitting:', error)
      toast.error(error.message || 'Chyba pri odosielaní testu')
    } finally {
      setSubmitting(false)
      setShowSubmitConfirm(false)
    }
  }

  function handleAddQuestion(question: Question) {
    setQuestions([...questions, question])
    setShowAddModal(false)
    setHasUnsavedChanges(true)
  }

  function handleEditQuestion(index: number, question: Question) {
    const updated = [...questions]
    updated[index] = question
    setQuestions(updated)
    setEditingIndex(null)
    setHasUnsavedChanges(true)
  }

  function handleDeleteQuestion(index: number) {
    const updated = questions.filter((_, i) => i !== index)
    setQuestions(updated)
    setShowDeleteConfirm(null)
    setHasUnsavedChanges(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Úloha nebola nájdená</p>
        <Link href="/gestor/dashboard" className="text-blue-600 hover:underline mt-2 inline-block">
          Späť na dashboard
        </Link>
      </div>
    )
  }

  const minQuestions = assignment.testTypeCondition.minQuestions || 1
  const maxQuestions = assignment.testTypeCondition.maxQuestions || 100
  const currentCount = questions.length
  const canSubmit = currentCount >= minQuestions && currentCount <= maxQuestions
  const isReadOnly = assignment.status === 'COMPLETED' || assignment.status === 'APPROVED'

  return (
    <div className="max-w-5xl mx-auto" data-testid="assignment-detail-page">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/gestor/dashboard"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          data-testid="back-link"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Späť na dashboard
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">
              {assignment.name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {assignment.testType.name} | {assignment.testTypeCondition.name}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!isReadOnly && (
              <>
                <button
                  onClick={saveDraft}
                  disabled={saving || questions.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="save-draft-button"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  {saving ? 'Ukladám...' : 'Uložiť koncept'}
                </button>

                <button
                  onClick={() => setShowSubmitConfirm(true)}
                  disabled={!canSubmit || submitting}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="submit-button"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Odoslať na schválenie
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Requirements Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6" data-testid="requirements-card">
        <h3 className="font-medium text-blue-900 mb-2">Požiadavky na test</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>
            Počet otázok: <strong>{minQuestions} - {maxQuestions}</strong>
          </p>
          <p>
            Aktuálny počet: <strong className={currentCount < minQuestions ? 'text-red-600' : 'text-green-600'}>
              {currentCount} {getQuestionWord(currentCount)}
            </strong>
            {currentCount < minQuestions && (
              <span className="text-red-600 ml-2">
                (chýba {minQuestions - currentCount} {getQuestionWord(minQuestions - currentCount)})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Warning for unsaved changes */}
      {hasUnsavedChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center gap-3" data-testid="unsaved-warning">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-800">
            Máte neuložené zmeny. Nezabudnite uložiť koncept.
          </p>
        </div>
      )}

      {/* Questions List */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Otázky ({currentCount})
          </h2>
          {!isReadOnly && (
            <button
              onClick={() => setShowAddModal(true)}
              disabled={currentCount >= maxQuestions}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="add-question-button"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Pridať otázku
            </button>
          )}
        </div>

        {questions.length === 0 ? (
          <div className="p-12 text-center text-gray-500" data-testid="empty-state">
            <p className="mb-4">Zatiaľ nemáte žiadne otázky.</p>
            {!isReadOnly && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Pridať prvú otázku
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200" data-testid="questions-list">
            {questions.map((question, index) => (
              <QuestionCard
                key={index}
                index={index}
                question={question}
                isReadOnly={isReadOnly}
                onEdit={() => setEditingIndex(index)}
                onDelete={() => setShowDeleteConfirm(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Question Modal */}
      {showAddModal && (
        <QuestionModal
          onSave={handleAddQuestion}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit Question Modal */}
      {editingIndex !== null && (
        <QuestionModal
          question={questions[editingIndex]}
          onSave={(q) => handleEditQuestion(editingIndex, q)}
          onClose={() => setEditingIndex(null)}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm !== null}
        title="Vymazať otázku"
        message="Naozaj chcete vymazať túto otázku? Táto akcia sa nedá vrátiť späť."
        variant="danger"
        confirmLabel="Vymazať"
        onConfirm={() => showDeleteConfirm !== null && handleDeleteQuestion(showDeleteConfirm)}
        onCancel={() => setShowDeleteConfirm(null)}
      />

      {/* Submit Confirmation */}
      <ConfirmModal
        isOpen={showSubmitConfirm}
        title="Odoslať test na schválenie"
        message={`Test obsahuje ${currentCount} ${getQuestionWord(currentCount)}. Po odoslaní už nebude možné test upravovať. Chcete pokračovať?`}
        variant="primary"
        confirmLabel="Odoslať"
        onConfirm={submitForApproval}
        onCancel={() => setShowSubmitConfirm(false)}
      />
    </div>
  )
}

// Question Card Component
function QuestionCard({
  index,
  question,
  isReadOnly,
  onEdit,
  onDelete,
}: {
  index: number
  question: Question
  isReadOnly: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const letters = ['A', 'B', 'C']

  return (
    <div className="p-6" data-testid={`question-card-${index}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <span className="text-sm font-medium text-gray-500 mr-2">
            Otázka {index + 1}
          </span>
          <p className="text-gray-900 mt-1" data-testid={`question-text-${index}`}>
            {question.question}
          </p>
        </div>
        {!isReadOnly && (
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={onEdit}
              className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
              data-testid={`edit-question-${index}`}
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-gray-400 hover:text-red-600 rounded"
              data-testid={`delete-question-${index}`}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2 ml-4">
        {question.options.map((option, optIndex) => (
          <div
            key={optIndex}
            className={`flex items-center gap-2 text-sm ${
              optIndex === question.correctAnswer
                ? 'text-green-700 font-medium'
                : 'text-gray-600'
            }`}
            data-testid={`option-${index}-${optIndex}`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              optIndex === question.correctAnswer
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {letters[optIndex]}
            </span>
            <span>{option}</span>
            {optIndex === question.correctAnswer && (
              <CheckCircleIcon className="h-4 w-4 text-green-600" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Question Modal Component
function QuestionModal({
  question,
  onSave,
  onClose,
}: {
  question?: Question
  onSave: (question: Question) => void
  onClose: () => void
}) {
  const isNew = !question
  const [text, setText] = useState(question?.question || '')
  const [options, setOptions] = useState<string[]>(
    question?.options || ['', '', '']
  )
  const [correctAnswer, setCorrectAnswer] = useState<number>(
    question?.correctAnswer ?? 0
  )
  const [errors, setErrors] = useState<{ text?: string; options?: string }>({})

  const letters = ['A', 'B', 'C']

  function validate(): boolean {
    const newErrors: { text?: string; options?: string } = {}

    if (!text.trim()) {
      newErrors.text = 'Text otázky je povinný'
    }

    const emptyOptions = options.filter((o) => !o.trim())
    if (emptyOptions.length > 0) {
      newErrors.options = 'Všetky odpovede musia byť vyplnené'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSave() {
    if (!validate()) return

    onSave({
      question: text.trim(),
      options: options.map((o) => o.trim()),
      correctAnswer,
    })
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      data-testid="question-modal"
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
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
                value={text}
                onChange={(e) => {
                  setText(e.target.value)
                  if (errors.text) setErrors({ ...errors, text: undefined })
                }}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.text ? 'border-red-500' : 'border-gray-300'
                }`}
                data-testid="question-text-input"
                placeholder="Zadajte text otázky..."
              />
              {errors.text && (
                <p className="mt-1 text-sm text-red-600" data-testid="question-text-error">
                  {errors.text}
                </p>
              )}
            </div>

            {/* Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Odpovede * (označte správnu odpoveď)
              </label>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCorrectAnswer(index)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        correctAnswer === index
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                      data-testid={`correct-answer-${index}`}
                    >
                      {letters[index]}
                    </button>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const updated = [...options]
                        updated[index] = e.target.value
                        setOptions(updated)
                        if (errors.options) setErrors({ ...errors, options: undefined })
                      }}
                      className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.options && !option.trim() ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={`Odpoveď ${letters[index]}`}
                      data-testid={`option-input-${index}`}
                    />
                  </div>
                ))}
              </div>
              {errors.options && (
                <p className="mt-2 text-sm text-red-600" data-testid="options-error">
                  {errors.options}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Kliknite na písmeno pre označenie správnej odpovede
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            data-testid="cancel-button"
          >
            Zrušiť
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            data-testid="save-question-button"
          >
            {isNew ? 'Pridať' : 'Uložiť'}
          </button>
        </div>
      </div>
    </div>
  )
}
