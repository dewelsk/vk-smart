'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { ConfirmModal } from '@/components/ConfirmModal'

type Question = {
  id: string
  text: string
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'TEXT'
  options?: Array<{ id: string; text: string }>
  points: number
}

type TestData = {
  sessionId: string
  test: {
    id: string
    name: string
    type: string
    description: string | null
    questions: Question[]
    recommendedDuration: number | null
    difficulty: number | null
  }
  startedAt: string
}

type Props = {
  params: {
    sessionId: string
  }
}

export default function PracticeTestPage({ params }: Props) {
  const sessionId = params.sessionId
  const router = useRouter()

  const [testData, setTestData] = useState<TestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)
  const [highlightUnanswered, setHighlightUnanswered] = useState(false)

  // Fetch test data
  useEffect(() => {
    // Since we get sessionId from start endpoint, we need to get test data from sessionStorage
    // Or we could add a GET endpoint for session data
    const storedData = sessionStorage.getItem(`practice-session-${sessionId}`)
    if (storedData) {
      const data = JSON.parse(storedData)
      setTestData(data)

      // Initialize timer based on server time if recommended duration is set
      if (data.test.recommendedDuration && data.startedAt) {
        const startedAt = new Date(data.startedAt).getTime()
        const now = Date.now()
        const elapsedSeconds = Math.floor((now - startedAt) / 1000)
        const totalSeconds = data.test.recommendedDuration * 60
        const remaining = Math.max(0, totalSeconds - elapsedSeconds)
        setTimeRemaining(remaining)
      }

      setLoading(false)
    } else {
      toast.error('Test session nenájdená')
      router.push('/tests/practice')
    }
  }, [sessionId, router])

  const handleAutoSubmit = async () => {
    if (submitting) return

    // Convert answers to array format
    const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer,
    }))

    setSubmitting(true)
    toast.loading('Čas vypršal. Odosielam odpovede...')

    try {
      const res = await fetch(`/api/practice/${sessionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersArray }),
      })

      toast.dismiss()

      if (!res.ok) {
        const error = await res.json()
        toast.error(error.error || 'Chyba pri odoslaní testu')
        setSubmitting(false)
        return
      }

      const data = await res.json()

      // Store results in sessionStorage for results page
      sessionStorage.setItem(`practice-results-${sessionId}`, JSON.stringify(data))

      toast.success('Test automaticky odoslaný')

      // Redirect to results page
      router.push(`/tests/practice/${sessionId}/results`)

    } catch (error) {
      toast.dismiss()
      toast.error('Chyba pri odoslaní testu')
      setSubmitting(false)
    }
  }

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          // Auto-submit when time runs out (skip confirmation modal)
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining])

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers((prev) => {
      const newAnswers = {
        ...prev,
        [questionId]: answer,
      }

      // Clear highlight if all questions are now answered
      if (Object.keys(newAnswers).length === testData?.test.questions.length) {
        setHighlightUnanswered(false)
      }

      return newAnswers
    })
  }

  const handleSubmitClick = () => {
    setShowConfirmSubmit(true)
  }

  const handleConfirmSubmit = async () => {
    setShowConfirmSubmit(false)

    if (submitting) return

    // Convert answers to array format
    const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer,
    }))

    setSubmitting(true)
    toast.loading('Odosielam odpovede...')

    try {
      const res = await fetch(`/api/practice/${sessionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersArray }),
      })

      toast.dismiss()

      if (!res.ok) {
        const error = await res.json()

        // Handle time limit exceeded specifically
        if (error.error === 'Časový limit bol prekročený') {
          toast.error('Časový limit už vypršal. Test nemožno odoslať.')
        } else {
          toast.error(error.error || 'Chyba pri odoslaní testu')
        }

        setSubmitting(false)
        return
      }

      const data = await res.json()

      // Store results in sessionStorage for results page
      sessionStorage.setItem(`practice-results-${sessionId}`, JSON.stringify(data))

      toast.success('Test úspešne odoslaný')

      // Redirect to results page
      router.push(`/tests/practice/${sessionId}/results`)

    } catch (error) {
      toast.dismiss()
      toast.error('Chyba pri odoslaní testu')
      setSubmitting(false)
    }
  }

  const handleCancelSubmit = () => {
    setShowConfirmSubmit(false)

    // If questions are unanswered, highlight them
    if (!allAnswered) {
      setHighlightUnanswered(true)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Načítavam test...</div>
      </div>
    )
  }

  if (!testData) {
    return null
  }

  const answeredCount = Object.keys(answers).length
  const totalQuestions = testData.test.questions.length
  const allAnswered = answeredCount === totalQuestions

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8" data-testid="practice-test-page">
      {/* Header */}
      <div className="sticky top-16 z-10 bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200 shadow-md p-6 mb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="test-title">
              {testData.test.name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {totalQuestions} otázok
            </p>
          </div>

          {timeRemaining !== null && (
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-gray-400" />
              <span
                data-testid="time-remaining"
                className={`text-lg font-semibold ${
                  timeRemaining < 60 ? 'text-red-600' : 'text-gray-900'
                }`}
              >
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Zodpovedaných: {answeredCount} / {totalQuestions}</span>
            <span>{Math.round((answeredCount / totalQuestions) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {testData.test.questions.map((question, index) => {
          const isUnanswered = !answers[question.id]
          const shouldHighlight = highlightUnanswered && isUnanswered

          return (
            <div
              key={question.id}
              className={`bg-white rounded-lg shadow p-6 transition-all ${
                shouldHighlight ? 'ring-2 ring-yellow-400 bg-yellow-50' : ''
              }`}
              data-testid={`question-${index + 1}`}
            >
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900" data-testid="question-text">
                  {question.text}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{question.points} {question.points === 1 ? 'bod' : 'body'}</p>
              </div>
            </div>

            {/* Single Choice */}
            {question.type === 'SINGLE_CHOICE' && question.options && (
              <div className="space-y-2 ml-11" data-testid="single-choice-options">
                {question.options.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option.id}
                      checked={answers[question.id] === option.id}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-gray-700">{option.text}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Multiple Choice */}
            {question.type === 'MULTIPLE_CHOICE' && question.options && (
              <div className="space-y-2 ml-11" data-testid="multiple-choice-options">
                {question.options.map((option) => {
                  const selectedOptions = answers[question.id] || []
                  const isChecked = selectedOptions.includes(option.id)

                  return (
                    <label
                      key={option.id}
                      className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        value={option.id}
                        checked={isChecked}
                        onChange={(e) => {
                          const newOptions = isChecked
                            ? selectedOptions.filter((id: string) => id !== option.id)
                            : [...selectedOptions, option.id]
                          handleAnswerChange(question.id, newOptions)
                        }}
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-gray-700">{option.text}</span>
                    </label>
                  )
                })}
              </div>
            )}

            {/* True/False */}
            {question.type === 'TRUE_FALSE' && (
              <div className="space-y-2 ml-11" data-testid="true-false-options">
                {[
                  { value: true, label: 'Pravda' },
                  { value: false, label: 'Nepravda' }
                ].map((option) => (
                  <label
                    key={String(option.value)}
                    className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={String(option.value)}
                      checked={answers[question.id] === option.value}
                      onChange={() => handleAnswerChange(question.id, option.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Text Answer */}
            {question.type === 'TEXT' && (
              <div className="ml-11" data-testid="text-answer">
                <input
                  type="text"
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Zadajte odpoveď..."
                />
              </div>
            )}
          </div>
        )
        })}
      </div>

      {/* Submit Section */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            {!allAnswered && (
              <p className="text-sm text-yellow-600">
                Ešte ste neodpovedali na všetky otázky ({totalQuestions - answeredCount} zostáva)
              </p>
            )}
            {allAnswered && (
              <div className="flex items-center text-sm text-green-600">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                <span>Všetky otázky zodpovedané</span>
              </div>
            )}
          </div>

          <button
            data-testid="submit-test-button"
            onClick={handleSubmitClick}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Odosielam...' : 'Odoslať test'}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmSubmit}
        title={allAnswered ? 'Odoslať test' : 'Neodpovedané otázky'}
        message={
          allAnswered
            ? 'Chystáte sa odoslať test. Chcete pokračovať?'
            : `Ešte ste neodpovedali na všetky otázky. Zostáva ${totalQuestions - answeredCount} ${
                totalQuestions - answeredCount === 1 ? 'otázka' : totalQuestions - answeredCount < 5 ? 'otázky' : 'otázok'
              }. Chcete pokračovať?`
        }
        confirmLabel="Odoslať"
        cancelLabel="Zrušiť"
        variant={allAnswered ? 'primary' : 'warning'}
        onConfirm={handleConfirmSubmit}
        onCancel={handleCancelSubmit}
      />
    </div>
  )
}
