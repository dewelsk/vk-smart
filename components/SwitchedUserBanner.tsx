'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface SwitchedUserBannerProps {
  switchedToName: string
  originalUsername: string
}

export default function SwitchedUserBanner({
  switchedToName,
  originalUsername,
}: SwitchedUserBannerProps) {
  const router = useRouter()
  const [switching, setSwitching] = useState(false)

  const handleSwitchBack = async () => {
    try {
      setSwitching(true)
      toast.loading('Prepinam spat...')

      const response = await fetch('/api/admin/switch-back', {
        method: 'POST',
      })

      toast.dismiss()

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || 'Chyba pri prepinani spat')
        return
      }

      const data = await response.json()
      toast.success(data.message || 'Prepnute spat')

      // Redirect to dashboard
      router.push(data.redirectTo || '/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Switch back error:', error)
      toast.dismiss()
      toast.error('Chyba pri prepinani spat')
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div
      data-testid="switched-user-banner"
      className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white py-3 px-4 shadow-lg"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="font-medium">Zobrazujete pohlad uchadzaca:</span>
            <span className="font-bold" data-testid="switched-to-name">
              {switchedToName}
            </span>
          </div>
          <span className="text-blue-200 text-sm">
            (Povodny ucet: {originalUsername})
          </span>
        </div>

        <button
          onClick={handleSwitchBack}
          disabled={switching}
          data-testid="switch-back-button"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowUturnLeftIcon className="h-5 w-5" />
          {switching ? 'Prepinam...' : 'Vratit sa spat'}
        </button>
      </div>
    </div>
  )
}
