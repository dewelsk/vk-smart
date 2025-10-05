'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

type User = {
  id: string
  name: string
  surname: string
  email: string | null
  active: boolean
}

type AddCommissionMemberModalProps = {
  vkId: string
  onClose: () => void
  onSuccess: () => void
  existingMemberIds: string[]
}

export function AddCommissionMemberModal({
  vkId,
  onClose,
  onSuccess,
  existingMemberIds
}: AddCommissionMemberModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isChairman, setIsChairman] = useState(false)

  useEffect(() => {
    fetchKomisiaUsers()
  }, [])

  async function fetchKomisiaUsers() {
    try {
      const res = await fetch('/api/admin/users?role=KOMISIA&status=active')
      const data = await res.json()

      if (data.users) {
        // Filter out users already in commission
        const availableUsers = data.users.filter(
          (user: User) => !existingMemberIds.includes(user.id)
        )
        setUsers(availableUsers)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    if (!selectedUserId) return

    setAdding(true)
    try {
      const res = await fetch(`/api/admin/vk/${vkId}/commission/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          isChairman
        })
      })

      if (res.ok) {
        onSuccess()
        onClose()
      } else {
        const data = await res.json()
        alert(data.error || 'Chyba pri pridávaní člena')
      }
    } catch (error) {
      console.error('Error adding member:', error)
      alert('Chyba pri pridávaní člena')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Pridať člena komisie
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              Načítavam používateľov...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Žiadni dostupní používatelia s rolou KOMISIA</p>
              <p className="text-sm text-gray-400 mt-2">
                Všetci aktívni používatelia s rolou KOMISIA sú už v komisii.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vyberte člena komisie
                </label>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-64 overflow-y-auto">
                  {users.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="userId"
                        value={user.id}
                        checked={selectedUserId === user.id}
                        onChange={() => setSelectedUserId(user.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <div className="ml-3">
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

              {selectedUserId && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isChairman"
                    checked={isChairman}
                    onChange={(e) => setIsChairman(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="isChairman"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Nastaviť ako predsedu komisie
                  </label>
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
            onClick={handleAdd}
            disabled={!selectedUserId || adding}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adding ? 'Pridávam...' : 'Pridať'}
          </button>
        </div>
      </div>
    </div>
  )
}
