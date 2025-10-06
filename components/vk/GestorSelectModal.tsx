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

type GestorSelectModalProps = {
  vkId: string
  currentGestorId: string | null
  onClose: () => void
  onSuccess: () => void
}

export function GestorSelectModal({
  vkId,
  currentGestorId,
  onClose,
  onSuccess
}: GestorSelectModalProps) {
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(currentGestorId)

  useEffect(() => {
    fetchGestorUsers()
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

  async function fetchGestorUsers() {
    try {
      const res = await fetch('/api/admin/users?role=GESTOR&status=active')
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

  async function handleSave() {
    if (!selectedUserId || selectedUserId === currentGestorId) {
      onClose()
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/vk/${vkId}/gestor`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gestorId: selectedUserId
        })
      })

      if (res.ok) {
        onSuccess()
        onClose()
      } else {
        const data = await res.json()
        alert(data.error || 'Chyba pri zmene gestora')
      }
    } catch (error) {
      console.error('Error changing gestor:', error)
      alert('Chyba pri zmene gestora')
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
            {currentGestorId ? 'Zmeniť gestora' : 'Priradiť gestora'}
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
                {search ? 'Žiadni používatelia nenájdení' : 'Žiadni dostupní používatelia s rolou GESTOR'}
              </p>
              {!search && (
                <p className="text-sm text-gray-400 mt-2">
                  Vytvorte nového používateľa s rolou GESTOR.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vyberte gestora
                </label>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <label
                      key={user.id}
                      className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${
                        user.id === currentGestorId ? 'bg-blue-50' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="userId"
                        value={user.id}
                        checked={selectedUserId === user.id}
                        onChange={() => setSelectedUserId(user.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {user.name} {user.surname}
                          {user.id === currentGestorId && (
                            <span className="ml-2 text-xs text-blue-600">(aktuálny)</span>
                          )}
                        </p>
                        {user.email && (
                          <p className="text-sm text-gray-500">{user.email}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
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
            disabled={!selectedUserId || saving || selectedUserId === currentGestorId}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Ukladám...' : selectedUserId === currentGestorId ? 'Žiadna zmena' : 'Uložiť'}
          </button>
        </div>
      </div>
    </div>
  )
}
