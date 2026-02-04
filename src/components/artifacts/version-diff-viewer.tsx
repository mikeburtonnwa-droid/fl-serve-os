/**
 * Version Diff Viewer (F5.3)
 *
 * Side-by-side diff visualization for comparing artifact versions.
 *
 * User Stories: US-022
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  RotateCcw,
  Plus,
  Minus,
  Edit3,
  FileText,
  Loader2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { format } from 'date-fns'
import type { ArtifactVersion, VersionDiff, FieldDiff } from '@/lib/versions'
import { formatValueForDisplay } from '@/lib/versions'

interface VersionDiffViewerProps {
  diff: VersionDiff
  versionFrom: ArtifactVersion
  versionTo: ArtifactVersion
  onClose: () => void
  onRestore: (versionNumber: number) => Promise<void>
  currentVersion: number
}

export function VersionDiffViewer({
  diff,
  versionFrom,
  versionTo,
  onClose,
  onRestore,
  currentVersion,
}: VersionDiffViewerProps) {
  const [restoring, setRestoring] = useState(false)
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set())

  const toggleField = (fieldId: string) => {
    setExpandedFields((prev) => {
      const next = new Set(prev)
      if (next.has(fieldId)) {
        next.delete(fieldId)
      } else {
        next.add(fieldId)
      }
      return next
    })
  }

  const handleRestore = async (versionNumber: number) => {
    setRestoring(true)
    try {
      await onRestore(versionNumber)
      onClose()
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to History
          </Button>
          {versionFrom.version_number !== currentVersion && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRestore(versionFrom.version_number)}
              disabled={restoring}
            >
              {restoring ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Restore v{versionFrom.version_number}
            </Button>
          )}
        </div>

        {/* Version headers */}
        <div className="grid grid-cols-2 gap-4">
          <VersionHeader version={versionFrom} label="From" />
          <VersionHeader version={versionTo} label="To" />
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-700">Changes:</span>
          <div className="flex items-center gap-2">
            {diff.addedFields > 0 && (
              <Badge variant="success" size="sm" className="gap-1">
                <Plus className="h-3 w-3" />
                {diff.addedFields} added
              </Badge>
            )}
            {diff.modifiedFields > 0 && (
              <Badge variant="warning" size="sm" className="gap-1">
                <Edit3 className="h-3 w-3" />
                {diff.modifiedFields} modified
              </Badge>
            )}
            {diff.removedFields > 0 && (
              <Badge variant="destructive" size="sm" className="gap-1">
                <Minus className="h-3 w-3" />
                {diff.removedFields} removed
              </Badge>
            )}
            {diff.nameChanged && (
              <Badge variant="default" size="sm" className="gap-1">
                <FileText className="h-3 w-3" />
                name changed
              </Badge>
            )}
            {diff.totalChanges === 0 && !diff.nameChanged && (
              <span className="text-sm text-slate-500">No changes</span>
            )}
          </div>
        </div>
      </div>

      {/* Diff content */}
      <div className="flex-1 overflow-auto">
        {/* Name change */}
        {diff.nameChanged && diff.nameDiff && (
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-slate-500" />
              <span className="font-medium text-slate-700">Artifact Name</span>
              <Badge variant="default" size="sm">
                Changed
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <span className="text-sm text-red-800 line-through">
                  {diff.nameDiff.oldName}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <span className="text-sm text-green-800">{diff.nameDiff.newName}</span>
              </div>
            </div>
          </div>
        )}

        {/* Field changes */}
        {diff.fieldChanges.map((fieldDiff) => (
          <FieldDiffRow
            key={fieldDiff.fieldId}
            fieldDiff={fieldDiff}
            isExpanded={expandedFields.has(fieldDiff.fieldId)}
            onToggle={() => toggleField(fieldDiff.fieldId)}
          />
        ))}

        {/* No changes message */}
        {diff.totalChanges === 0 && !diff.nameChanged && (
          <div className="p-8 text-center">
            <div className="p-4 rounded-full bg-slate-100 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">No Changes</h3>
            <p className="text-sm text-slate-500">
              These versions have identical content
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Version Header Component
// =============================================================================

interface VersionHeaderProps {
  version: ArtifactVersion
  label: string
}

function VersionHeader({ version, label }: VersionHeaderProps) {
  return (
    <div className="p-3 rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center gap-2 mb-1">
        <Badge variant="default" size="sm">
          {label}
        </Badge>
        <span className="font-medium text-slate-900">v{version.version_number}</span>
      </div>
      <p className="text-sm text-slate-600 truncate">{version.name}</p>
      <p className="text-xs text-slate-400 mt-1">
        {format(new Date(version.created_at), 'MMM d, yyyy h:mm a')}
      </p>
    </div>
  )
}

// =============================================================================
// Field Diff Row Component
// =============================================================================

interface FieldDiffRowProps {
  fieldDiff: FieldDiff
  isExpanded: boolean
  onToggle: () => void
}

function FieldDiffRow({ fieldDiff, isExpanded, onToggle }: FieldDiffRowProps) {
  const { fieldLabel, type, oldValue, newValue, textDiff } = fieldDiff

  const getTypeStyles = () => {
    switch (type) {
      case 'added':
        return {
          badge: 'success' as const,
          icon: Plus,
          label: 'Added',
        }
      case 'removed':
        return {
          badge: 'destructive' as const,
          icon: Minus,
          label: 'Removed',
        }
      case 'modified':
        return {
          badge: 'warning' as const,
          icon: Edit3,
          label: 'Modified',
        }
      default:
        return {
          badge: 'default' as const,
          icon: FileText,
          label: 'Unchanged',
        }
    }
  }

  const styles = getTypeStyles()
  const Icon = styles.icon
  const hasLongContent =
    (typeof oldValue === 'string' && oldValue.length > 100) ||
    (typeof newValue === 'string' && newValue.length > 100)

  return (
    <div className="border-b border-slate-200">
      {/* Field header */}
      <div
        className={`p-4 flex items-center justify-between ${
          hasLongContent ? 'cursor-pointer hover:bg-slate-50' : ''
        }`}
        onClick={hasLongContent ? onToggle : undefined}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-500" />
          <span className="font-medium text-slate-700">{fieldLabel}</span>
          <Badge variant={styles.badge} size="sm">
            {styles.label}
          </Badge>
        </div>
        {hasLongContent && (
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Field content */}
      {(isExpanded || !hasLongContent) && (
        <div className="px-4 pb-4">
          {type === 'added' && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <span className="text-sm text-green-800">
                {formatValueForDisplay(newValue)}
              </span>
            </div>
          )}

          {type === 'removed' && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <span className="text-sm text-red-800 line-through">
                {formatValueForDisplay(oldValue)}
              </span>
            </div>
          )}

          {type === 'modified' && (
            <div className="space-y-2">
              {textDiff ? (
                // Word-level diff for text fields
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <InlineTextDiff segments={textDiff} />
                </div>
              ) : (
                // Side-by-side for non-text fields
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <span className="text-xs font-medium text-red-700 block mb-1">
                      Before
                    </span>
                    <span className="text-sm text-red-800">
                      {formatValueForDisplay(oldValue)}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                    <span className="text-xs font-medium text-green-700 block mb-1">
                      After
                    </span>
                    <span className="text-sm text-green-800">
                      {formatValueForDisplay(newValue)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Inline Text Diff Component
// =============================================================================

interface InlineTextDiffProps {
  segments: Array<{
    type: 'added' | 'removed' | 'unchanged'
    value: string
  }>
}

function InlineTextDiff({ segments }: InlineTextDiffProps) {
  return (
    <span className="text-sm leading-relaxed whitespace-pre-wrap">
      {segments.map((segment, index) => {
        switch (segment.type) {
          case 'added':
            return (
              <span
                key={index}
                className="bg-green-200 text-green-900 px-0.5 rounded"
              >
                {segment.value}
              </span>
            )
          case 'removed':
            return (
              <span
                key={index}
                className="bg-red-200 text-red-900 px-0.5 rounded line-through"
              >
                {segment.value}
              </span>
            )
          default:
            return <span key={index}>{segment.value}</span>
        }
      })}
    </span>
  )
}
