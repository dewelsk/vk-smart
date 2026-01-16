'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import {
  ClockIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { ConfirmModal } from '@/components/ConfirmModal'

interface Question {
  id: string
  text: string
  type: string
  points: number
  options?: Array<{ id: string; text: string }>
}

export default function TestSessionPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.sessionId as string

  const [test, setTest] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [remainingTime, setRemainingTime] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [candidateId, setCandidateId] = useState('')

  // Modals
  const [showSaveAndLeaveConfirm, setShowSaveAndLeaveConfirm] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [showTimeExpiredModal, setShowTimeExpiredModal] = useState(false)

  // View mode
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single')

  const autoSaveInterval = useRef<NodeJS.Timeout>()
  const timerInterval = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Load test session using JWT cookie authentication
    const loadSession = async () => {
      try {
        // Load view mode preference
        const savedViewMode = sessionStorage.getItem('test-view-mode')
        if (savedViewMode === 'all') {
          setViewMode('all')
        }

        // Load test session - uses JWT cookie for auth
        await loadTestSession()
      } catch (error) {
        console.error('Session load error:', error)
        router.push('/applicant/login')
      }
    }

    loadSession()

    // Prevent accidental page close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      if (autoSaveInterval.current) clearInterval(autoSaveInterval.current)
      if (timerInterval.current) clearInterval(timerInterval.current)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [sessionId, router])

  // Setup auto-save when test is loaded
  useEffect(() => {
    if (!test) return

    // Setup auto-save every 1 second
    autoSaveInterval.current = setInterval(() => {
      saveAnswers()
    }, 1000)

    return () => {
      if (autoSaveInterval.current) clearInterval(autoSaveInterval.current)
    }
  }, [test])

  useEffect(() => {
    if (session && session.serverStartTime && session.durationSeconds) {
      // Setup timer
      const updateTimer = () => {
        const startTime = new Date(session.serverStartTime).getTime()
        const now = Date.now()
        const elapsed = (now - startTime) / 1000
        const remaining = Math.max(0, session.durationSeconds - elapsed)

        setRemainingTime(remaining)

        if (remaining <= 0) {
          // Time expired
          handleTimeExpired()
        }
      }

      updateTimer()
      timerInterval.current = setInterval(updateTimer, 1000)

      return () => {
        if (timerInterval.current) clearInterval(timerInterval.current)
      }
    }
  }, [session])

  const loadTestSession = async () => {
    try {
      // Uses JWT cookie for authentication
      const response = await fetch(`/api/applicant/test/${sessionId}`)

      if (!response.ok) {
        const data = await response.json()
        if (data.redirectUrl) {
          router.push(data.redirectUrl)
        } else if (response.status === 401) {
          router.push('/applicant/login')
        } else {
          toast.error(data.error || 'Chyba pri načítaní testu')
        }
        return
      }

      const data = await response.json()
      setTest(data.test)
      setSession(data.session)
      setQuestions(data.test.questions)
      setAnswers(data.session.answers || {})
    } catch (error) {
      console.error('Load test error:', error)
      toast.error('Chyba pri načítaní testu')
    } finally {
      setLoading(false)
    }
  }

  const saveAnswers = async () => {
    if (!test || saving) return

    setSaving(true)

    try {
      // Uses JWT cookie for authentication
      const response = await fetch(`/api/applicant/test/${sessionId}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers })
      })

      if (!response.ok) {
        const data = await response.json()
        if (data.timeExpired) {
          handleTimeExpired()
        }
      }
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleTimeExpired = () => {
    if (timerInterval.current) clearInterval(timerInterval.current)
    if (autoSaveInterval.current) clearInterval(autoSaveInterval.current)
    setShowTimeExpiredModal(true)

    setTimeout(() => {
      handleSubmitTest()
    }, 3000)
  }

  const handleSaveAndLeave = () => {
    setShowSaveAndLeaveConfirm(true)
  }

  const confirmSaveAndLeave = async () => {
    await saveAnswers()
    router.push('/applicant/my-tests')
  }

  const handleSubmitClick = () => {
    const unansweredCount = questions.filter(q => !answers[q.id]).length
    setShowSubmitConfirm(true)
  }

  const handleSubmitTest = async () => {
    try {
      toast.loading('Odosielam test...')

      // Uses JWT cookie for authentication
      const response = await fetch(`/api/applicant/test/${sessionId}/submit`, {
        method: 'POST',
      })

      const data = await response.json()
      toast.dismiss()

      if (!response.ok) {
        toast.error(data.error || 'Chyba pri odoslaní testu')
        return
      }

      toast.success('Test bol úspešne odoslaný')
      router.push(data.redirectUrl)
    } catch (error) {
      toast.dismiss()
      toast.error('Chyba pri odoslaní testu')
      console.error('Submit error:', error)
    }
  }

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getTimerColor = () => {
    if (remainingTime <= 60) return 'text-red-600'
    if (remainingTime <= 300) return 'text-orange-600'
    return 'text-gray-900'
  }

  const answeredCount = Object.keys(answers).filter(k => answers[k]).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Načítavam test...</div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const unansweredCount = questions.length - answeredCount

  return (
    <div className="min-h-screen bg-gray-50 pt-16" data-testid="test-session-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg font-semibold text-gray-900" data-testid="test-name">
                {test?.name}
              </h1>
              <p className="text-sm text-gray-600">
                Level {session?.vkTest?.level} · {questions.length} otázok
              </p>
            </div>
            <div className="flex items-center gap-6">
              {/* Timer */}
              <div className={`flex items-center gap-2 ${getTimerColor()}`} data-testid="timer">
                <ClockIcon className="h-5 w-5" />
                <span className="text-lg font-mono font-semibold">
                  {formatTime(remainingTime)}
                </span>
              </div>
              {/* Progress */}
              <div className="text-sm text-gray-600" data-testid="progress">
                {answeredCount}/{questions.length}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* View Mode Toggle */}
        <div className="mb-6 flex items-center gap-4">
          <span className="text-sm text-gray-700">Zobrazenie:</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="viewMode"
              checked={viewMode === 'single'}
              onChange={() => {
                setViewMode('single')
                sessionStorage.setItem('test-view-mode', 'single')
              }}
              data-testid="view-mode-single"
              className="text-blue-600"
            />
            <span className="text-sm">Otázka po otázke</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="viewMode"
              checked={viewMode === 'all'}
              onChange={() => {
                setViewMode('all')
                sessionStorage.setItem('test-view-mode', 'all')
              }}
              data-testid="view-mode-all"
              className="text-blue-600"
            />
            <span className="text-sm">Všetky otázky naraz</span>
          </label>
        </div>

        {/* Questions */}
        {viewMode === 'single' ? (
          /* Single Question View */
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="mb-4">
              <span className="text-sm font-medium text-gray-500">
                Otázka {currentQuestionIndex + 1} z {questions.length}
              </span>
            </div>

            <QuestionRenderer
              question={currentQuestion}
              answer={answers[currentQuestion.id]}
              onChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
            />
          </div>
        ) : (
          /* All Questions View */
          <div className="space-y-4 mb-6">
            {questions.map((question, index) => {
              const isAnswered = answers[question.id] !== null && answers[question.id] !== undefined && answers[question.id] !== ''
              return (
                <div
                  key={question.id}
                  id={`question-${index}`}
                  className={`bg-white rounded-lg border p-6 ${
                    isAnswered ? 'border-green-300' : 'border-gray-200'
                  }`}
                >
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-500">
                      Otázka {index + 1} z {questions.length}
                    </span>
                  </div>

                  <QuestionRenderer
                    question={question}
                    answer={answers[question.id]}
                    onChange={(answer) => handleAnswerChange(question.id, answer)}
                  />
                </div>
              )
            })}
          </div>
        )}

        {/* Navigation (for single question mode) */}
        {viewMode === 'single' && (
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 bg-white text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="prev-question-button"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Predchádzajúca
            </button>

            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
              disabled={currentQuestionIndex === questions.length - 1}
              className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 bg-white text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="next-question-button"
            >
              Ďalšia
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Quick Navigation - only show in single question mode */}
        {viewMode === 'single' && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Rýchla navigácia</h3>
            <div className="flex flex-wrap gap-2">
              {questions.map((q, index) => (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentQuestionIndex(index)
                  }}
                  className={`w-10 h-10 rounded border text-sm font-medium ${
                    answers[q.id]
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } ${currentQuestionIndex === index ? 'ring-2 ring-blue-600' : ''}`}
                  data-testid={`quick-nav-${index + 1}`}
                >
                  {index + 1}
                </button>
            ))}
          </div>
        </div>
        )}

        {/* Actions */}
        <div className="flex justify-between gap-4">
          <button
            onClick={handleSaveAndLeave}
            className="border border-gray-300 text-gray-700 bg-white text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-50"
            data-testid="save-and-leave-button"
          >
            Uložiť a odísť
          </button>

          <button
            onClick={handleSubmitClick}
            className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700"
            data-testid="submit-test-button"
          >
            <CheckIcon className="h-4 w-4" />
            Odoslať test
          </button>
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={showSaveAndLeaveConfirm}
        title="Uložiť a odísť"
        message="Váš priebeh bude uložený a môžete sa vrátiť naspäť kedykoľvek."
        variant="primary"
        onConfirm={confirmSaveAndLeave}
        onCancel={() => setShowSaveAndLeaveConfirm(false)}
      />

      <ConfirmModal
        isOpen={showSubmitConfirm}
        title="Odoslať test"
        message={unansweredCount > 0
          ? `Máte ${unansweredCount} nezodpovedaných otázok. Naozaj chcete odoslať test?`
          : 'Naozaj chcete odoslať test? Po odoslaní už nebudete môcť meniť odpovede.'
        }
        variant="primary"
        onConfirm={handleSubmitTest}
        onCancel={() => setShowSubmitConfirm(false)}
      />

      <ConfirmModal
        isOpen={showTimeExpiredModal}
        title="Čas vypršal"
        message="Test sa automaticky odosiela..."
        variant="warning"
        hideButtons={true}
      />
    </div>
  )
}

// Question Renderer Component
function QuestionRenderer({
  question,
  answer,
  onChange
}: {
  question: Question
  answer: any
  onChange: (answer: any) => void
}) {
  return (
    <div>
      <p className="text-base font-medium text-gray-900 mb-4">{question.text}</p>

      {question.type === 'SINGLE_CHOICE' && question.options && (
        <div className="space-y-2">
          {question.options.map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50"
            >
              <input
                type="radio"
                name={question.id}
                value={option.id}
                checked={answer === option.id}
                onChange={(e) => onChange(e.target.value)}
                className="text-blue-600"
              />
              <span className="text-gray-900">{option.text}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === 'MULTIPLE_CHOICE' && question.options && (
        <div className="space-y-2">
          {question.options.map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                value={option.id}
                checked={Array.isArray(answer) && answer.includes(option.id)}
                onChange={(e) => {
                  const currentAnswers = Array.isArray(answer) ? answer : []
                  if (e.target.checked) {
                    onChange([...currentAnswers, option.id])
                  } else {
                    onChange(currentAnswers.filter((a: string) => a !== option.id))
                  }
                }}
                className="text-blue-600"
              />
              <span className="text-gray-900">{option.text}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === 'SHORT_TEXT' && (
        <input
          type="text"
          value={answer || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Vaša odpoveď..."
        />
      )}

      {question.type === 'TRUE_FALSE' && (
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name={question.id}
              value="true"
              checked={answer === 'true'}
              onChange={(e) => onChange(e.target.value)}
              className="text-blue-600"
            />
            <span className="text-gray-900">Pravda</span>
          </label>
          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name={question.id}
              value="false"
              checked={answer === 'false'}
              onChange={(e) => onChange(e.target.value)}
              className="text-blue-600"
            />
            <span className="text-gray-900">Nepravda</span>
          </label>
        </div>
      )}
    </div>
  )
}
