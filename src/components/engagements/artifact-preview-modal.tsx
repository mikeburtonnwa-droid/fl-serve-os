'use client'

/**
 * Artifact Preview Modal (F2.2)
 *
 * Displays AI-suggested artifact content with:
 * - Field-by-field preview with template labels
 * - Editable fields before creation
 * - Visual indicators for coerced/warning fields
 * - Unsaved changes confirmation
 *
 * User Stories: US-009, US-010
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { X, AlertTriangle, CheckCircle2, Edit3, Save, RotateCcw, AlertCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getTemplate, type TemplateField } from '@/lib/templates'
import {
  mapAISuggestionToTemplate,
  type FieldMappingResult,
  getMappingSummary
} from '@/lib/field-mapper'
import { TEMPLATE_METADATA, type TemplateId } from '@/lib/workflow'
import { clsx } from 'clsx'

// =============================================================================
// Types
// =============================================================================

interface ArtifactPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (content: Record<string, unknown>) => void
  templateId: TemplateId
  suggestedContent: Record<string, unknown>
  action: 'create' | 'update'
}

interface EditableFieldProps {
  field: TemplateField
  fieldResult: FieldMappingResult | undefined
  value: unknown
  onChange: (value: unknown) => void
  hasChanged: boolean
}

// =============================================================================
// Editable Field Component
// =============================================================================

function EditableField({
  field,
  fieldResult,
  value,
  onChange,
  hasChanged
}: EditableFieldProps) {
  const hasWarning = fieldResult?.warning && !fieldResult?.errorMessage
  const hasError = fieldResult?.errorMessage || (field.required && (value === null || value === undefined || value === ''))
  const wasCoerced = fieldResult?.wasCoerced

  const inputClassName = clsx(
    'w-full rounded-md border px-3 py-2 text-sm transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-offset-0',
    hasError && 'border-red-300 bg-red-50 focus:ring-red-500',
    hasWarning && !hasError && 'border-yellow-300 bg-yellow-50 focus:ring-yellow-500',
    hasChanged && !hasError && !hasWarning && 'border-blue-300 bg-blue-50 focus:ring-blue-500',
    !hasError && !hasWarning && !hasChanged && 'border-slate-300 focus:ring-teal-500'
  )

  const renderInput = () => {
    switch (field.type) {
      case 'textarea':
      case 'rich_text':
        return (
          <textarea
            className={clsx(inputClassName, 'min-h-[100px] resize-y')}
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={4}
          />
        )

      case 'number':
        return (
          <input
            type="number"
            className={inputClassName}
            value={value as number || ''}
            onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
            placeholder={field.placeholder}
          />
        )

      case 'select':
        return (
          <select
            className={inputClassName}
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">Select an option...</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      case 'multiselect':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(value as string[] || []).includes(option)}
                  onChange={(e) => {
                    const current = (value as string[] || [])
                    if (e.target.checked) {
                      onChange([...current, option])
                    } else {
                      onChange(current.filter(v => v !== option))
                    }
                  }}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-slate-700">{option}</span>
              </label>
            ))}
          </div>
        )

      case 'checkbox':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value as boolean || false}
              onChange={(e) => onChange(e.target.checked)}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-slate-700">{field.label}</span>
          </label>
        )

      case 'date':
        return (
          <input
            type="date"
            className={inputClassName}
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        )

      default:
        return (
          <input
            type="text"
            className={inputClassName}
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        )
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="flex items-center gap-1">
          {wasCoerced && (
            <Badge variant="warning" size="sm" className="text-xs">
              <Info className="h-3 w-3 mr-1" />
              Mapped
            </Badge>
          )}
          {hasChanged && (
            <Badge variant="info" size="sm" className="text-xs">
              <Edit3 className="h-3 w-3 mr-1" />
              Edited
            </Badge>
          )}
        </div>
      </div>

      {renderInput()}

      {/* Help text */}
      {field.helpText && !hasError && !hasWarning && (
        <p className="text-xs text-slate-500">{field.helpText}</p>
      )}

      {/* Warning message */}
      {hasWarning && !hasError && (
        <p className="text-xs text-yellow-600 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {fieldResult?.warning}
        </p>
      )}

      {/* Error message */}
      {hasError && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {fieldResult?.errorMessage || `${field.label} is required`}
        </p>
      )}
    </div>
  )
}

// =============================================================================
// Confirmation Dialog
// =============================================================================

function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel
}: {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Discard changes?</h3>
        <p className="text-sm text-slate-600 mb-4">
          You have unsaved edits. Are you sure you want to close without saving?
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Stay
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Discard
          </Button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Main Modal Component
// =============================================================================

export function ArtifactPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  templateId,
  suggestedContent,
  action
}: ArtifactPreviewModalProps) {
  // Map the AI suggestion to template fields
  const mappingResult = useMemo(() =>
    mapAISuggestionToTemplate(templateId, suggestedContent),
    [templateId, suggestedContent]
  )

  // Track editable content (starts from mapped content)
  // Initialize with mapped content directly - subsequent updates handled via effect
  const [editedContent, setEditedContent] = useState<Record<string, unknown>>(() => mappingResult.mappedContent)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // Sync edited content when mappingResult changes (e.g., different artifact selected)
  // Using eslint-disable since this is an intentional sync pattern
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditedContent(mappingResult.mappedContent)
  }, [mappingResult.mappedContent])

  // Get template for field definitions
  const template = useMemo(() => getTemplate(templateId), [templateId])
  const meta = TEMPLATE_METADATA[templateId]

  // Check if content has been edited
  const hasChanges = useMemo(() => {
    return JSON.stringify(editedContent) !== JSON.stringify(mappingResult.mappedContent)
  }, [editedContent, mappingResult.mappedContent])

  // Get mapping summary
  const summary = useMemo(() => getMappingSummary(mappingResult), [mappingResult])

  // Check if form is valid
  const isValid = useMemo(() => {
    if (!template) return false

    for (const field of template.fields) {
      if (field.required) {
        const value = editedContent[field.id]
        if (value === null || value === undefined || value === '' ||
            (Array.isArray(value) && value.length === 0)) {
          return false
        }
      }
    }
    return true
  }, [template, editedContent])

  // Handle field change
  const handleFieldChange = useCallback((fieldId: string, value: unknown) => {
    setEditedContent(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }, [])

  // Handle close with confirmation
  const handleClose = useCallback(() => {
    if (hasChanges) {
      setShowConfirmDialog(true)
    } else {
      onClose()
    }
  }, [hasChanges, onClose])

  // Handle confirm discard
  const handleConfirmDiscard = useCallback(() => {
    setShowConfirmDialog(false)
    onClose()
  }, [onClose])

  // Handle reset to original
  const handleReset = useCallback(() => {
    setEditedContent(mappingResult.mappedContent)
  }, [mappingResult.mappedContent])

  // Handle save/confirm
  const handleSave = useCallback(() => {
    onConfirm(editedContent)
  }, [editedContent, onConfirm])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  if (!isOpen || !template) return null

  // Group fields by section
  const fieldsBySection = template.fields.reduce((acc, field) => {
    const section = field.section || 'General'
    if (!acc[section]) acc[section] = []
    acc[section].push(field)
    return acc
  }, {} as Record<string, TemplateField[]>)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 z-50 flex items-start justify-center overflow-y-auto py-8">
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-3xl animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">
                  {action === 'update' ? 'Update' : 'Create'} {meta.name}
                </h2>
                <Badge variant={meta.tier === 'T2' ? 'warning' : 'default'}>
                  {meta.tier}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 mt-1">{meta.description}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Mapping Summary */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {summary.mappedFields} mapped
                </span>
                {summary.coercedFields > 0 && (
                  <span className="flex items-center gap-1 text-yellow-600">
                    <AlertTriangle className="h-4 w-4" />
                    {summary.coercedFields} auto-corrected
                  </span>
                )}
                {summary.missingFields > 0 && (
                  <span className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {summary.missingFields} missing
                  </span>
                )}
              </div>
              {hasChanges && (
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              )}
            </div>

            {/* Warnings */}
            {mappingResult.warnings.length > 0 && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-xs font-medium text-yellow-800 mb-1">Mapping Notes:</p>
                <ul className="text-xs text-yellow-700 space-y-0.5">
                  {mappingResult.warnings.slice(0, 3).map((warning, i) => (
                    <li key={i}>• {warning}</li>
                  ))}
                  {mappingResult.warnings.length > 3 && (
                    <li>• ...and {mappingResult.warnings.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-6">
              {Object.entries(fieldsBySection).map(([section, fields]) => (
                <div key={section}>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100">
                    {section}
                  </h3>
                  <div className="space-y-4">
                    {fields.map((field) => {
                      const fieldResult = mappingResult.fieldResults.find(f => f.fieldId === field.id)
                      const currentValue = editedContent[field.id]
                      const originalValue = mappingResult.mappedContent[field.id]
                      const hasChanged = JSON.stringify(currentValue) !== JSON.stringify(originalValue)

                      return (
                        <EditableField
                          key={field.id}
                          field={field}
                          fieldResult={fieldResult}
                          value={currentValue}
                          onChange={(value) => handleFieldChange(field.id, value)}
                          hasChanged={hasChanged}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
            <div className="text-sm text-slate-500">
              {hasChanges ? (
                <span className="text-blue-600">You have unsaved changes</span>
              ) : (
                <span>Review and edit fields as needed</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isValid}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {action === 'update' ? 'Update Artifact' : 'Create Artifact'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onConfirm={handleConfirmDiscard}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </>
  )
}

export default ArtifactPreviewModal
