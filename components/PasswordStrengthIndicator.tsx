'use client'

import { useMemo } from 'react'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface PasswordStrengthIndicatorProps {
    password: string
    showRequirements?: boolean
}

interface PasswordRequirement {
    label: string
    test: (password: string) => boolean
}

export function PasswordStrengthIndicator({
    password,
    showRequirements = true
}: PasswordStrengthIndicatorProps) {
    const requirements: PasswordRequirement[] = [
        {
            label: 'Aspoň 8 znakov',
            test: (pwd) => pwd.length >= 8,
        },
        {
            label: 'Veľké písmeno (A-Z)',
            test: (pwd) => /[A-Z]/.test(pwd),
        },
        {
            label: 'Malé písmeno (a-z)',
            test: (pwd) => /[a-z]/.test(pwd),
        },
        {
            label: 'Číslo (0-9)',
            test: (pwd) => /\d/.test(pwd),
        },
        {
            label: 'Špeciálny znak (!@#$%...)',
            test: (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
        },
    ]

    const { strength, metRequirements, strengthLabel, strengthColor } = useMemo(() => {
        const met = requirements.filter(req => req.test(password)).length
        const total = requirements.length
        const strengthValue = (met / total) * 100

        let label = ''
        let color = ''

        if (strengthValue === 0) {
            label = ''
            color = 'bg-gray-200'
        } else if (strengthValue < 40) {
            label = 'Slabé'
            color = 'bg-red-500'
        } else if (strengthValue < 60) {
            label = 'Priemerné'
            color = 'bg-yellow-500'
        } else if (strengthValue < 80) {
            label = 'Dobré'
            color = 'bg-blue-500'
        } else {
            label = 'Silné'
            color = 'bg-green-500'
        }

        return {
            strength: strengthValue,
            metRequirements: met,
            strengthLabel: label,
            strengthColor: color,
        }
    }, [password])

    if (!password) return null

    return (
        <div className="space-y-3" data-testid="password-strength-indicator">
            {/* Strength bar */}
            <div>
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">
                        Sila hesla
                    </span>
                    {strengthLabel && (
                        <span className="text-sm font-medium text-gray-900">
                            {strengthLabel}
                        </span>
                    )}
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${strengthColor}`}
                        style={{ width: `${strength}%` }}
                        data-testid="strength-bar"
                    />
                </div>
            </div>

            {/* Requirements checklist */}
            {showRequirements && (
                <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                        Požiadavky na heslo:
                    </p>
                    {requirements.map((req, index) => {
                        const isMet = req.test(password)
                        return (
                            <div
                                key={index}
                                className="flex items-center gap-2 text-sm"
                                data-testid={`requirement-${index}`}
                            >
                                {isMet ? (
                                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                ) : (
                                    <XCircleIcon className="w-4 h-4 text-gray-400" />
                                )}
                                <span className={isMet ? 'text-green-700' : 'text-gray-600'}>
                                    {req.label}
                                </span>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
