'use client'

import { useState, useEffect } from 'react'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/components/Toast'

type QuestionCategory = {
  id: string
  name: string
  description: string | null
  sortOrder: number
  questionCount: number
}

type EvaluationConfig = {
  id: string
  vkId: string
  evaluatedTraits: string[]
  createdAt: string
  updatedAt: string
}

interface OralTabProps {
  vk: {
    id: string
    identifier: string
  }
  onRefresh: () => void
}

export function OralTab({ vk, onRefresh }: OralTabProps) {
  const { showSuccess, showError } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<QuestionCategory[]>([])
  const [evaluationConfig, setEvaluationConfig] = useState<EvaluationConfig | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  useEffect(() => {
    fetchData()
  }, [vk.id])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Načítaj všetky kategórie
      const categoriesRes = await fetch('/api/admin/question-categories')
      const categoriesData = await categoriesRes.json()

      if (categoriesData.categories) {
        setCategories(categoriesData.categories)
      }

      // Načítaj konfiguráciu pre toto VK
      const configRes = await fetch(`/api/admin/vk/${vk.id}/evaluation-config`)
      const configData = await configRes.json()

      if (configData.config) {
        setEvaluationConfig(configData.config)
        setSelectedCategories(configData.config.evaluatedTraits)
      }
    } catch (error) {
      console.error('Failed to fetch oral evaluation data:', error)
      showError('Chyba pri načítaní dát')
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryToggle = (categoryName: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryName)) {
        return prev.filter(c => c !== categoryName)
      }
      // Maximálne 10 kategórií
      if (prev.length >= 10) {
        showError('Môžete vybrať maximálne 10 kategórií')
        return prev
      }
      return [...prev, categoryName]
    })
  }

  const handleSave = async () => {
    // Minimálne 3 kategórie
    if (selectedCategories.length < 3) {
      showError('Musíte vybrať minimálne 3 kategórie')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/vk/${vk.id}/evaluation-config`, {
        method: evaluationConfig ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          evaluatedTraits: selectedCategories,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Chyba pri ukladaní')
      }

      const data = await response.json()
      setEvaluationConfig(data.config)
      showSuccess('Konfigurácia ústnej časti bola uložená')
      onRefresh()
    } catch (error) {
      console.error('Failed to save evaluation config:', error)
      showError(error instanceof Error ? error.message : 'Chyba pri ukladaní konfigurácie')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Načítavam...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Konfigurácia ústnej časti</h2>
        <p className="mt-1 text-sm text-gray-600">
          Vyberte kategórie otázok, ktoré sa budú hodnotiť počas osobného pohovoru.
          Musíte vybrať minimálne 3 a maximálne 10 kategórií.
        </p>
      </div>

      {/* Stats */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900">Vybrané kategórie</p>
            <p className="text-2xl font-bold text-blue-600">{selectedCategories.length} / 10</p>
          </div>
          <div className="text-sm text-blue-700">
            {selectedCategories.length < 3 && (
              <span className="text-red-600">Vyberte minimálne 3 kategórie</span>
            )}
            {selectedCategories.length >= 3 && selectedCategories.length <= 10 && (
              <span className="text-green-600">✓ Počet kategórií je v poriadku</span>
            )}
          </div>
        </div>
      </div>

      {/* Categories list */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {categories.map((category) => {
            const isSelected = selectedCategories.includes(category.name)
            return (
              <li key={category.id}>
                <div
                  className={`px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleCategoryToggle(category.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-blue-600' : 'bg-gray-200'
                        }`}>
                          {isSelected ? (
                            <CheckIcon className="h-6 w-6 text-white" />
                          ) : (
                            <span className="text-gray-500 font-medium">
                              {categories.indexOf(category) + 1}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {category.name}
                        </div>
                        {category.description && (
                          <div className="text-sm text-gray-500">
                            {category.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-500">
                        {category.questionCount} otázok
                      </div>
                      {isSelected && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Vybraté
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {evaluationConfig && (
            <span>
              Posledná úprava: {new Date(evaluationConfig.updatedAt).toLocaleDateString('sk-SK')}
            </span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving || selectedCategories.length < 3}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
            saving || selectedCategories.length < 3
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }`}
        >
          {saving ? 'Ukladám...' : 'Uložiť konfiguráciu'}
        </button>
      </div>
    </div>
  )
}