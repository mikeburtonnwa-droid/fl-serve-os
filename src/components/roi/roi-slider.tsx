/**
 * ROI Slider Component (F6.1)
 *
 * Interactive slider with direct value editing for ROI inputs.
 *
 * User Stories: US-024, US-025
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { HelpCircle } from 'lucide-react'
import type { SliderConfig } from '@/lib/roi'

interface ROISliderProps {
  config: SliderConfig
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

export function ROISlider({
  config,
  value,
  onChange,
  disabled = false,
}: ROISliderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(String(value))
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Derive edit value from prop when not editing (controlled behavior)
  const displayEditValue = isEditing ? editValue : String(value)

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)
    onChange(newValue)
    setError(null)
  }

  const handleValueClick = () => {
    if (!disabled) {
      setIsEditing(true)
      setEditValue(String(value))
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value)
    setError(null)
  }

  const handleInputBlur = () => {
    validateAndApply()
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      validateAndApply()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setEditValue(String(value))
      setError(null)
    }
  }

  const validateAndApply = () => {
    const parsed = parseFloat(editValue)

    if (isNaN(parsed)) {
      setError('Please enter a valid number')
      return
    }

    if (parsed < config.min || parsed > config.max) {
      setError(`Value must be between ${config.min} and ${config.max}`)
      return
    }

    // Round to step
    const rounded = Math.round(parsed / config.step) * config.step
    onChange(rounded)
    setIsEditing(false)
    setError(null)
  }

  const formatDisplayValue = (val: number): string => {
    if (config.prefix) {
      return `${config.prefix}${val.toLocaleString()}`
    }
    if (config.suffix) {
      return `${val.toLocaleString()}${config.suffix}`
    }
    return val.toLocaleString()
  }

  // Calculate percentage for slider fill
  const percentage = ((value - config.min) / (config.max - config.min)) * 100

  return (
    <div className={`space-y-2 ${disabled ? 'opacity-50' : ''}`}>
      {/* Label and Value */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">
            {config.label}
          </label>
          {config.helpText && (
            <div className="group relative">
              <HelpCircle className="h-4 w-4 text-slate-400 cursor-help" />
              <div className="absolute left-0 top-full mt-1 z-10 hidden group-hover:block w-64 p-2 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg shadow-lg">
                {config.helpText}
              </div>
            </div>
          )}
        </div>

        {/* Editable Value */}
        {isEditing ? (
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={displayEditValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              className={`w-24 px-2 py-1 text-right text-sm font-semibold rounded border ${
                error
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-blue-300 focus:ring-blue-500'
              } focus:outline-none focus:ring-2`}
              disabled={disabled}
            />
            {error && (
              <div className="absolute right-0 top-full mt-1 text-xs text-red-600 whitespace-nowrap">
                {error}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleValueClick}
            disabled={disabled}
            className="px-2 py-1 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
            title="Click to edit"
          >
            {formatDisplayValue(value)}
          </button>
        )}
      </div>

      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min={config.min}
          max={config.max}
          step={config.step}
          value={value}
          onChange={handleSliderChange}
          disabled={disabled}
          className="w-full h-2 appearance-none bg-transparent cursor-pointer disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`,
            borderRadius: '4px',
          }}
        />
      </div>

      {/* Min/Max labels */}
      <div className="flex justify-between text-xs text-slate-400">
        <span>
          {config.prefix}
          {config.min.toLocaleString()}
          {config.suffix}
        </span>
        <span>
          {config.prefix}
          {config.max.toLocaleString()}
          {config.suffix}
        </span>
      </div>
    </div>
  )
}

// =============================================================================
// Slider styles (add to global CSS or use styled-jsx)
// =============================================================================

// Note: Add these styles to your global CSS for custom slider appearance:
// input[type='range']::-webkit-slider-thumb {
//   -webkit-appearance: none;
//   appearance: none;
//   width: 20px;
//   height: 20px;
//   background: white;
//   border: 2px solid #3b82f6;
//   border-radius: 50%;
//   cursor: pointer;
//   box-shadow: 0 2px 4px rgba(0,0,0,0.1);
// }
//
// input[type='range']::-moz-range-thumb {
//   width: 20px;
//   height: 20px;
//   background: white;
//   border: 2px solid #3b82f6;
//   border-radius: 50%;
//   cursor: pointer;
//   box-shadow: 0 2px 4px rgba(0,0,0,0.1);
// }
