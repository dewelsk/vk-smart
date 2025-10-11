'use client'

import React from 'react'
import ReactDatePicker, { registerLocale } from 'react-datepicker'
import { sk } from 'date-fns/locale/sk'
import 'react-datepicker/dist/react-datepicker.css'

// Register Slovak locale
registerLocale('sk', sk)

interface DateTimePickerProps {
  value: Date | null
  onChange: (date: Date | null) => void
  error?: string
  disabled?: boolean
  'data-testid'?: string
  minDate?: Date
  placeholder?: string
}

export default function DateTimePicker({
  value,
  onChange,
  error,
  disabled = false,
  'data-testid': dataTestId,
  minDate,
  placeholder = 'Vyberte dátum a čas'
}: DateTimePickerProps) {
  return (
    <div className="w-full">
      <ReactDatePicker
        selected={value}
        onChange={onChange}
        showTimeSelect
        timeFormat="HH:mm"
        timeIntervals={15}
        dateFormat="dd.MM.yyyy HH:mm"
        locale="sk"
        disabled={disabled}
        minDate={minDate}
        placeholderText={placeholder}
        data-testid={dataTestId}
        className={`
          w-full px-3 py-2 border rounded-md
          text-sm
          focus:outline-none focus:ring-2
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${
            error
              ? 'border-red-500 focus:ring-red-200'
              : 'border-gray-300 focus:ring-blue-200'
          }
        `}
        wrapperClassName="w-full"
        calendarClassName="shadow-lg border border-gray-200 rounded-lg"
      />
      {error && (
        <p className="mt-2 text-sm text-red-600" data-testid={`${dataTestId}-error`}>
          {error}
        </p>
      )}
    </div>
  )
}
