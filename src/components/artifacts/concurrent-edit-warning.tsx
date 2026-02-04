/**
 * Concurrent Edit Warning (F5.5)
 *
 * Modal dialog for handling concurrent editing conflicts.
 *
 * User Stories: US-023
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  X,
  RefreshCw,
  Save,
  User,
  Clock,
  FileText,
  Loader2,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { ConflictInfo, ConflictResolution } from '@/lib/versions'

interface ConcurrentEditWarningProps {
  isOpen: boolean
  conflict: ConflictInfo
  artifactName: string
  onResolve: (resolution: ConflictResolution) => Promise<void>
  onClose: () => void
}

export function ConcurrentEditWarning({
  isOpen,
  conflict,
  artifactName,
  onResolve,
  onClose,
}: ConcurrentEditWarningProps) {
  const [resolving, setResolving] = useState<ConflictResolution | null>(null)

  if (!isOpen || !conflict.hasConflict) return null

  const handleResolve = async (resolution: ConflictResolution) => {
    setResolving(resolution)
    try {
      await onResolve(resolution)
    } finally {
      setResolving(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 bg-amber-50 border-b border-amber-200">
          <div className="p-2 rounded-full bg-amber-100">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900">
              Concurrent Edit Detected
            </h2>
            <p className="text-sm text-amber-700">
              Someone else has modified this artifact
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Artifact info */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 mb-6">
            <FileText className="h-5 w-5 text-slate-400" />
            <div>
              <p className="font-medium text-slate-900">{artifactName}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="default" size="sm">
                  Your version: v{conflict.currentVersion - 1}
                </Badge>
                <Badge variant="warning" size="sm">
                  Current: v{conflict.currentVersion}
                </Badge>
              </div>
            </div>
          </div>

          {/* Conflict details */}
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-medium text-slate-700">Conflict Details</h3>
            <div className="space-y-2">
              {conflict.lastEditorEmail && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <User className="h-4 w-4 text-slate-400" />
                  <span>Last edited by: {conflict.lastEditorEmail}</span>
                </div>
              )}
              {conflict.lastEditedAt && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>
                    {formatDistanceToNow(new Date(conflict.lastEditedAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Resolution options */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-700">Resolution Options</h3>

            <ResolutionOption
              title="Overwrite"
              description="Save your changes and overwrite the current version"
              icon={Save}
              variant="warning"
              loading={resolving === 'overwrite'}
              disabled={resolving !== null}
              onClick={() => handleResolve('overwrite')}
            />

            <ResolutionOption
              title="Refresh & Review"
              description="Discard your changes and load the latest version"
              icon={RefreshCw}
              variant="default"
              loading={resolving === 'cancel'}
              disabled={resolving !== null}
              onClick={() => handleResolve('cancel')}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-center">
            Tip: Save your work frequently to avoid conflicts with other editors
          </p>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Resolution Option Component
// =============================================================================

interface ResolutionOptionProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  variant: 'default' | 'warning' | 'destructive'
  loading: boolean
  disabled: boolean
  onClick: () => void
}

function ResolutionOption({
  title,
  description,
  icon: Icon,
  variant,
  loading,
  disabled,
  onClick,
}: ResolutionOptionProps) {
  const variantStyles = {
    default: 'border-slate-200 hover:bg-slate-50 hover:border-slate-300',
    warning: 'border-amber-200 hover:bg-amber-50 hover:border-amber-300',
    destructive: 'border-red-200 hover:bg-red-50 hover:border-red-300',
  }

  const iconStyles = {
    default: 'text-slate-500',
    warning: 'text-amber-500',
    destructive: 'text-red-500',
  }

  return (
    <button
      className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
        variantStyles[variant]
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {loading ? (
            <Loader2 className={`h-5 w-5 animate-spin ${iconStyles[variant]}`} />
          ) : (
            <Icon className={`h-5 w-5 ${iconStyles[variant]}`} />
          )}
        </div>
        <div>
          <p className="font-medium text-slate-900">{title}</p>
          <p className="text-sm text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
    </button>
  )
}

// =============================================================================
// Edit Lock Indicator
// =============================================================================

interface EditLockIndicatorProps {
  lockedBy: string
  lockedAt: string
}

export function EditLockIndicator({ lockedBy, lockedAt }: EditLockIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-sm">
      <AlertTriangle className="h-4 w-4 text-amber-500" />
      <span className="text-amber-700">
        Being edited by <strong>{lockedBy}</strong>
        {' · '}
        {formatDistanceToNow(new Date(lockedAt), { addSuffix: true })}
      </span>
    </div>
  )
}

// =============================================================================
// Editing Badge
// =============================================================================

interface EditingBadgeProps {
  isEditing: boolean
  hasLock: boolean
}

export function EditingBadge({ isEditing, hasLock }: EditingBadgeProps) {
  if (!isEditing) return null

  return (
    <Badge
      variant={hasLock ? 'success' : 'warning'}
      size="sm"
      className="gap-1 animate-pulse"
    >
      <span className="w-2 h-2 rounded-full bg-current" />
      {hasLock ? 'Editing (locked)' : 'Editing'}
    </Badge>
  )
}
