/**
 * Version History Panel (F5.2)
 *
 * Displays artifact version history with ability to compare and restore versions.
 *
 * User Stories: US-021, US-022
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  History,
  X,
  ChevronRight,
  RotateCcw,
  GitCompare,
  User,
  Calendar,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { ArtifactVersion, VersionDiff } from '@/lib/versions'
import { VersionDiffViewer } from './version-diff-viewer'

interface VersionHistoryPanelProps {
  artifactId: string
  currentVersion: number
  isOpen: boolean
  onClose: () => void
  onRestore: (versionNumber: number) => Promise<void>
}

export function VersionHistoryPanel({
  artifactId,
  currentVersion,
  isOpen,
  onClose,
  onRestore,
}: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<ArtifactVersion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedVersions, setSelectedVersions] = useState<[number | null, number | null]>([null, null])
  const [compareMode, setCompareMode] = useState(false)
  const [diffData, setDiffData] = useState<{
    diff: VersionDiff
    versionFrom: ArtifactVersion
    versionTo: ArtifactVersion
  } | null>(null)
  const [diffLoading, setDiffLoading] = useState(false)
  const [restoring, setRestoring] = useState<number | null>(null)

  const fetchVersions = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/artifacts/${artifactId}/versions`)
      const data = await response.json()

      if (data.success) {
        setVersions(data.versions)
      } else {
        setError(data.error || 'Failed to load version history')
      }
    } catch (err) {
      console.error('Error fetching versions:', err)
      setError('Failed to load version history')
    } finally {
      setLoading(false)
    }
  }, [artifactId])

  useEffect(() => {
    if (isOpen) {
      fetchVersions()
    }
  }, [isOpen, fetchVersions])

  const handleVersionSelect = (versionNumber: number) => {
    if (compareMode) {
      if (selectedVersions[0] === null) {
        setSelectedVersions([versionNumber, null])
      } else if (selectedVersions[1] === null && selectedVersions[0] !== versionNumber) {
        const [first] = selectedVersions
        // Ensure versionFrom < versionTo
        const sorted: [number, number] = first! < versionNumber
          ? [first!, versionNumber]
          : [versionNumber, first!]
        setSelectedVersions(sorted)
        // Trigger comparison
        compareVersions(sorted[0], sorted[1])
      } else {
        // Reset selection
        setSelectedVersions([versionNumber, null])
        setDiffData(null)
      }
    }
  }

  const compareVersions = async (from: number, to: number) => {
    setDiffLoading(true)
    try {
      const response = await fetch(`/api/artifacts/${artifactId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionFrom: from, versionTo: to }),
      })
      const data = await response.json()

      if (data.success) {
        setDiffData({
          diff: data.diff,
          versionFrom: data.versionFromData,
          versionTo: data.versionToData,
        })
      }
    } catch (err) {
      console.error('Error comparing versions:', err)
    } finally {
      setDiffLoading(false)
    }
  }

  const handleRestore = async (versionNumber: number) => {
    setRestoring(versionNumber)
    try {
      await onRestore(versionNumber)
      await fetchVersions() // Refresh the list
    } finally {
      setRestoring(null)
    }
  }

  const toggleCompareMode = () => {
    setCompareMode(!compareMode)
    setSelectedVersions([null, null])
    setDiffData(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-white shadow-xl border-l border-slate-200 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100">
            <History className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Version History</h2>
            <p className="text-sm text-slate-500">
              {versions.length} version{versions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={compareMode ? 'primary' : 'outline'}
            size="sm"
            onClick={toggleCompareMode}
            className={compareMode ? 'bg-purple-600 hover:bg-purple-700' : ''}
          >
            <GitCompare className="h-4 w-4 mr-2" />
            {compareMode ? 'Exit Compare' : 'Compare'}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Compare Mode Instructions */}
      {compareMode && !diffData && (
        <div className="p-4 bg-purple-50 border-b border-purple-100">
          <p className="text-sm text-purple-700">
            {selectedVersions[0] === null
              ? 'Select the first version to compare'
              : 'Select the second version to compare'}
          </p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          </div>
        ) : error ? (
          <div className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        ) : diffData ? (
          // Show diff viewer
          <VersionDiffViewer
            diff={diffData.diff}
            versionFrom={diffData.versionFrom}
            versionTo={diffData.versionTo}
            onClose={() => {
              setDiffData(null)
              setSelectedVersions([null, null])
            }}
            onRestore={handleRestore}
            currentVersion={currentVersion}
          />
        ) : (
          // Show version list
          <div className="divide-y divide-slate-100">
            {versions.map((version) => (
              <VersionListItem
                key={version.id}
                version={version}
                isCurrent={version.version_number === currentVersion}
                isSelected={
                  selectedVersions[0] === version.version_number ||
                  selectedVersions[1] === version.version_number
                }
                compareMode={compareMode}
                restoring={restoring === version.version_number}
                onSelect={() => handleVersionSelect(version.version_number)}
                onRestore={() => handleRestore(version.version_number)}
                onCompareWithCurrent={() => {
                  setCompareMode(true)
                  setSelectedVersions([version.version_number, currentVersion])
                  compareVersions(version.version_number, currentVersion)
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Loading overlay for diff */}
      {diffLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Comparing versions...</p>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Version List Item
// =============================================================================

interface VersionListItemProps {
  version: ArtifactVersion
  isCurrent: boolean
  isSelected: boolean
  compareMode: boolean
  restoring: boolean
  onSelect: () => void
  onRestore: () => void
  onCompareWithCurrent: () => void
}

function VersionListItem({
  version,
  isCurrent,
  isSelected,
  compareMode,
  restoring,
  onSelect,
  onRestore,
  onCompareWithCurrent,
}: VersionListItemProps) {
  return (
    <div
      className={`p-4 hover:bg-slate-50 transition-colors ${
        isSelected ? 'bg-purple-50 border-l-2 border-purple-500' : ''
      } ${compareMode ? 'cursor-pointer' : ''}`}
      onClick={compareMode ? onSelect : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {compareMode && (
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                isSelected
                  ? 'border-purple-500 bg-purple-500 text-white'
                  : 'border-slate-300'
              }`}
            >
              {isSelected && <Check className="h-3 w-3" />}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900">
                Version {version.version_number}
              </span>
              {isCurrent && (
                <Badge variant="success" size="sm">
                  Current
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-600 mt-1">{version.name}</p>
            {version.change_summary && (
              <p className="text-sm text-slate-500 mt-1">{version.change_summary}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
              </span>
              {version.creator && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {version.creator.full_name || version.creator.email}
                </span>
              )}
            </div>
          </div>
        </div>

        {!compareMode && !isCurrent && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onCompareWithCurrent()
              }}
              title="Compare with current"
            >
              <GitCompare className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onRestore()
              }}
              disabled={restoring}
              title="Restore this version"
            >
              {restoring ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Version History Button (Trigger)
// =============================================================================

interface VersionHistoryButtonProps {
  version: number
  onClick: () => void
}

export function VersionHistoryButton({ version, onClick }: VersionHistoryButtonProps) {
  return (
    <Button variant="outline" onClick={onClick} className="gap-2">
      <History className="h-4 w-4" />
      <span>v{version}</span>
      <ChevronRight className="h-4 w-4" />
    </Button>
  )
}
