'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/PageHeader'
import { ConfirmModal } from '@/components/ConfirmModal'
import {
  DocumentArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
  StarIcon,
  PencilIcon,
  TrashIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import { useDropzone } from 'react-dropzone'
import { toast } from 'react-hot-toast'

type ParsedAnswer = {
  id: string
  letter: string
  text: string
  isCorrect: boolean
}

type ParsedQuestion = {
  id: string
  order: number
  text: string
  points: number
  status: 'confirmed' | 'needs_review' | 'unconfirmed'
  warning?: string
  answers: ParsedAnswer[]
}

type ParsedTest = {
  filename: string
  totalQuestions: number
  confirmedQuestions: number
  needsReview: number
  questions: ParsedQuestion[]
}

export default function ImportTestsPage() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [parsedTest, setParsedTest] = useState<ParsedTest | null>(null)
  const [testName, setTestName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [duration, setDuration] = useState(45)
  const [difficulty, setDifficulty] = useState(5)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [editingQuestion, setEditingQuestion] = useState<ParsedQuestion | null>(null)
  const [pointsPerQuestion, setPointsPerQuestion] = useState(1)
  const [questionToDelete, setQuestionToDelete] = useState<ParsedQuestion | null>(null)
  const [allowedQuestionTypes, setAllowedQuestionTypes] = useState<string[]>(['SINGLE_CHOICE'])
  const [errors, setErrors] = useState<{ testName?: string; categoryId?: string; allowedQuestionTypes?: string }>({})
  const [saving, setSaving] = useState(false)

  // Refs pre auto-scroll
  const testNameRef = useRef<HTMLInputElement>(null)
  const categoryRef = useRef<HTMLSelectElement>(null)

  const refs = {
    testName: testNameRef,
    categoryId: categoryRef,
  }

  // Load categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/admin/test-categories?limit=100')
        const data = await res.json()
        if (res.ok) {
          setCategories(data.categories || [])
        }
      } catch (error) {
        console.error('Error loading categories:', error)
      }
    }
    loadCategories()
  }, [])

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]

    // Validate file type
    if (!file.name.endsWith('.docx') && !file.name.endsWith('.pdf')) {
      toast.error('Neplatný formát súboru. Podporované: PDF, DOCX')
      return
    }

    // Validate file size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Súbor je príliš veľký (max 10 MB)')
      return
    }

    setUploading(true)
    toast.loading('Spracovávam súbor...')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/tests/import', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      toast.dismiss()

      if (!res.ok) {
        const errorMsg = data.error || 'Chyba pri spracovaní súboru'
        toast.error(errorMsg)
        return
      }

      toast.success(`Rozpoznaných ${data.parsed.totalQuestions} otázok`)

      if (data.parsed.needsReview > 0) {
        toast.warning(`${data.parsed.needsReview} otázok vyžaduje kontrolu`)
      }

      setParsedTest(data.parsed)
    } catch (error) {
      toast.dismiss()
      toast.error('Chyba pri nahrávaní súboru')
    } finally {
      setUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    disabled: uploading,
  })

  const confirmQuestion = (questionId: string) => {
    if (!parsedTest) return

    setParsedTest({
      ...parsedTest,
      questions: parsedTest.questions.map(q =>
        q.id === questionId ? { ...q, status: 'confirmed' as const } : q
      ),
      confirmedQuestions: parsedTest.questions.filter(
        q => q.id === questionId || q.status === 'confirmed'
      ).length,
      needsReview: parsedTest.questions.filter(
        q => q.id !== questionId && q.status === 'needs_review'
      ).length,
    })

    toast.success('Otázka potvrdená')
  }

  const deleteQuestion = (questionId: string) => {
    if (!parsedTest) return

    const updatedQuestions = parsedTest.questions.filter(q => q.id !== questionId)
    const confirmedCount = updatedQuestions.filter(q => q.status === 'confirmed').length
    const needsReviewCount = updatedQuestions.filter(q => q.status === 'needs_review').length

    setParsedTest({
      ...parsedTest,
      questions: updatedQuestions,
      totalQuestions: updatedQuestions.length,
      confirmedQuestions: confirmedCount,
      needsReview: needsReviewCount,
    })

    toast.success('Otázka vymazaná')
  }

  const saveEditedQuestion = (editedQuestion: ParsedQuestion) => {
    if (!parsedTest) return

    setParsedTest({
      ...parsedTest,
      questions: parsedTest.questions.map(q =>
        q.id === editedQuestion.id ? editedQuestion : q
      ),
    })

    setEditingQuestion(null)
    toast.success('Otázka upravená')
  }

  const validate = () => {
    const newErrors: { testName?: string; categoryId?: string } = {}

    // Validate all questions confirmed
    const unconfirmed = parsedTest?.questions.filter(q => q.status !== 'confirmed') || []
    if (unconfirmed.length > 0) {
      toast.error('Všetky otázky musia byť potvrdené')
      return false
    }

    // Validate basic info
    if (!testName.trim()) {
      newErrors.testName = 'Názov testu je povinný'
    }

    if (!categoryId) {
      newErrors.categoryId = 'Kategória je povinná'
    }

    if (allowedQuestionTypes.length === 0) {
      newErrors.allowedQuestionTypes = 'Aspoň jeden typ otázky musí byť vybraný'
    }

    setErrors(newErrors)

    // Scroll na prvý error
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0] as keyof typeof refs
      refs[firstErrorField]?.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
      refs[firstErrorField]?.current?.focus()
      return false
    }

    return true
  }

  const handleSave = async () => {
    if (!parsedTest) return

    // Validácia
    if (!validate()) {
      return
    }

    setSaving(true)
    toast.loading('Ukladám test...')

    try {
      const payload = {
        name: testName,
        categoryId,
        duration,
        difficulty,
        totalPoints: parsedTest.totalQuestions * pointsPerQuestion,
        allowedQuestionTypes,
        questions: parsedTest.questions.map(q => ({
          ...q,
          points: pointsPerQuestion,
        })),
      }

      const res = await fetch('/api/admin/tests/import/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      toast.dismiss()

      if (!res.ok) {
        toast.error(data.error || 'Chyba pri ukladaní testu')
        return
      }

      toast.success(`Test "${data.test.name}" úspešne vytvorený`)
      router.push('/tests')
    } catch (error) {
      toast.dismiss()
      toast.error('Chyba pri ukladaní testu')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import testov z PDF/DOCX"
        description="Nahrajte súbor s testom pre automatické rozpoznanie otázok"
      />

      {!parsedTest ? (
        /* Upload Section */
        <div className="bg-white p-8 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-6">
            <DocumentArrowUpIcon className="h-6 w-6 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">
              Nahrať súbor s testom
            </h2>
          </div>

          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
              transition-colors
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
              ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            <DocumentArrowUpIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-700 mb-2">
              {isDragActive
                ? 'Pustite súbor sem...'
                : 'Presuňte súbor sem alebo kliknite pre výber'}
            </p>
            <p className="text-sm text-gray-500 mb-1">
              Podporované formáty: PDF, DOCX
            </p>
            <p className="text-sm text-gray-500">
              Maximálna veľkosť: 10 MB
            </p>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2 mb-2">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-blue-900">
                Tipy pre lepšie rozpoznanie:
              </p>
            </div>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Každá otázka by mala byť číslovaná (1., 2., 3., ...)</li>
              <li>Odpovede označené písmenami (a), b), c), d))</li>
              <li>Správna odpoveď označená tučným písmom</li>
              <li>Jasná štruktúra bez veľa formátovania</li>
            </ul>
          </div>
        </div>
      ) : (
        /* Parsed Questions Section */
        <div className="space-y-6">
          {/* Status Bar */}
          <div data-testid="import-stats" className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-900">
                    Import dokončený
                  </h3>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Skontrolujte rozpoznané otázky a označte správne odpovede
                </p>
              </div>
              <div className="text-right">
                <p data-testid="total-questions-count" className="text-2xl font-bold text-green-900">
                  {parsedTest.totalQuestions}
                </p>
                <p className="text-sm text-green-700">otázok</p>
              </div>
            </div>
            <div className="mt-4 flex gap-6 text-sm">
              <div className="flex items-center gap-1">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-900">
                  Potvrdených:
                </span>{' '}
                <span className="text-green-700">{parsedTest.confirmedQuestions}</span>
              </div>
              <div className="flex items-center gap-1">
                <ExclamationTriangleIcon className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-orange-900">
                  Na kontrolu:
                </span>{' '}
                <span className="text-orange-700">{parsedTest.needsReview}</span>
              </div>
            </div>
          </div>

          {/* Basic Info Form */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Základné informácie
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Názov testu *
                </label>
                <input
                  ref={testNameRef}
                  data-testid="test-name-input"
                  type="text"
                  value={testName}
                  onChange={(e) => {
                    setTestName(e.target.value)
                    if (errors.testName) {
                      setErrors({ ...errors, testName: undefined })
                    }
                  }}
                  className={`
                    w-full px-3 py-2 border rounded-md
                    focus:outline-none focus:ring-1
                    ${errors.testName
                      ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                    }
                  `}
                  placeholder="napr. Test odborných vedomostí - Právo 2025"
                />
                {errors.testName && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.testName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategória *
                </label>
                <select
                  ref={categoryRef}
                  data-testid="category-select"
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value)
                    if (errors.categoryId) {
                      setErrors({ ...errors, categoryId: undefined })
                    }
                  }}
                  className={`
                    w-full px-3 py-2 border rounded-md
                    focus:outline-none focus:ring-1
                    ${errors.categoryId
                      ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                    }
                  `}
                >
                  <option value="">Vyberte kategóriu</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.categoryId}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Časový limit (minúty) *
                </label>
                <input
                  data-testid="duration-input"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Náročnosť testu *
                </label>
                <div className="flex items-center gap-4">
                  <input
                    data-testid="difficulty-slider"
                    type="range"
                    min="1"
                    max="10"
                    value={difficulty}
                    onChange={(e) => setDifficulty(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="text-lg font-semibold text-gray-900 w-8 text-center" data-testid="difficulty-value">
                    {difficulty}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Najľahší</span>
                  <span>Najnáročnejší</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Počet bodov za otázku *
                </label>
                <input
                  data-testid="points-per-question-input"
                  type="number"
                  value={pointsPerQuestion}
                  onChange={(e) => setPointsPerQuestion(parseFloat(e.target.value))}
                  min="0.1"
                  step="0.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Body za test (počet otázok × body za otázku)
                </label>
                <input
                  data-testid="total-points-display"
                  type="text"
                  value={parsedTest.totalQuestions * pointsPerQuestion}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                />
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
                  {[
                    { value: 'SINGLE_CHOICE', label: 'Jednovýberová' },
                    { value: 'MULTIPLE_CHOICE', label: 'Viacvýberová' },
                    { value: 'TRUE_FALSE', label: 'Pravda/Nepravda' },
                    { value: 'OPEN_ENDED', label: 'Otvorená' },
                  ].map((option) => (
                    <div key={option.value} className="flex items-center">
                      <input
                        id={`type-${option.value}`}
                        data-testid={`question-type-${option.value.toLowerCase()}`}
                        type="checkbox"
                        checked={allowedQuestionTypes.includes(option.value)}
                        onChange={() => {
                          if (allowedQuestionTypes.includes(option.value)) {
                            // Don't allow unchecking if it's the last one
                            if (allowedQuestionTypes.length === 1) {
                              return
                            }
                            setAllowedQuestionTypes(allowedQuestionTypes.filter(t => t !== option.value))
                          } else {
                            setAllowedQuestionTypes([...allowedQuestionTypes, option.value])
                          }
                          if (errors.allowedQuestionTypes) {
                            setErrors({ ...errors, allowedQuestionTypes: undefined })
                          }
                        }}
                        disabled={allowedQuestionTypes.includes(option.value) && allowedQuestionTypes.length === 1}
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

            {/* Actions - Top */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                data-testid="cancel-button-top"
                onClick={() => {
                  setParsedTest(null)
                  setTestName('')
                  setCategoryId('')
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Zrušiť
              </button>
              <button
                data-testid="save-test-button-top"
                onClick={handleSave}
                disabled={saving || parsedTest.confirmedQuestions !== parsedTest.totalQuestions}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Ukladám...' : 'Uložiť test'}
              </button>
            </div>
          </div>

          {/* Questions List */}
          <div data-testid="questions-section" className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Otázky ({parsedTest.totalQuestions})
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {parsedTest.questions.map((question, index) => (
                <div
                  key={question.id}
                  data-testid={`question-card-${index}`}
                  className={`
                    border rounded-lg p-4
                    ${question.status === 'confirmed' ? 'border-green-200 bg-green-50' : ''}
                    ${question.status === 'needs_review' ? 'border-orange-200 bg-orange-50' : ''}
                    ${question.status === 'unconfirmed' ? 'border-gray-200' : ''}
                  `}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {question.status === 'confirmed' && (
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      )}
                      {question.status === 'needs_review' && (
                        <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
                      )}
                      {question.status === 'unconfirmed' && (
                        <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400" />
                      )}
                      <span className="font-semibold text-gray-900">
                        Otázka {question.order}
                      </span>
                      {question.status === 'needs_review' && (
                        <span className="text-sm text-orange-700">
                          - Vyžaduje kontrolu
                        </span>
                      )}
                      {question.status === 'unconfirmed' && (
                        <span className="text-sm text-gray-600">
                          - Nepotvrdená
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        data-testid="edit-question-button"
                        onClick={() => setEditingQuestion(question)}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <PencilIcon className="h-4 w-4" />
                        Upraviť
                      </button>
                      <button
                        data-testid="delete-question-button"
                        onClick={() => setQuestionToDelete(question)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-900 mb-3">{question.text}</p>

                  <p className="text-sm text-gray-600 mb-3">
                    Body: {question.points}
                  </p>

                  <div className="space-y-2 mb-3">
                    <p className="text-sm font-medium text-gray-700">Odpovede:</p>
                    {question.answers.map((answer, answerIndex) => (
                      <div
                        key={answer.id}
                        data-testid={`answer-${answerIndex}`}
                        className={`
                          flex items-start gap-2 text-sm
                          ${answer.isCorrect ? 'text-green-700 font-medium' : 'text-gray-700'}
                        `}
                      >
                        {answer.isCorrect ? (
                          <StarIcon className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-gray-400 flex-shrink-0 mt-0.5" />
                        )}
                        <span>{answer.letter})</span>
                        <span>{answer.text}</span>
                      </div>
                    ))}
                  </div>

                  {question.warning && (
                    <div className="flex items-start gap-2 p-3 bg-orange-100 rounded text-sm text-orange-800 mb-3">
                      <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <span>{question.warning}</span>
                    </div>
                  )}

                  {question.status !== 'confirmed' && (
                    <button
                      data-testid="confirm-question-button"
                      onClick={() => confirmQuestion(question.id)}
                      className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      Potvrdiť otázku
                    </button>
                  )}

                  {question.status === 'confirmed' && (
                    <div data-testid="question-confirmed-badge" className="flex items-center gap-1 text-sm text-green-700">
                      <CheckCircleIcon className="h-4 w-4" />
                      Potvrdené
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              data-testid="cancel-button"
              onClick={() => {
                setParsedTest(null)
                setTestName('')
                setCategoryId('')
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Zrušiť
            </button>
            <button
              data-testid="save-test-button"
              onClick={handleSave}
              disabled={saving || parsedTest.confirmedQuestions !== parsedTest.totalQuestions}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Ukladám...' : 'Uložiť test'}
            </button>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Upraviť otázku</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Text otázky *
                </label>
                <textarea
                  data-testid="edit-question-text"
                  value={editingQuestion.text}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Odpovede
                </label>
                <div className="space-y-2">
                  {editingQuestion.answers.map((answer, index) => (
                    <div key={answer.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={answer.isCorrect}
                        onChange={(e) => {
                          const updatedAnswers = editingQuestion.answers.map((a, i) =>
                            i === index ? { ...a, isCorrect: e.target.checked } : a
                          )
                          setEditingQuestion({ ...editingQuestion, answers: updatedAnswers })
                        }}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm font-medium">{answer.letter})</span>
                      <input
                        type="text"
                        value={answer.text}
                        onChange={(e) => {
                          const updatedAnswers = editingQuestion.answers.map((a, i) =>
                            i === index ? { ...a, text: e.target.value } : a
                          )
                          setEditingQuestion({ ...editingQuestion, answers: updatedAnswers })
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                data-testid="cancel-edit-button"
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Zrušiť
              </button>
              <button
                data-testid="save-edit-button"
                onClick={() => saveEditedQuestion(editingQuestion)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Uložiť
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Question Confirm Modal */}
      <ConfirmModal
        isOpen={!!questionToDelete}
        title="Vymazať otázku"
        message={`Naozaj chcete vymazať otázku č. ${questionToDelete?.order}?`}
        confirmLabel="Vymazať"
        cancelLabel="Zrušiť"
        variant="danger"
        onConfirm={() => {
          if (questionToDelete) {
            deleteQuestion(questionToDelete.id)
            setQuestionToDelete(null)
          }
        }}
        onCancel={() => setQuestionToDelete(null)}
      />
    </div>
  )
}
