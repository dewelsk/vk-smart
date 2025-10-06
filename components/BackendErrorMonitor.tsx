'use client'

import { useEffect } from 'react'
import { useToast } from '@/components/Toast'

// Globálne premenné na sledovanie chýb
let errorCount = 0
let lastErrorTime = 0
let lastToastShown = 0
const ERROR_THRESHOLD = 3 // Počet chýb pred zobrazením upozornenia
const ERROR_WINDOW = 60000 // 60 sekúnd
const TOAST_COOLDOWN = 15000 // 15 sekúnd medzi toast notifikáciami

// Globálna funkcia na reportovanie chýb
export function reportBackendError(error: any) {
  const now = Date.now()

  // Reset počítadla ak uplynulo viac ako ERROR_WINDOW
  if (now - lastErrorTime > ERROR_WINDOW) {
    errorCount = 0
  }

  errorCount++
  lastErrorTime = now

  console.log(`Backend error count: ${errorCount}/${ERROR_THRESHOLD}`, error)

  // Trigger custom event len ak uplynulo dosť času od posledného toastu
  if (errorCount >= ERROR_THRESHOLD && (now - lastToastShown) >= TOAST_COOLDOWN) {
    window.dispatchEvent(new CustomEvent('backend-error-threshold', {
      detail: { errorCount, error }
    }))
    lastToastShown = now
    errorCount = 0 // Reset po zobrazení
  }
}

export function BackendErrorMonitor() {
  const { showError } = useToast()

  useEffect(() => {
    const handleBackendError = (event: any) => {
      showError(
        'Aplikácia nemôže komunikovať so serverom. Skontrolujte internetové pripojenie a obnovte stránku.',
        15000 // 15 sekúnd
      )
    }

    window.addEventListener('backend-error-threshold', handleBackendError)

    return () => {
      window.removeEventListener('backend-error-threshold', handleBackendError)
    }
  }, [showError])

  return null
}
