'use client'

import { useState, useRef, KeyboardEvent, ClipboardEvent } from 'react'

interface TOTPInputProps {
    length?: number
    onComplete: (code: string) => void
    disabled?: boolean
    error?: string
}

export function TOTPInput({
    length = 6,
    onComplete,
    disabled = false,
    error
}: TOTPInputProps) {
    const [values, setValues] = useState<string[]>(Array(length).fill(''))
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    const handleChange = (index: number, value: string) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return

        const newValues = [...values]
        newValues[index] = value

        setValues(newValues)

        // Auto-focus next input
        if (value && index < length - 1) {
            inputRefs.current[index + 1]?.focus()
        }

        // Call onComplete when all fields are filled
        if (newValues.every(v => v !== '')) {
            onComplete(newValues.join(''))
        }
    }

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        // Handle backspace
        if (e.key === 'Backspace' && !values[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }

        // Handle arrow keys
        if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
        if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text/plain').trim()

        // Only allow digits
        if (!/^\d+$/.test(pastedData)) return

        const pastedValues = pastedData.slice(0, length).split('')
        const newValues = [...values]

        pastedValues.forEach((value, index) => {
            newValues[index] = value
        })

        setValues(newValues)

        // Focus last filled input or next empty
        const lastFilledIndex = Math.min(pastedValues.length - 1, length - 1)
        inputRefs.current[lastFilledIndex]?.focus()

        // Call onComplete if all filled
        if (newValues.every(v => v !== '')) {
            onComplete(newValues.join(''))
        }
    }

    return (
        <div className="space-y-2">
            <div className="flex gap-2 justify-center" data-testid="totp-input-container">
                {values.map((value, index) => (
                    <input
                        key={index}
                        ref={el => inputRefs.current[index] = el}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={value}
                        onChange={e => handleChange(index, e.target.value)}
                        onKeyDown={e => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        disabled={disabled}
                        data-testid={`totp-input-${index}`}
                        className={`
              w-12 h-14 text-center text-2xl font-semibold
              border-2 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-offset-2
              transition-colors
              ${error
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                            }
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            `}
                    />
                ))}
            </div>
            {error && (
                <p className="text-sm text-red-600 text-center" data-testid="totp-input-error">
                    {error}
                </p>
            )}
        </div>
    )
}
