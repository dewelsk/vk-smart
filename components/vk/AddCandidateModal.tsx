'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

type User = {
  id: string
  name: string
  surname: string
  email: string | null
  active: boolean
}

type AddCandidateModalProps = {
  vkId: string
  onClose: () => void
  onSuccess: () => void
}

export function AddCandidateModal({
  vkId,
  onClose,
  onSuccess
}: AddCandidateModalProps) {
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])

  useEffect(() => {
    fetchAvailableUsers()
  }, [])

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredUsers(allUsers)
    } else {
      const searchLower = search.toLowerCase()
      setFilteredUsers(
        allUsers.filter(
          user =>
            user.name.toLowerCase().includes(searchLower) ||
            user.surname.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower)
        )
      )
    }
  }, [search, allUsers])

  async function fetchAvailableUsers() {
    try {
      // Fetch users with role UCHADZAC that are not already in this VK
      const res = await fetch(`/api/admin/vk/${vkId}/candidates/available`)
      const data = await res.json()

      if (data.users) {
        setAllUsers(data.users)
        setFilteredUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  function toggleUserSelection(userId: string) {
    setSelectedUserIds(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId)
      } else {
        return [...prev, userId]
      }
    })
  }

  function selectAll() {
    setSelectedUserIds(filteredUsers.map(u => u.id))
  }

  function deselectAll() {
    setSelectedUserIds([])
  }

  async function handleSave() {
    if (selectedUserIds.length === 0) {
      alert('Vyberte aspoň jedného uchádzača')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/vk/${vkId}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUserIds
        })
      })

      if (res.ok) {
        const data = await res.json()
        alert(`Úspešne pridaných ${data.count} uchádzačov`)
        onSuccess()
        onClose()
      } else {
        const data = await res.json()
        alert(data.error || 'Chyba pri pridávaní uchádzačov')
      }
    } catch (error) {
      console.error('Error adding candidates:', error)
      alert('Chyba pri pridávaní uchádzačov')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Pridať uchádzača
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-6 border-b border-gray-200 pb-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Hľadať podľa mena alebo emailu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              Načítavam používateľov...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {search ? 'Žiadni používatelia nenájdení' : 'Žiadni dostupní používatelia'}
              </p>
              {!search && (
                <p className="text-sm text-gray-400 mt-2">
                  Všetci používatelia s rolou UCHADZAC už boli pridaní do tohto VK.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Vyberte uchádzačov ({selectedUserIds.length} vybraných)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Vybrať všetkých
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={deselectAll}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Zrušiť výber
                    </button>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <label
                      key={user.id}
                      className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${
                        selectedUserIds.includes(user.id) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {user.name} {user.surname}
                        </p>
                        {user.email && (
                          <p className="text-sm text-gray-500">{user.email}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {selectedUserIds.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Poznámka:</strong> CIS identifikátory budú automaticky vygenerované pri pridaní uchádzačov.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Zrušiť
          </button>
          <button
            onClick={handleSave}
            disabled={selectedUserIds.length === 0 || saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Ukladám...' : `Pridať (${selectedUserIds.length})`}
          </button>
        </div>
      </div>
    </div>
  )
}
