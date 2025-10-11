'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'

interface DetailedAnswer {
  questionId: string
  questionText: string
  userAnswer: any
  correctAnswer: any
  isCorrect: boolean
  points: number
  options?: Array<{ id: string; text: string }>
}

export default function TestResultPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.sessionId as string

  const [result, setResult] = useState<any>(null)
  const [test, setTest] = useState<any>(null)
  const [detailedAnswers, setDetailedAnswers] = useState<DetailedAnswer[]>([])
  const [nextTest, setNextTest] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [candidateId, setCandidateId] = useState('')
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())

  useEffect(() => {
    const sessionData = sessionStorage.getItem('applicant-session')
    if (!sessionData) {
      router.push('/applicant/login')
      return
    }

    const session = JSON.parse(sessionData)
    setCandidateId(session.candidateId)

    loadResult(session.candidateId)
  }, [sessionId, router])

  const loadResult = async (candidateId: string) => {
    try {
      const response = await fetch(`/api/applicant/test/${sessionId}/result`, {
        headers: {
          'x-candidate-id': candidateId
        }
      })

      if (!response.ok) {
        const data = await response.json()
        if (data.redirectUrl) {
          router.push(data.redirectUrl)
        } else {
          toast.error(data.error || 'Chyba pri načítaní výsledku')
        }
        return
      }

      const data = await response.json()
      setResult(data.result)
      setTest(data.test)
      setDetailedAnswers(data.detailedAnswers)
      setNextTest(data.nextTest)
    } catch (error) {
      console.error('Load result error:', error)
      toast.error('Chyba pri načítaní výsledku')
    } finally {
      setLoading(false)
    }
  }

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  const getAnswerText = (answer: any, options?: Array<{ id: string; text: string }>) => {
    if (!answer) return '(Nezodpovedané)'

    if (Array.isArray(answer)) {
      return answer.map(a => {
        const option = options?.find(opt => opt.id === a)
        return option?.text || a
      }).join(', ')
    }

    if (options) {
      const option = options.find(opt => opt.id === answer)
      return option?.text || answer
    }

    if (answer === 'true') return 'Pravda'
    if (answer === 'false') return 'Nepravda'

    return answer
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Načítavam výsledok...</div>
      </div>
    )
  }

  const percentage = result ? Math.round((result.score / result.maxScore) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50 pt-16" data-testid="test-result-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-lg font-semibold text-gray-900" data-testid="test-name">
            {test?.name} - Výsledok
          </h1>
          <p className="text-sm text-gray-600">Level {test?.level}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Result Card */}
        <div
          className={`rounded-lg border-2 p-8 mb-8 ${
            result?.passed
              ? 'bg-green-50 border-green-300'
              : 'bg-red-50 border-red-300'
          }`}
          data-testid="result-card"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            {result?.passed ? (
              <CheckCircleIcon className="h-16 w-16 text-green-600" />
            ) : (
              <XCircleIcon className="h-16 w-16 text-red-600" />
            )}
          </div>

          <h2 className={`text-3xl font-bold text-center mb-2 ${
            result?.passed ? 'text-green-900' : 'text-red-900'
          }`}>
            {result?.passed ? 'PREŠIEL' : 'NEPREŠIEL'}
          </h2>

          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-gray-900 mb-2" data-testid="score">
              {result?.score}/{result?.maxScore} bodov
            </div>
            <div className="text-xl text-gray-700">
              {percentage}%
            </div>
          </div>

          {result?.completedAt && (
            <p className="text-sm text-center text-gray-600">
              Dokončené: {new Date(result.completedAt).toLocaleString('sk-SK')}
            </p>
          )}
        </div>

        {/* Detailed Answers */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailný prehľad odpovedí</h3>

          <div className="space-y-3">
            {detailedAnswers.map((answer, index) => (
              <div
                key={answer.questionId}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Question Header */}
                <button
                  onClick={() => toggleQuestion(answer.questionId)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-left"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {answer.isCorrect ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-500">
                        Otázka {index + 1}
                      </span>
                      <p className="text-sm text-gray-900 mt-1">
                        {answer.questionText}
                      </p>
                    </div>
                  </div>
                  {expandedQuestions.has(answer.questionId) ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {/* Question Details */}
                {expandedQuestions.has(answer.questionId) && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <dl className="space-y-3 text-sm">
                      <div>
                        <dt className="font-medium text-gray-700">Vaša odpoveď:</dt>
                        <dd className={`mt-1 ${
                          answer.isCorrect ? 'text-green-900' : 'text-red-900'
                        }`}>
                          {getAnswerText(answer.userAnswer, answer.options)}
                        </dd>
                      </div>

                      {!answer.isCorrect && (
                        <div>
                          <dt className="font-medium text-gray-700">Správna odpoveď:</dt>
                          <dd className="mt-1 text-green-900">
                            {getAnswerText(answer.correctAnswer, answer.options)}
                          </dd>
                        </div>
                      )}

                      <div>
                        <dt className="font-medium text-gray-700">Body:</dt>
                        <dd className="mt-1 text-gray-900">
                          {answer.isCorrect ? answer.points : 0} / {answer.points}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={() => {
                if (expandedQuestions.size === detailedAnswers.length) {
                  setExpandedQuestions(new Set())
                } else {
                  setExpandedQuestions(new Set(detailedAnswers.map(a => a.questionId)))
                }
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {expandedQuestions.size === detailedAnswers.length ? 'Zbaliť všetky' : 'Rozbaliť všetky'}
            </button>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ďalšie kroky</h3>

          <div className="flex gap-4">
            <button
              onClick={() => router.push('/my-tests')}
              className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 bg-white text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-50"
              data-testid="back-to-dashboard-button"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Späť na dashboard
            </button>

            {nextTest && result?.passed && (
              <button
                onClick={() => router.push('/my-tests')}
                className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700"
                data-testid="continue-to-next-level-button"
              >
                Pokračovať na Level {nextTest.level}
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            )}

            {!result?.passed && (
              <div className="text-sm text-gray-600">
                Test ste neúspešne dokončili. Výberové konanie pre vás končí.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
