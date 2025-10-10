'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { UserRole } from '@prisma/client'
import Select from 'react-select'

type RoleAssignmentModalProps = {
  userId: string
  currentUserRole: UserRole
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'GESTOR', label: 'Gestor' },
  { value: 'KOMISIA', label: 'Komisia' },
]

export function RoleAssignmentModal({
  userId,
  currentUserRole,
  isOpen,
  onClose,
  onSuccess,
}: RoleAssignmentModalProps) {
  const [role, setRole] = useState<{ value: string; label: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Available roles depend on current user's role
  const availableRoles = currentUserRole === 'SUPERADMIN'
    ? [{ value: 'SUPERADMIN', label: 'Superadmin' }, ...ROLE_OPTIONS]
    : ROLE_OPTIONS

  useEffect(() => {
    if (isOpen) {
      // Reset form
      setRole(null)
      setError('')
    }
  }, [isOpen])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!role) {
      setError('Rola je povinná')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: role.value,
          // Institution will be auto-inherited from user's existing roles
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Nepodarilo sa priradiť rolu')
        return
      }

      // Success
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Failed to assign role:', error)
      setError('Nepodarilo sa priradiť rolu')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      data-testid="role-assignment-modal"
    >
      <div className="bg-white rounded-lg max-w-lg w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900" data-testid="modal-title">
            Pridať rolu
          </h2>
          <button
            onClick={onClose}
            data-testid="close-modal-button"
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {error && (
            <div
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded"
              data-testid="error-message"
            >
              {error}
            </div>
          )}

          {/* Role Select */}
          <div>
            <label htmlFor="role-select" className="block text-sm font-medium text-gray-700 mb-2">
              Rola <span className="text-red-500">*</span>
            </label>
            <Select
              inputId="role-select"
              value={role}
              onChange={(selected) => setRole(selected)}
              options={availableRoles}
              className="basic-select"
              classNamePrefix="select"
              placeholder="Vyberte rolu..."
              isDisabled={saving}
            />
          </div>

          {/* Institution Select - Hidden (auto-inherited from existing roles) */}
          {/*
            Institution is now automatically inherited from user's existing roles.
            If user has no roles yet, institution will be set to null (global role).
            See zadanie/multirole.md for details.
          */}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              data-testid="cancel-button"
              className="flex-1 px-4 py-2 text-sm font-medium border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Zrušiť
            </button>
            <button
              type="submit"
              disabled={saving || !role}
              data-testid="assign-role-button"
              className="flex-1 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Priraďujem...' : 'Priradiť rolu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
