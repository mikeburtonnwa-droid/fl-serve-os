'use client'

/**
 * Field Diff Viewer (F2.4)
 *
 * Visual component to display differences between:
 * - Original AI suggestions and edited values
 * - Previous artifact versions and current content
 *
 * Features:
 * - Side-by-side comparison
 * - Inline diff highlighting
 * - Character-level diff for text fields
 */

import React, { useMemo } from 'react'
import { clsx } from 'clsx'
import { ArrowRight, Plus, Minus, Equal } from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

interface FieldDiff {
  fieldId: string
  fieldLabel: string
  fieldType: string
  originalValue: unknown
  newValue: unknown
  changeType: 'added' | 'removed' | 'modified' | 'unchanged'
}

interface FieldDiffViewerProps {
  diffs: FieldDiff[]
  mode?: 'side-by-side' | 'inline'
  showUnchanged?: boolean
  className?: string
}

interface SingleDiffProps {
  diff: FieldDiff
  mode: 'side-by-side' | 'inline'
}

// =============================================================================
// Text Diff Utilities
// =============================================================================

interface DiffSegment {
  type: 'equal' | 'insert' | 'delete'
  value: string
}

/**
 * Simple word-level diff algorithm
 */
function computeWordDiff(oldText: string, newText: string): DiffSegment[] {
  const oldWords = oldText.split(/(\s+)/)
  const newWords = newText.split(/(\s+)/)

  const segments: DiffSegment[] = []
  let i = 0
  let j = 0

  while (i < oldWords.length || j < newWords.length) {
    if (i >= oldWords.length) {
      // Remaining new words are insertions
      segments.push({ type: 'insert', value: newWords[j] })
      j++
    } else if (j >= newWords.length) {
      // Remaining old words are deletions
      segments.push({ type: 'delete', value: oldWords[i] })
      i++
    } else if (oldWords[i] === newWords[j]) {
      // Equal
      segments.push({ type: 'equal', value: oldWords[i] })
      i++
      j++
    } else {
      // Look ahead to find matches
      const oldLookAhead = oldWords.slice(i, i + 5).indexOf(newWords[j])
      const newLookAhead = newWords.slice(j, j + 5).indexOf(oldWords[i])

      if (oldLookAhead > 0 && (newLookAhead < 0 || oldLookAhead <= newLookAhead)) {
        // Delete old words until we find the match
        for (let k = 0; k < oldLookAhead; k++) {
          segments.push({ type: 'delete', value: oldWords[i + k] })
        }
        i += oldLookAhead
      } else if (newLookAhead > 0) {
        // Insert new words until we find the match
        for (let k = 0; k < newLookAhead; k++) {
          segments.push({ type: 'insert', value: newWords[j + k] })
        }
        j += newLookAhead
      } else {
        // No nearby match, treat as delete + insert
        segments.push({ type: 'delete', value: oldWords[i] })
        segments.push({ type: 'insert', value: newWords[j] })
        i++
        j++
      }
    }
  }

  return segments
}

// =============================================================================
// Value Formatters
// =============================================================================

function formatValue(value: unknown, fieldType: string): string {
  if (value === null || value === undefined) {
    return '(empty)'
  }

  if (Array.isArray(value)) {
    return value.join(', ')
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }

  return String(value)
}

// =============================================================================
// Single Diff Component
// =============================================================================

function SingleDiff({ diff, mode }: SingleDiffProps) {
  const { fieldLabel, fieldType, originalValue, newValue, changeType } = diff

  const originalFormatted = formatValue(originalValue, fieldType)
  const newFormatted = formatValue(newValue, fieldType)

  // Compute text diff for modified text fields
  const textDiff = useMemo(() => {
    if (changeType !== 'modified') return null
    if (!['text', 'textarea', 'rich_text'].includes(fieldType)) return null
    if (typeof originalValue !== 'string' || typeof newValue !== 'string') return null

    return computeWordDiff(originalValue, newValue)
  }, [changeType, fieldType, originalValue, newValue])

  const changeIcon = {
    added: <Plus className="h-4 w-4 text-green-600" />,
    removed: <Minus className="h-4 w-4 text-red-600" />,
    modified: <ArrowRight className="h-4 w-4 text-blue-600" />,
    unchanged: <Equal className="h-4 w-4 text-slate-400" />,
  }[changeType]

  const changeBg = {
    added: 'bg-green-50 border-green-200',
    removed: 'bg-red-50 border-red-200',
    modified: 'bg-blue-50 border-blue-200',
    unchanged: 'bg-slate-50 border-slate-200',
  }[changeType]

  if (mode === 'side-by-side') {
    return (
      <div className={clsx('rounded-lg border p-3', changeBg)}>
        <div className="flex items-center gap-2 mb-2">
          {changeIcon}
          <span className="font-medium text-sm text-slate-900">{fieldLabel}</span>
          <span className="text-xs text-slate-500 capitalize">({changeType})</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Original */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Original</p>
            <div className={clsx(
              'p-2 rounded text-sm font-mono whitespace-pre-wrap break-words',
              changeType === 'removed' ? 'bg-red-100 text-red-800' :
              changeType === 'modified' ? 'bg-slate-100 text-slate-700' :
              'bg-slate-100 text-slate-700'
            )}>
              {originalFormatted}
            </div>
          </div>

          {/* New */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">New</p>
            <div className={clsx(
              'p-2 rounded text-sm font-mono whitespace-pre-wrap break-words',
              changeType === 'added' ? 'bg-green-100 text-green-800' :
              changeType === 'modified' ? 'bg-blue-100 text-blue-800' :
              'bg-slate-100 text-slate-700'
            )}>
              {newFormatted}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Inline mode
  return (
    <div className={clsx('rounded-lg border p-3', changeBg)}>
      <div className="flex items-center gap-2 mb-2">
        {changeIcon}
        <span className="font-medium text-sm text-slate-900">{fieldLabel}</span>
        <span className="text-xs text-slate-500 capitalize">({changeType})</span>
      </div>

      <div className="text-sm font-mono">
        {changeType === 'unchanged' && (
          <span className="text-slate-600">{originalFormatted}</span>
        )}

        {changeType === 'added' && (
          <span className="bg-green-200 text-green-900 px-1 rounded">{newFormatted}</span>
        )}

        {changeType === 'removed' && (
          <span className="bg-red-200 text-red-900 px-1 rounded line-through">{originalFormatted}</span>
        )}

        {changeType === 'modified' && textDiff && (
          <div className="whitespace-pre-wrap break-words">
            {textDiff.map((segment, i) => (
              <span
                key={i}
                className={clsx(
                  segment.type === 'delete' && 'bg-red-200 text-red-900 line-through',
                  segment.type === 'insert' && 'bg-green-200 text-green-900',
                  segment.type === 'equal' && 'text-slate-700'
                )}
              >
                {segment.value}
              </span>
            ))}
          </div>
        )}

        {changeType === 'modified' && !textDiff && (
          <div className="space-y-1">
            <div>
              <span className="bg-red-200 text-red-900 px-1 rounded line-through">
                {originalFormatted}
              </span>
            </div>
            <div>
              <span className="bg-green-200 text-green-900 px-1 rounded">
                {newFormatted}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function FieldDiffViewer({
  diffs,
  mode = 'inline',
  showUnchanged = false,
  className
}: FieldDiffViewerProps) {
  const filteredDiffs = showUnchanged
    ? diffs
    : diffs.filter(d => d.changeType !== 'unchanged')

  const stats = useMemo(() => ({
    added: diffs.filter(d => d.changeType === 'added').length,
    removed: diffs.filter(d => d.changeType === 'removed').length,
    modified: diffs.filter(d => d.changeType === 'modified').length,
    unchanged: diffs.filter(d => d.changeType === 'unchanged').length,
  }), [diffs])

  if (filteredDiffs.length === 0) {
    return (
      <div className={clsx('text-center py-8 text-slate-500', className)}>
        <Equal className="h-8 w-8 mx-auto mb-2 text-slate-400" />
        <p>No changes detected</p>
      </div>
    )
  }

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Stats Summary */}
      <div className="flex items-center gap-4 text-sm">
        {stats.added > 0 && (
          <span className="flex items-center gap-1 text-green-600">
            <Plus className="h-4 w-4" />
            {stats.added} added
          </span>
        )}
        {stats.removed > 0 && (
          <span className="flex items-center gap-1 text-red-600">
            <Minus className="h-4 w-4" />
            {stats.removed} removed
          </span>
        )}
        {stats.modified > 0 && (
          <span className="flex items-center gap-1 text-blue-600">
            <ArrowRight className="h-4 w-4" />
            {stats.modified} modified
          </span>
        )}
        {showUnchanged && stats.unchanged > 0 && (
          <span className="flex items-center gap-1 text-slate-500">
            <Equal className="h-4 w-4" />
            {stats.unchanged} unchanged
          </span>
        )}
      </div>

      {/* Diff List */}
      <div className="space-y-3">
        {filteredDiffs.map((diff) => (
          <SingleDiff key={diff.fieldId} diff={diff} mode={mode} />
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// Helper to create diffs from two content objects
// =============================================================================

export function createFieldDiffs(
  originalContent: Record<string, unknown>,
  newContent: Record<string, unknown>,
  fields: Array<{ id: string; label: string; type: string }>
): FieldDiff[] {
  const diffs: FieldDiff[] = []

  const allKeys = new Set([
    ...Object.keys(originalContent),
    ...Object.keys(newContent)
  ])

  for (const field of fields) {
    const original = originalContent[field.id]
    const newVal = newContent[field.id]

    const originalEmpty = original === null || original === undefined || original === ''
    const newEmpty = newVal === null || newVal === undefined || newVal === ''

    let changeType: FieldDiff['changeType']

    if (originalEmpty && newEmpty) {
      changeType = 'unchanged'
    } else if (originalEmpty && !newEmpty) {
      changeType = 'added'
    } else if (!originalEmpty && newEmpty) {
      changeType = 'removed'
    } else if (JSON.stringify(original) === JSON.stringify(newVal)) {
      changeType = 'unchanged'
    } else {
      changeType = 'modified'
    }

    diffs.push({
      fieldId: field.id,
      fieldLabel: field.label,
      fieldType: field.type,
      originalValue: original,
      newValue: newVal,
      changeType
    })
  }

  return diffs
}

export default FieldDiffViewer
