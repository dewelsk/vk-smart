'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/components/Toast'

type User = {
  id: string
  name: string
  surname: string
  email: string | null
  active: boolean
}

type ExistingMember = {
  userId: string
  isChairman: boolean
}

type AddCommissionMemberModalProps = {
  vkId: string
  onClose: () => void
  onSuccess: () => void
  existingMembers: ExistingMember[]
}

export function AddCommissionMemberModal({
  vkId,
  onClose,
  onSuccess,
  existingMembers
}: AddCommissionMemberModalProps) {
  const { showError, showSuccess } = useToast()
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [chairmanId, setChairmanId] = useState<string | null>(null)

  // Initialize with existing members
  useEffect(() => {
    console.log('Initializing modal with existing members:', existingMembers)
    const existingIds = new Set(existingMembers.map(m => m.userId))
    console.log('Setting selectedUserIds to:', Array.from(existingIds))
    setSelectedUserIds(existingIds)

    const existingChairman = existingMembers.find(m => m.isChairman)
    if (existingChairman) {
      console.log('Setting chairman to:', existingChairman.userId)
      setChairmanId(existingChairman.userId)
    }
  }, [existingMembers])

  useEffect(() => {
    fetchKomisiaUsers()
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

  async function fetchKomisiaUsers() {
    try {
      const res = await fetch('/api/admin/users?roles=KOMISIA&status=active&limit=1000')
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

  function toggleUser(userId: string) {
    const newSelected = new Set(selectedUserIds)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
      // If removing chairman, clear chairman
      if (chairmanId === userId) {
        setChairmanId(null)
      }
    } else {
      newSelected.add(userId)
    }
    setSelectedUserIds(newSelected)
  }

  function handleChairmanChange(userId: string) {
    // Only allow setting chairman if user is selected
    if (selectedUserIds.has(userId)) {
      setChairmanId(userId)
    }
  }

  async function handleSave() {
    if (selectedUserIds.size === 0) return

    setAdding(true)
    try {
      const res = await fetch(`/api/admin/vk/${vkId}/commission/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: Array.from(selectedUserIds),
          chairmanId
        })
      })

      if (res.ok) {
        showSuccess('Komisia bola úspešne uložená')
        onSuccess()
        onClose()
      } else {
        const data = await res.json()
        showError(data.error || 'Chyba pri ukladaní komisie')
      }
    } catch (error) {
      console.error('Error saving commission:', error)
      showError('Problém s pripojením k databáze. Skontrolujte internetové pripojenie.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div id="commission-modal" className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 id="commission-modal-title" className="text-lg font-semibold text-gray-900">
              Správa komisie
            </h3>
            <p id="commission-member-count" className="text-sm text-gray-500 mt-1">
              {selectedUserIds.size} {selectedUserIds.size === 1 ? 'člen' : selectedUserIds.size >= 2 && selectedUserIds.size <= 4 ? 'členovia' : 'členov'}
            </p>
          </div>
          <button
            id="commission-modal-close"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="commission-search"
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
                {search ? 'Žiadni používatelia nenájdení' : 'Žiadni dostupní používatelia s rolou KOMISIA'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredUsers.map((user) => {
                const isSelected = selectedUserIds.has(user.id)
                const isChairman = chairmanId === user.id

                // Debug: Log checkbox state for first user
                if (user === filteredUsers[0]) {
                  console.log('First user checkbox state:', {
                    userId: user.id,
                    isSelected,
                    selectedUserIds: Array.from(selectedUserIds),
                    existingMembers
                  })
                }

                return (
                  <div
                    key={user.id}
                    data-user-id={user.id}
                    className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {/* Checkbox for member selection */}
                    <label className="flex items-center gap-3 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        data-testid={`member-checkbox-${user.id}`}
                        checked={isSelected}
                        onChange={() => toggleUser(user.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.name} {user.surname}
                        </p>
                        {user.email && (
                          <p className="text-xs text-gray-500">{user.email}</p>
                        )}
                      </div>
                    </label>

                    {/* Radio for chairman */}
                    <label
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium cursor-pointer transition-colors ${
                        isChairman
                          ? 'bg-purple-100 border-purple-300 text-purple-800'
                          : isSelected
                          ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <input
                        type="radio"
                        name="chairman"
                        data-testid={`chairman-radio-${user.id}`}
                        checked={isChairman}
                        onChange={() => handleChairmanChange(user.id)}
                        disabled={!isSelected}
                        className="h-3 w-3 text-purple-600 focus:ring-purple-500 border-gray-300"
                      />
                      Predseda
                    </label>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center gap-3 p-6 border-t border-gray-200">
          <div id="commission-validation-message" className="text-sm text-gray-600">
            {chairmanId ? (
              <span className="text-purple-700">
                ✓ Predseda zvolený
              </span>
            ) : selectedUserIds.size > 0 ? (
              <span className="text-orange-600">
                ⚠ Nebol zvolený predseda
              </span>
            ) : null}
          </div>
          <div className="flex gap-3">
            <button
              id="commission-cancel-btn"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Zrušiť
            </button>
            <button
              id="commission-save-btn"
              onClick={handleSave}
              disabled={selectedUserIds.size === 0 || adding}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adding ? 'Ukladám...' : 'Uložiť komisiu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
