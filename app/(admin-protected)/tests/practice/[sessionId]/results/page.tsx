'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowLeftIcon,
  PlayIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'

type QuestionResult = {
  questionId: string
  questionText: string
  questionType: string
  userAnswer: any
  correctAnswer: any
  isCorrect: boolean
  points: number
  explanation: string | null
}

type ResultsData = {
  sessionId: string
  score: number
  maxScore: number
  successRate: number
  passed: boolean
  durationSeconds: number
  completedAt: string
  results: QuestionResult[]
  test: {
    id: string
    name: string
    type: string
    recommendedScore: number | null
  }
}

type Props = {
  params: {
    sessionId: string
  }
}

export default function PracticeResultsPage({ params }: Props) {
  const sessionId = params.sessionId
  const router = useRouter()

  const [resultsData, setResultsData] = useState<ResultsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Get results from sessionStorage
    const storedResults = sessionStorage.getItem(`practice-results-${sessionId}`)
    if (storedResults) {
      const data = JSON.parse(storedResults)
      setResultsData(data)
      setLoading(false)
    } else {
      router.push('/tests/practice')
    }
  }, [sessionId, router])

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins} min ${secs} s`
  }

  const formatAnswer = (answer: any, type: string) => {
    if (answer === null || answer === undefined) return '-'
    if (type === 'TRUE_FALSE') return answer ? 'Pravda' : 'Nepravda'
    if (Array.isArray(answer)) return answer.join(', ')
    return String(answer)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Načítavam výsledky...</div>
      </div>
    )
  }

  if (!resultsData) {
    return null
  }

  const correctCount = resultsData.results.filter((r) => r.isCorrect).length
  const incorrectCount = resultsData.results.length - correctCount

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8" data-testid="results-page">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/tests/practice"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          data-testid="back-to-practice-button"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Späť na precvičovanie
        </Link>
      </div>

      {/* Results Summary */}
      <div className="bg-white rounded-lg shadow p-6 mb-6" data-testid="results-summary">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2" data-testid="test-title">
            {resultsData.test.name}
          </h1>

          {/* Pass/Fail Badge */}
          {resultsData.passed ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full">
              <CheckCircleIcon className="h-5 w-5" />
              <span className="font-semibold">Úspešne splnené</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-full">
              <XCircleIcon className="h-5 w-5" />
              <span className="font-semibold">Nesplnené</span>
            </div>
          )}
        </div>

        {/* Score */}
        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-gray-900" data-testid="success-rate">
            {resultsData.successRate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600 mt-2">
            {resultsData.score} / {resultsData.maxScore} bodov
          </div>
          {resultsData.test.recommendedScore && (
            <div className="text-xs text-gray-500 mt-1">
              Požadovaná úspešnosť: {resultsData.test.recommendedScore}%
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-900" data-testid="correct-count">
              {correctCount}
            </div>
            <div className="text-sm text-green-700">Správne</div>
          </div>

          <div className="bg-red-50 rounded-lg p-4 text-center">
            <XCircleIcon className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-900" data-testid="incorrect-count">
              {incorrectCount}
            </div>
            <div className="text-sm text-red-700">Nesprávne</div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <ClockIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-900" data-testid="duration">
              {formatDuration(resultsData.durationSeconds)}
            </div>
            <div className="text-sm text-blue-700">Čas</div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3 justify-center">
          <Link
            href="/tests/practice"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            data-testid="try-another-button"
          >
            <PlayIcon className="h-4 w-4" />
            Vyskúšať iný test
          </Link>
        </div>
      </div>

      {/* Question Results */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Podrobné výsledky</h2>

        {resultsData.results.map((result, index) => {
          const isExpanded = expandedQuestions.has(result.questionId)

          return (
            <div
              key={result.questionId}
              className={`bg-white rounded-lg shadow overflow-hidden ${
                result.isCorrect ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
              }`}
              data-testid={`question-result-${index + 1}`}
            >
              <button
                onClick={() => toggleQuestion(result.questionId)}
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {result.isCorrect ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircleIcon className="h-6 w-6 text-red-600" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900">
                        Otázka {index + 1}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {result.points} {result.points === 1 ? 'bod' : 'body'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{result.questionText}</p>
                  </div>

                  <svg
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      isExpanded ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="mt-4 space-y-3">
                    {/* User Answer */}
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                        Vaša odpoveď
                      </div>
                      <div className={`text-sm ${
                        result.isCorrect ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {formatAnswer(result.userAnswer, result.questionType)}
                      </div>
                    </div>

                    {/* Correct Answer (if wrong) */}
                    {!result.isCorrect && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                          Správna odpoveď
                        </div>
                        <div className="text-sm text-green-700">
                          {formatAnswer(result.correctAnswer, result.questionType)}
                        </div>
                      </div>
                    )}

                    {/* Explanation */}
                    {result.explanation && (
                      <div className="bg-blue-50 rounded-md p-3">
                        <div className="flex items-start gap-2">
                          <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-medium text-blue-900 uppercase mb-1">
                              Vysvetlenie
                            </div>
                            <div className="text-sm text-blue-800">
                              {result.explanation}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
