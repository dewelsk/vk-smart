'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'

interface SecuritySettingsFormProps {
  initialSettings: {
    id: string
    maxFailedAttempts: number
    blockDurationMinutes: number
    blockWindowMinutes: number
    updatedAt: string
    updatedBy: {
      id: string
      name: string
      surname: string
      email: string | null
    } | null
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleString('sk-SK')
}

export default function SecuritySettingsForm({ initialSettings }: SecuritySettingsFormProps) {
  const [maxFailedAttempts, setMaxFailedAttempts] = useState(initialSettings.maxFailedAttempts)
  const [blockDurationMinutes, setBlockDurationMinutes] = useState(initialSettings.blockDurationMinutes)
  const [blockWindowMinutes, setBlockWindowMinutes] = useState(initialSettings.blockWindowMinutes)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [updatedAt, setUpdatedAt] = useState(initialSettings.updatedAt)
  const [updatedBy, setUpdatedBy] = useState(initialSettings.updatedBy)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (maxFailedAttempts < 1) {
      toast.error('Počet pokusov musí byť aspoň 1')
      return
    }

    if (blockDurationMinutes < 1) {
      toast.error('Dĺžka blokácie musí byť aspoň 1 minúta')
      return
    }

    if (blockWindowMinutes < 1) {
      toast.error('Časové okno musí byť aspoň 1 minúta')
      return
    }

    setIsSubmitting(true)
    toast.loading('Ukladám nastavenia...')

    try {
      const response = await fetch('/api/admin/settings/security', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxFailedAttempts,
          blockDurationMinutes,
          blockWindowMinutes,
        }),
      })

      const data = await response.json()
      toast.dismiss()

      if (!response.ok) {
        toast.error(data.error || 'Nastavenie sa nepodarilo uložiť')
        return
      }

      toast.success('Nastavenia boli aktualizované')
      setUpdatedAt(data.settings.updatedAt)
      setUpdatedBy(data.settings.updatedBy ?? null)
    } catch (error) {
      console.error('Failed to update security settings', error)
      toast.dismiss()
      toast.error('Nastavenie sa nepodarilo uložiť')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="bg-white shadow-sm border border-gray-200 rounded-lg" data-testid="security-settings-card">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Blokovanie po neúspešných pokusoch</h2>
        <p className="mt-1 text-sm text-gray-600">
          Definuje, koľko neúspešných pokusov o prihlásenie je povolených a na ako dlho sa účet zablokuje.
        </p>
      </div>

      <form className="px-6 py-6 space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-3" data-testid="security-settings-fields">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Maximálny počet neúspešných pokusov</span>
            <input
              type="number"
              min={1}
              value={maxFailedAttempts}
              onChange={(event) => setMaxFailedAttempts(Number(event.target.value))}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
              data-testid="input-max-failed-attempts"
            />
            <span className="text-xs text-gray-500">
              Po prekročení tohto počtu bude účet dočasne zablokovaný.
            </span>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Dĺžka blokácie (v minútach)</span>
            <input
              type="number"
              min={1}
              value={blockDurationMinutes}
              onChange={(event) => setBlockDurationMinutes(Number(event.target.value))}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
              data-testid="input-block-duration"
            />
            <span className="text-xs text-gray-500">
              Ako dlho zostane účet zablokovaný po prekročení limitu.
            </span>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Časové okno (v minútach)</span>
            <input
              type="number"
              min={1}
              value={blockWindowMinutes}
              onChange={(event) => setBlockWindowMinutes(Number(event.target.value))}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
              data-testid="input-block-window"
            />
            <span className="text-xs text-gray-500">
              Počet pokusov sa bude sledovať v rámci tohto časového obdobia.
            </span>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            <div>Aktualizované: {formatDate(updatedAt)}</div>
            {updatedBy && (
              <div>
                Zmenil: {updatedBy.name} {updatedBy.surname}
                {updatedBy.email ? ` (${updatedBy.email})` : ''}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm ${
              isSubmitting
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
            }`}
            data-testid="submit-security-settings"
          >
            {isSubmitting ? 'Ukladám...' : 'Uložiť nastavenia'}
          </button>
        </div>
      </form>
    </section>
  )
}
