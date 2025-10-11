'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import {
  DocumentTextIcon,
  TrashIcon,
  PlusIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { ConfirmModal } from '@/components/ConfirmModal'

interface VKTest {
  id: string
  level: number
  test: {
    id: string
    name: string
    testTypeId: string
    testType: {
      id: string
      name: string
      description: string | null
    } | null
    testTypeConditionId: string | null
    testTypeCondition: {
      id: string
      name: string
      description: string | null
    } | null
    totalQuestions: number
  }
  questionCount: number
  durationMinutes: number
  scorePerQuestion: number
  minScore: number
  questionSelectionMode: string
}

interface VKData {
  id: string
  identifier: string
  status: string
  position: string
}

interface TestsTabProps {
  vk: VKData
  onRefresh: () => void
}

function getQuestionWord(count: number) {
  if (count === 1) return 'otázka'
  if (count >= 2 && count <= 4) return 'otázky'
  return 'otázok'
}

export function TestsTab({ vk, onRefresh }: TestsTabProps) {
  const [assignedTests, setAssignedTests] = useState<VKTest[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingTestId, setDeletingTestId] = useState<string>('')

  // Form state
  const [selectedTestId, setSelectedTestId] = useState<string>('')

  // Available tests for selection
  const [availableTests, setAvailableTests] = useState<any[]>([])
  const [selectedTest, setSelectedTest] = useState<any>(null)

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadData()
  }, [vk.id])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load VK and assigned tests
      const response = await fetch(`/api/admin/vk/${vk.id}/tests`)
      if (!response.ok) {
        throw new Error('Chyba pri načítaní testov')
      }

      const data = await response.json()
      setAssignedTests(data.assignedTests || [])

      // Load available tests
      const testsResponse = await fetch('/api/admin/tests?approved=true')
      if (testsResponse.ok) {
        const testsData = await testsResponse.json()
        setAvailableTests(testsData.tests || [])
      }
    } catch (error) {
      console.error('Load error:', error)
      toast.error('Chyba pri načítaní dát')
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setSelectedTestId('')
    setSelectedTest(null)
    setSearchQuery('')
    setCategoryFilter('')
    setTypeFilter('')
    setErrors({})
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setErrors({})
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!selectedTestId) {
      newErrors.testId = 'Vyberte test'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Vyberte test')
      return
    }

    try {
      const payload = { testId: selectedTestId }

      // Only allow creating new tests (no editing)
      const response = await fetch(`/api/admin/vk/${vk.id}/tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || 'Chyba pri ukladaní')
        return
      }

      toast.success('Test bol úspešne pridaný')
      closeModal()
      loadData()
      onRefresh() // Refresh parent to update validation
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Chyba pri ukladaní')
    }
  }

  const handleDeleteClick = (vkTestId: string) => {
    setDeletingTestId(vkTestId)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`/api/admin/vk/${vk.id}/tests/${deletingTestId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || 'Chyba pri odstraňovaní')
        return
      }

      toast.success('Test bol odstránený')
      setShowDeleteConfirm(false)
      setDeletingTestId('')
      loadData()
      onRefresh() // Refresh parent to update validation
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Chyba pri odstraňovaní')
    }
  }

  const handleTestSelect = (testId: string) => {
    setSelectedTestId(testId)
    const test = availableTests.find(t => t.id === testId)
    setSelectedTest(test)
  }

  // Filter tests - remove already assigned tests and apply search/filter
  const getFilteredTests = () => {
    // Get IDs of already assigned tests
    const assignedTestIds = assignedTests.map(at => at.test.id)

    // Filter out already assigned tests
    let filtered = availableTests.filter(test => !assignedTestIds.includes(test.id))

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(test =>
        test.name.toLowerCase().includes(query) ||
        test.description?.toLowerCase().includes(query)
      )
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(test => test.categoryId === categoryFilter)
    }

    // Apply type filter
    if (typeFilter) {
      filtered = filtered.filter(test => test.testTypeId === typeFilter)
    }

    return filtered
  }

  const filteredTests = getFilteredTests()

  // Get unique categories and types for filters
  const categories = Array.from(new Set(availableTests.map(t => t.category).filter(Boolean)))
  const types = Array.from(
    new Map(
      availableTests
        .filter((t) => t.testType)
        .map((t) => [t.testType.id, t.testType])
    ).values()
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Načítavam...</div>
      </div>
    )
  }


  return (
    <div data-testid="tests-tab-content">
      {/* Add Test Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Pridelené testy</h2>

        {/* MVP: Allow adding tests in any status */}
        {/* TODO: In production, restrict to PRIPRAVA only */}
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700"
          data-testid="add-test-button"
        >
          <PlusIcon className="h-4 w-4" />
          Pridať test
        </button>
      </div>

      {/* Assigned Tests */}
      <div className="space-y-4">
        {assignedTests.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600">Zatiaľ nie sú priradené žiadne testy</p>
          </div>
        ) : (
          assignedTests.map((vkTest) => (
            <div
              key={vkTest.id}
              className="bg-white rounded-lg border border-gray-200 p-6"
              data-testid={`test-assignment-card-${vkTest.level}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Test #{vkTest.level}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{vkTest.test.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Typ: {vkTest.test.testType?.name || '—'}
                    {vkTest.test.testTypeCondition && (
                      <>
                        {' · '}Podmienka: {vkTest.test.testTypeCondition.name}
                      </>
                    )}
                  </p>
                </div>

                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircleIcon className="h-4 w-4" />
                  Nakonfigurovaný
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-gray-600">Počet otázok:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {vkTest.questionCount} {getQuestionWord(vkTest.questionCount)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Trvanie:</span>
                  <span className="ml-2 font-medium text-gray-900">{vkTest.durationMinutes} min</span>
                </div>
                <div>
                  <span className="text-gray-600">Bodovanie:</span>
                  <span className="ml-2 font-medium text-gray-900">{vkTest.scorePerQuestion} bod/otázku</span>
                </div>
                <div>
                  <span className="text-gray-600">Min. skóre:</span>
                  <span className="ml-2 font-medium text-gray-900">{vkTest.minScore} bodov</span>
                </div>
              </div>

              {/* MVP: Allow deleting tests in any status */}
              {/* TODO: In production, restrict to PRIPRAVA only */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleDeleteClick(vkTest.id)}
                  className="inline-flex items-center gap-2 border border-red-300 text-red-700 bg-white text-sm font-medium px-4 py-2 rounded-md hover:bg-red-50"
                  data-testid={`delete-test-button-${vkTest.level}`}
                >
                  <TrashIcon className="h-4 w-4" />
                  Odstrániť
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Pridať test k VK
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
                data-testid="cancel-button"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Search and Filters */}
              <div className="space-y-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vyhľadať test
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Hľadať podľa názvu..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                    data-testid="test-search-input"
                  />
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kategória
                    </label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                      data-testid="category-filter"
                    >
                      <option value="">Všetky kategórie</option>
                      {categories.map((category: any) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Typ testu
                    </label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                      data-testid="type-filter"
                    >
                      <option value="">Všetky typy</option>
                      {types.map((type: any) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Test List */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vyber test: <span className="text-red-600">*</span>
                </label>
                {errors.testId && (
                  <p className="mb-2 text-sm text-red-600" data-testid="test-select-error">
                    {errors.testId}
                  </p>
                )}
                <div className="border border-gray-300 rounded-md max-h-96 overflow-y-auto">
                  {filteredTests.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      {availableTests.length === assignedTests.length
                        ? 'Všetky testy sú už priradené'
                        : 'Žiadne testy nevyhovujú filtrom'}
                    </div>
                  ) : (
                    filteredTests.map((test) => (
                      <div
                        key={test.id}
                        onClick={() => handleTestSelect(test.id)}
                        className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedTestId === test.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                        }`}
                        data-testid={`test-option-${test.id}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{test.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Typ: {test.testType?.name || '—'}
                              {test.testTypeCondition && (
                                <>
                                  {' · '}Podmienka: {test.testTypeCondition.name}
                                </>
                              )}
                              {test.category && ` • Kategória: ${test.category.name}`}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {test.totalQuestions} {getQuestionWord(test.totalQuestions)}
                            </p>
                          </div>
                          {selectedTestId === test.id && (
                            <CheckCircleIcon className="h-6 w-6 text-blue-600 flex-shrink-0 ml-3" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="border border-gray-300 text-gray-700 bg-white text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-50"
                data-testid="cancel-button"
              >
                Zrušiť
              </button>
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700"
                data-testid="save-test-button"
              >
                Vybrať test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Odstrániť test"
        message="Naozaj chcete odstrániť tento test z VK?"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteConfirm(false)
          setDeletingTestId('')
        }}
      />
    </div>
  )
}
